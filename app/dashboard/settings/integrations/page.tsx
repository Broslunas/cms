"use client"

import { Separator } from "@/components/ui/separator"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Check, X } from "lucide-react"

export default function SettingsIntegrationsPage() {
  const [loading, setLoading] = useState(false)
  const [vercelToken, setVercelToken] = useState("")
  const [initialLoading, setInitialLoading] = useState(true)
  const [githubInstalled, setGithubInstalled] = useState<boolean | null>(null)

  useEffect(() => {
    fetchSettings()
    checkGithubInstallation()
  }, [])

  const fetchSettings = async () => {
    try {
        const res = await fetch("/api/settings")
        if (res.ok) {
            const data = await res.json()
            setVercelToken(data.vercelGlobalToken || "")
        }
    } catch (error) {
        console.error("Failed to fetch settings", error)
    } finally {
        setInitialLoading(false)
    }
  }

  const checkGithubInstallation = async () => {
      try {
          const res = await fetch("/api/check-installation")
          const data = await res.json()
          setGithubInstalled(data.isInstalled)
      } catch (error) {
          console.error("Failed to check GitHub installation", error)
      }
  }

  const onSaveVercel = async () => {
    setLoading(true)
    try {
        const res = await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vercelGlobalToken: vercelToken })
        })
        
        if (res.ok) {
            toast.success("Vercel token updated")
        } else {
            toast.error("Failed to update token")
        }
    } catch (error) {
        toast.error("An error occurred")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect your account with third-party services.
        </p>
      </div>
      <Separator />
      
      <div className="space-y-8">
        {/* Vercel Integration */}
        <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                        ▲
                    </div>
                    <div>
                        <h4 className="font-medium">Vercel</h4>
                        <p className="text-sm text-muted-foreground">Deploy your projects automatically.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {vercelToken ? (
                        <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3 mr-1"/> Connected
                        </span>
                    ) : (
                        <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            Not Connected
                        </span>
                    )}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="vercel_token">Global API Token</Label>
                <div className="flex gap-2">
                    <Input 
                        id="vercel_token" 
                        type="password" 
                        value={vercelToken} 
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="ey..." 
                    />
                    <Button onClick={onSaveVercel} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Create a token in your <a href="https://vercel.com/account/tokens" target="_blank" className="underline hover:text-primary">Vercel Account Settings</a>.
                </p>
            </div>
        </div>

        {/* GitHub Integration */}
         <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-medium">GitHub</h4>
                        <p className="text-sm text-muted-foreground">Manage your repositories.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {githubInstalled === true ? (
                         <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3 mr-1"/> Installed
                        </span>
                    ) : (
                         <span className="flex items-center text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                            Not Installed
                        </span>
                    )}
                </div>
            </div>
            
             <div className="flex justify-end gap-2">
                {githubInstalled !== true && (
                     <a 
                        href="https://github.com/apps/broslunas-cms-app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "outline" })}
                     >
                        Install GitHub App
                    </a>
                )}
                 {githubInstalled === true && (
                     <a 
                        href="https://github.com/settings/installations" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "ghost" })}
                     >
                        Manage on GitHub
                    </a>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
