"use client"

import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

export default function SettingsNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [emailDigest, setEmailDigest] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [marketing, setMarketing] = useState(false)

  const onSave = () => {
    setLoading(true)
    setTimeout(() => {
        setLoading(false)
        toast.success("Notification preferences updated")
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>
      <Separator />

      <div className="space-y-8">
        <div className="space-y-4">
             <h4 className="text-base font-medium">Email Notifications</h4>
             <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive a weekly summary of your content performance.
                        </p>
                    </div>
                    <Switch checked={emailDigest} onCheckedChange={() => setEmailDigest(!emailDigest)} />
                </div>

                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Security Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive alerts about suspicious login attempts.
                        </p>
                    </div>
                    <Switch checked={securityAlerts} onCheckedChange={() => setSecurityAlerts(!securityAlerts)} />
                </div>

                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Marketing & Updates</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive news about new features and improvements.
                        </p>
                    </div>
                    <Switch checked={marketing} onCheckedChange={() => setMarketing(!marketing)} />
                </div>
            </div>
        </div>

        <div className="flex justify-end">
             <Button onClick={onSave} disabled={loading}>
                 {loading ? "Saving..." : "Save Preferences"}
             </Button>
        </div>
      </div>
    </div>
  );
}
