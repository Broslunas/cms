
"use client";

import { AlertTriangle, Globe, Rocket, CheckCircle2, Lock, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RepoSettingsFormProps {
  isConfigured: boolean | null;
  isLoadingSettings: boolean;
  isSharedRepo: boolean;
  projectId: string;
  setProjectId: (id: string) => void;
  token: string;
  setToken: (token: string) => void;
  useGlobalToken: boolean;
  setUseGlobalToken: (use: boolean) => void;
  globalTokenDisplay: string | null;
  handleDetectProject: () => void;
  isDetecting: boolean;
  s3Endpoint: string;
  setS3Endpoint: (e: string) => void;
  s3Region: string;
  setS3Region: (r: string) => void;
  s3AccessKey: string;
  setS3AccessKey: (k: string) => void;
  s3SecretKey: string;
  setS3SecretKey: (k: string) => void;
  s3Bucket: string;
  setS3Bucket: (b: string) => void;
  s3PublicUrl: string;
  setS3PublicUrl: (u: string) => void;
  useGlobalS3: boolean;
  setUseGlobalS3: (use: boolean) => void;
  useGlobalCredentials: boolean;
  setUseGlobalCredentials: (use: boolean) => void;
  globalS3Display: string | null;
  handleSaveSettings: () => void;
  saving: boolean;
  showSettings: boolean;
}

export function RepoSettingsForm({
  isConfigured,
  isLoadingSettings,
  isSharedRepo,
  projectId,
  setProjectId,
  token,
  setToken,
  useGlobalToken,
  setUseGlobalToken,
  globalTokenDisplay,
  handleDetectProject,
  isDetecting,
  s3Endpoint,
  setS3Endpoint,
  s3Region,
  setS3Region,
  s3AccessKey,
  setS3AccessKey,
  s3SecretKey,
  setS3SecretKey,
  s3Bucket,
  setS3Bucket,
  s3PublicUrl,
  setS3PublicUrl,
  useGlobalS3,
  setUseGlobalS3,
  useGlobalCredentials,
  setUseGlobalCredentials,
  globalS3Display,
  handleSaveSettings,
  saving,
  showSettings
}: RepoSettingsFormProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {!isConfigured && !showSettings && (
          <Card className="bg-yellow-500/10 border-yellow-500/20 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Not Configured</span>
              </div>
              <p className="text-sm text-muted-foreground">Connect your Vercel project to see deployment status.</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-500/5 border-blue-500/10 shadow-none">
          <CardContent className="pt-4 flex gap-3 items-start">
            <Globe className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Recordatorio de Vercel</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Si usas una cuenta gratuita de Vercel, el repositorio debe ser público para que las builds se ejecuten
                correctamente. Los repositorios privados requieren un plan Pro o Enterprise.
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
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : isSharedRepo ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 p-4 rounded-md border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-semibold text-sm">Repositorio Compartido</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este repositorio es compartido. Solo el propietario puede configurar el despliegue y el
                  almacenamiento.
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
                  <Label htmlFor="use-global-vercel" className="cursor-pointer text-sm font-normal">
                    Use Global Vercel Token
                  </Label>
                </div>

                {useGlobalToken ? (
                  <div className="bg-secondary/20 p-3 rounded-md border text-xs">
                    {globalTokenDisplay ? (
                      <p className="text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Token ({globalTokenDisplay})
                      </p>
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
                <Checkbox id="use-global-s3" checked={useGlobalS3} onCheckedChange={(c) => setUseGlobalS3(!!c)} />
                <Label htmlFor="use-global-s3" className="cursor-pointer text-sm font-normal">
                  Use Global Storage Settings
                </Label>
              </div>

              {useGlobalS3 ? (
                <div className="bg-secondary/20 p-3 rounded-md border text-xs">
                  {globalS3Display ? (
                    <p className="text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Using bucket: {globalS3Display}
                    </p>
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
                      <Label htmlFor="use-global-creds" className="cursor-pointer text-xs font-normal">
                        Use Global Keys (Access/Secret)
                      </Label>
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
  );
}
