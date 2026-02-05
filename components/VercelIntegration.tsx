
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Badge component not available
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    X, Settings, Loader2, CheckCircle2, XCircle, Clock, ExternalLink, 
    Rocket, RefreshCw, AlertTriangle, Globe, Lock, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Deployment {
  uid: string;
  name: string;
  url: string; // The deployment URL
  created: number; // timestamp
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED";
  inspectorUrl: string; // link to vercel dashboard
  commit?: {
      message: string;
      commitSha: string;
      commitAuthorName: string;
  }
}

export function VercelWidget({ repoId }: { repoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null); // null = checkout pending
  const [showSettings, setShowSettings] = useState(false);

  // Settings Form State
  const [projectId, setProjectId] = useState("");
  const [token, setToken] = useState("");
  
  // Global Token State
  const [useGlobalToken, setUseGlobalToken] = useState(false);
  const [globalTokenDisplay, setGlobalTokenDisplay] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  
  // Shared repo tracking
  const [isSharedRepo, setIsSharedRepo] = useState(false);
  
  // Global Token Management
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [newGlobalToken, setNewGlobalToken] = useState("");



  const [saving, setSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectProject = async () => {
    if (!useGlobalToken && !token) {
        toast.error("Please enter a token first to detect project");
        return;
    }

    setIsDetecting(true);
    try {
        const res = await fetch("/api/vercel/detect-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                repoId,
                token: useGlobalToken ? undefined : token,
                useGlobalToken
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            toast.error(data.error || "Failed to detect project");
            return;
        }

        if (data.found && data.projectId) {
            setProjectId(data.projectId);
            toast.success(`Found project: ${data.projectName}`);
        } else {
            toast.warning("No matching project found for this repository");
        }
    } catch (error) {
        toast.error("Error during detection");
    } finally {
        setIsDetecting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vercel/deployments?repoId=${encodeURIComponent(repoId)}`);
      const data = await res.json();

      if (res.status === 404 && data.invalidProject) {
          setIsConfigured(false); // Configured but invalid project ID
          toast.error("Invalid Vercel Project ID");
      } else if (res.status === 401 && data.invalidToken) {
          setIsConfigured(false); // Configured but invalid Token
          toast.error("Invalid Vercel Token");
      } else if (data.notConfigured) {
          setIsConfigured(false);
      } else if (Array.isArray(data.deployments)) {
          setIsConfigured(true);
          setDeployments(data.deployments);
      } else {
          // If configured false but 200 OK?? unlikely given the logic
          // catch unexpected structure
          if (Array.isArray(data.deployments)) {
             setDeployments(data.deployments);
             setIsConfigured(true);
          } else {
             // Maybe empty list
             // toast.error("Unexpected response from server");
          }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
      try {
          const res = await fetch("/api/settings");
          if (res.ok) {
              const data = await res.json();
              setGlobalTokenDisplay(data.vercelGlobalToken ? `...${data.vercelGlobalToken.slice(-5)}` : null);
          }
      } catch (e) {
          console.error("Failed to fetch global settings");
      }
  };

  const fetchRepoSettings = async () => {
      setIsLoadingSettings(true);
      try {
          const res = await fetch(`/api/repo/settings?repoId=${encodeURIComponent(repoId)}`);
          if (res.ok) {
              const data = await res.json();
              setProjectId(data.vercelConfig?.projectId || "");
              setToken(data.vercelConfig?.token || "");
              setUseGlobalToken(!!data.vercelConfig?.useGlobalToken);
              setIsSharedRepo(!!data.isShared); // Track if this is a shared repo
          }
      } catch (e) {
          console.error("Failed to fetch repo settings");
      } finally {
          setIsLoadingSettings(false);
      }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      fetchGlobalSettings();
    }
  }, [isOpen, repoId]);

  useEffect(() => {
      if (showSettings) {
          fetchRepoSettings();
      }
  }, [showSettings]);

  const handleSaveGlobal = async () => {
      if (!newGlobalToken) return;
      try {
          const res = await fetch("/api/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vercelGlobalToken: newGlobalToken })
          });
          if (!res.ok) throw new Error("Failed");
          
          toast.success("Global token updated!");
          setGlobalTokenDisplay(`...${newGlobalToken.slice(-5)}`);
          setNewGlobalToken("");
          setIsEditingGlobal(false);
          // Auto-enable global token usage if updating
          if (!globalTokenDisplay) setUseGlobalToken(true);
      } catch (e) {
          toast.error("Failed to update global token");
      }
  };

  const handleSaveSettings = async () => {
      setSaving(true);
      try {
          const res = await fetch("/api/repo/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  repoId,
                  vercelProjectId: projectId,
                  vercelToken: useGlobalToken ? undefined : token, // Don't save local token if using global, or keep it?
                  // Better to keep the local token in state but flag determines usage.
                  // Current code in API updates if not undefined. 
                  // If we want to CLEAR local token, we'd need to send null or special value?
                  // For now, let's just send what we have, but the useGlobalToken flag is what matters.
                  // API will update `useGlobalToken`.
                  useGlobalToken
              })
          });
          
          if (!res.ok) throw new Error("Failed to save");
          
          toast.success("Settings saved!");
          setIsConfigured(true); // Should verify, but optimistic is fine
          setShowSettings(false);
          fetchData(); // Reload deployments
          // refetch settings to be sure
          fetchRepoSettings();
      } catch (error) {
          toast.error("Failed to save settings");
      } finally {
          setSaving(false);
      }
  };

  if (!isOpen) {
      return (
          <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
              <Rocket className="h-4 w-4" />
              Deployments
          </Button>
      );
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l shadow-2xl transition-transform duration-300 ease-in-out transform translate-x-0">
         <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Vercel Status
                    </h2>
                    <p className="text-sm text-muted-foreground">Monitoring deployments</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-6">
                {loading && !showSettings && deployments.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !isConfigured || showSettings ? (
                    <div className="space-y-6">
                        {!isConfigured && !showSettings && (
                             <Card className="bg-yellow-500/10 border-yellow-500/20 shadow-none">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-semibold">Not Configured</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Connect your Vercel project to see deployment status.
                                    </p>
                                </CardContent>
                             </Card>
                        )}
                        
                        <div className="space-y-4">
                            <h3 className="font-medium">Configuration</h3>
                            
                            {isLoadingSettings ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : isSharedRepo ? (
                                // Read-only view for shared repositories
                                <div className="space-y-4">
                                    <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                                <Lock className="h-5 w-5" />
                                                <span className="font-semibold">Shared Repository</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                This repository is shared with you. The deployment configuration is managed by the repository owner.
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {projectId && (
                                        <div className="space-y-2">
                                            <Label>Vercel Project ID (Read-only)</Label>
                                            <Input 
                                                value={projectId} 
                                                disabled
                                                className="bg-muted/50"
                                            />
                                        </div>
                                    )}

                                    <div className="bg-secondary/20 p-4 rounded-md border">
                                        <p className="text-sm text-muted-foreground">
                                            {useGlobalToken ? "Using owner's global token" : "Using owner's project-specific token"}
                                        </p>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={() => setShowSettings(false)}
                                    >
                                        Close Settings
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Vercel Project ID</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="prj_..." 
                                                value={projectId} 
                                                onChange={(e) => setProjectId(e.target.value)} 
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleDetectProject}
                                                disabled={isDetecting || (!useGlobalToken && !token)}
                                                title="Auto-detect Project ID"
                                            >
                                                {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Found in Vercel Project Settings {'>'} General {'>'} Project ID
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Checkbox 
                                                id="use-global" 
                                                checked={useGlobalToken}
                                                onCheckedChange={(c) => setUseGlobalToken(!!c)}
                                            />
                                            <Label htmlFor="use-global" className="cursor-pointer">Use Global Token</Label>
                                        </div>

                                        {useGlobalToken ? (
                                            <div className="bg-secondary/20 p-4 rounded-md border">
                                                {globalTokenDisplay ? (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span>Token configured ({globalTokenDisplay})</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingGlobal(!isEditingGlobal)}>
                                                            Edit
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-yellow-600 mb-2">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span>No global token set</span>
                                                        <Button variant="link" size="sm" className="h-auto p-0 ml-auto" onClick={() => setIsEditingGlobal(true)}>
                                                             Add Global Token
                                                        </Button>
                                                    </div>
                                                )}

                                                {isEditingGlobal && (
                                                    <div className="mt-3 space-y-2">
                                                        <Input 
                                                            type="password"
                                                            placeholder="New Global Token (ey...)"
                                                            value={newGlobalToken}
                                                            onChange={(e) => setNewGlobalToken(e.target.value)}
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingGlobal(false)}>Cancel</Button>
                                                            <Button size="sm" onClick={handleSaveGlobal} disabled={!newGlobalToken}>Save Global</Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Project Access Token</Label>
                                                <Input 
                                                    type="password" 
                                                    placeholder="Enter your token for this repo" 
                                                    value={token} 
                                                    onChange={(e) => setToken(e.target.value)} 
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Specific token for this repository only.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <Button className="w-full mt-4" onClick={handleSaveSettings} disabled={saving}>
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Save Integration
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Recent Deployments</h3>
                             <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                             </Button>
                        </div>
                        
                        <ScrollArea className="flex-1 -mr-4 pr-4">
                            <div className="space-y-3">
                                {deployments.map((deploy) => (
                                    <Card key={deploy.uid} className="overflow-hidden">
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {deploy.state === "READY" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                    {deploy.state === "ERROR" && <XCircle className="h-4 w-4 text-red-500" />}
                                                    {(deploy.state === "BUILDING" || deploy.state === "QUEUED") && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                                    {deploy.state === "CANCELED" && <XCircle className="h-4 w-4 text-gray-500" />}
                                                    
                                                    <span className={`text-sm font-medium ${
                                                        deploy.state === "READY" ? "text-green-600" :
                                                        deploy.state === "ERROR" ? "text-red-600" :
                                                        "text-foreground"
                                                    }`}>
                                                        {deploy.state}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(deploy.created).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-1 mb-3">
                                                <p className="text-sm font-medium truncate">{deploy.commit?.message || "No commit message"}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{deploy.commit?.commitSha?.substring(0,7)}</p>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {deploy.url && (
                                                    <a href={`https://${deploy.url}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                                            <ExternalLink className="mr-2 h-3 w-3" /> Preview
                                                        </Button>
                                                    </a>
                                                )}
                                                <a href={deploy.inspectorUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                    <Button variant="secondary" size="sm" className="w-full text-xs h-8">
                                                        Inspect
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
         </div>
      </div>
    </>
  );
}
