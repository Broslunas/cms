
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

  // S3 Form State
  const [s3Endpoint, setS3Endpoint] = useState("");
  const [s3Region, setS3Region] = useState("");
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3PublicUrl, setS3PublicUrl] = useState("");
  const [useGlobalS3, setUseGlobalS3] = useState(true);
  const [useGlobalCredentials, setUseGlobalCredentials] = useState(false);
  
  const [globalS3Display, setGlobalS3Display] = useState<string | null>(null);

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
              setGlobalS3Display(data.s3Bucket ? `${data.s3Bucket} (${data.s3Region || 'auto'})` : null);
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
              
              setS3Endpoint(data.s3Config?.endpoint || "");
              setS3Region(data.s3Config?.region || "");
              setS3AccessKey(data.s3Config?.accessKey || "");
              setS3SecretKey(data.s3Config?.secretKey || "");
              setS3Bucket(data.s3Config?.bucket || "");
              setS3PublicUrl(data.s3Config?.publicUrl || "");
              setUseGlobalS3(data.s3Config?.useGlobalS3 !== false); 
              setUseGlobalCredentials(!!data.s3Config?.useGlobalCredentials);

              setIsSharedRepo(!!data.isShared); 
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
                  useGlobalToken,
                  s3Endpoint,
                  s3Region,
                  s3AccessKey,
                  s3SecretKey,
                  s3Bucket,
                  s3PublicUrl,
                  useGlobalS3,
                  useGlobalCredentials
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
                        Project Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">Monitoring & Configuration</p>
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
            <div className="flex-1 overflow-hidden">
                {loading && !showSettings && deployments.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !isConfigured || showSettings ? (
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
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

                        <Card className="bg-blue-500/5 border-blue-500/10 shadow-none">
                            <CardContent className="pt-4 flex gap-3 items-start">
                                <Globe className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Recordatorio de Vercel</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Si usas una cuenta gratuita de Vercel, el repositorio debe ser público para que las builds se ejecuten correctamente. 
                                        Los repositorios privados requieren un plan Pro o Enterprise.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2 pt-4 border-t">
                                <Rocket className="h-4 w-4" />
                                Vercel Deployment
                            </h3>
                            
                            {isLoadingSettings ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : isSharedRepo ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-500/10 p-4 rounded-md border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                            <Lock className="h-4 w-4" />
                                            <span className="font-semibold text-sm">Repositorio Compartido</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Este repositorio es compartido. Solo el propietario puede configurar el despliegue y el almacenamiento.
                                        </p>
                                    </div>

                                    {projectId && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">Project ID (Vercel)</Label>
                                            <Input value={projectId} disabled className="h-8 text-xs bg-muted/50" />
                                        </div>
                                    )}
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
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Checkbox 
                                                id="use-global-vercel" 
                                                checked={useGlobalToken}
                                                onCheckedChange={(c) => setUseGlobalToken(!!c)}
                                            />
                                            <Label htmlFor="use-global-vercel" className="cursor-pointer text-sm font-normal">Use Global Vercel Token</Label>
                                        </div>

                                        {useGlobalToken ? (
                                            <div className="bg-secondary/20 p-3 rounded-md border text-xs">
                                                {globalTokenDisplay ? (
                                                     <p className="text-green-600 flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Token ({globalTokenDisplay})</p>
                                                ) : (
                                                     <p className="text-yellow-600">No global token set</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Input 
                                                    type="password" 
                                                    placeholder="Project Token" 
                                                    value={token} 
                                                    onChange={(e) => setToken(e.target.value)} 
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <h3 className="font-medium flex items-center gap-2 pt-4 border-t">
                                <Globe className="h-4 w-4" />
                                Storage (S3 / R2)
                            </h3>

                            {isSharedRepo ? (
                                <div className="bg-blue-500/10 p-3 rounded-md text-xs text-blue-600">
                                    Controlled by repository owner.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="use-global-s3" 
                                            checked={useGlobalS3}
                                            onCheckedChange={(c) => setUseGlobalS3(!!c)}
                                        />
                                        <Label htmlFor="use-global-s3" className="cursor-pointer text-sm font-normal">Use Global Storage Settings</Label>
                                    </div>

                                    {useGlobalS3 ? (
                                        <div className="bg-secondary/20 p-3 rounded-md border text-xs">
                                            {globalS3Display ? (
                                                <p className="text-green-600 flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Using bucket: {globalS3Display}</p>
                                            ) : (
                                                <p className="text-yellow-600">Global storage not configured</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">S3 Endpoint</Label>
                                                <Input 
                                                    placeholder="https://..." 
                                                    value={s3Endpoint} 
                                                    onChange={(e) => setS3Endpoint(e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Bucket</Label>
                                                    <Input 
                                                        placeholder="bucket-name" 
                                                        value={s3Bucket} 
                                                        onChange={(e) => setS3Bucket(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Region</Label>
                                                    <Input 
                                                        placeholder="auto" 
                                                        value={s3Region} 
                                                        onChange={(e) => setS3Region(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Checkbox 
                                                        id="use-global-creds" 
                                                        checked={useGlobalCredentials}
                                                        onCheckedChange={(c) => setUseGlobalCredentials(!!c)}
                                                    />
                                                    <Label htmlFor="use-global-creds" className="cursor-pointer text-xs font-normal">Use Global Keys (Access/Secret)</Label>
                                                </div>

                                                {!useGlobalCredentials && (
                                                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div className="grid gap-2">
                                                            <Label className="text-xs">Access Key</Label>
                                                            <Input 
                                                                type="password"
                                                                placeholder="Key ID" 
                                                                value={s3AccessKey} 
                                                                onChange={(e) => setS3AccessKey(e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="text-xs">Secret Key</Label>
                                                            <Input 
                                                                type="password"
                                                                placeholder="Secret" 
                                                                value={s3SecretKey} 
                                                                onChange={(e) => setS3SecretKey(e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Public URL (CDN)</Label>
                                                <Input 
                                                    placeholder="https://cdn.com" 
                                                    value={s3PublicUrl} 
                                                    onChange={(e) => setS3PublicUrl(e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button className="w-full mt-6" onClick={handleSaveSettings} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Project Settings
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            ) : (
                    <div className="h-full flex flex-col p-6">
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
