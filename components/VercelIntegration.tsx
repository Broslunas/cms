
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
    X, Settings, Loader2, Rocket
} from "lucide-react";
import { toast } from "sonner";
import { DeploymentList } from "./DeploymentList";
import { RepoSettingsForm } from "./RepoSettingsForm";

interface Deployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED";
  inspectorUrl: string;
  commit?: {
      message: string;
      commitSha: string;
      commitAuthorName: string;
  }
}


interface ProjectSettingsProps {
  repoId: string;
}

export function ProjectSettings({ repoId }: ProjectSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Settings Form State
  const [projectId, setProjectId] = useState("");
  const [token, setToken] = useState("");
  const [useGlobalToken, setUseGlobalToken] = useState(false);
  const [globalTokenDisplay, setGlobalTokenDisplay] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSharedRepo, setIsSharedRepo] = useState(false);
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
              setIsConfigured(!!data.vercelConfig?.projectId);
          }
      } catch (e) {
          console.error("Failed to fetch repo settings");
      } finally {
          setIsLoadingSettings(false);
      }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGlobalSettings();
      fetchRepoSettings();
    }
  }, [isOpen, repoId]);

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

  const handleSaveSettings = async () => {
      setSaving(true);
      try {
          const res = await fetch("/api/repo/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  repoId,
                  vercelProjectId: projectId,
                  vercelToken: useGlobalToken ? undefined : token, 
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
          setIsConfigured(true);
          setIsOpen(false);
      } catch (error) {
          toast.error("Failed to save settings");
      } finally {
          setSaving(false);
      }
  };

  if (!isOpen) {
      return (
          <Button onClick={() => setIsOpen(true)} variant="outline" size="icon" title="Project Settings">
              <Settings className="h-4 w-4" />
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
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Project Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">Configuration for Vercel & Storage</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <RepoSettingsForm 
                    isConfigured={isConfigured}
                    isLoadingSettings={isLoadingSettings}
                    isSharedRepo={isSharedRepo}
                    projectId={projectId}
                    setProjectId={setProjectId}
                    token={token}
                    setToken={setToken}
                    useGlobalToken={useGlobalToken}
                    setUseGlobalToken={setUseGlobalToken}
                    globalTokenDisplay={globalTokenDisplay}
                    handleDetectProject={handleDetectProject}
                    isDetecting={isDetecting}
                    s3Endpoint={s3Endpoint}
                    setS3Endpoint={setS3Endpoint}
                    s3Region={s3Region}
                    setS3Region={setS3Region}
                    s3AccessKey={s3AccessKey}
                    setS3AccessKey={setS3AccessKey}
                    s3SecretKey={s3SecretKey}
                    setS3SecretKey={setS3SecretKey}
                    s3Bucket={s3Bucket}
                    setS3Bucket={setS3Bucket}
                    s3PublicUrl={s3PublicUrl}
                    setS3PublicUrl={setS3PublicUrl}
                    useGlobalS3={useGlobalS3}
                    setUseGlobalS3={setUseGlobalS3}
                    useGlobalCredentials={useGlobalCredentials}
                    setUseGlobalCredentials={setUseGlobalCredentials}
                    globalS3Display={globalS3Display}
                    handleSaveSettings={handleSaveSettings}
                    saving={saving}
                    showSettings={showSettings}
                />
            </div>
         </div>
      </div>
    </>
  );
}

export function VercelDeployments({ repoId }: { repoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vercel/deployments?repoId=${encodeURIComponent(repoId)}`);
      const data = await res.json();

      if (res.status === 404 && data.invalidProject) {
          setIsConfigured(false);
          toast.error("Invalid Vercel Project ID");
      } else if (res.status === 401 && data.invalidToken) {
          setIsConfigured(false);
          toast.error("Invalid Vercel Token");
      } else if (data.notConfigured) {
          setIsConfigured(false);
      } else if (Array.isArray(data.deployments)) {
          setIsConfigured(true);
          setDeployments(data.deployments);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, repoId]);

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
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Deployments
                    </h2>
                    <p className="text-sm text-muted-foreground">Recent Vercel activity</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {loading && deployments.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !isConfigured ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                        <Rocket className="h-12 w-12 text-muted-foreground/30" />
                        <h3 className="font-semibold">Vercel not configured</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your Vercel Project ID and Token in Project Settings to see deployments.
                        </p>
                    </div>
                ) : (
                    <DeploymentList 
                        deployments={deployments} 
                        loading={loading} 
                        onRefresh={fetchData} 
                    />
                )}
            </div>
         </div>
      </div>
    </>
  );
}
