import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ExportDataButton } from "./export-data-button"

export default async function SettingsAccountPage() {
  const session = await auth();
  
    if (!session?.user || session.error === "RefreshAccessTokenError") {
      redirect("/");
    }
  
    // Verificar si el usuario tiene la app instalada
    if (!session.appInstalled) {
      redirect("/setup");
    }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Update your account settings and security preferences.
        </p>
      </div>
      <Separator />

      <div className="space-y-8">
         <div className="grid gap-4">
            <h4 className="text-base font-medium">Security</h4>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account.
                    </p>
                </div>
                <Switch disabled aria-label="Toggle 2FA" />
            </div>
            
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Password</Label>
                    <p className="text-sm text-muted-foreground">
                        Review your password and security settings.
                    </p>
                </div>
                <Button variant="outline">Change Password</Button>
            </div>
        </div>

        <div className="grid gap-4">
            <h4 className="text-base font-medium">Data & Privacy</h4>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Export Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Download a copy of your personal data.
                    </p>
                </div>
                <ExportDataButton />
            </div>
        </div>

        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <h4 className="text-destructive font-medium mb-2">Danger Zone</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Irreversibly delete your account and all your data.
          </p>
          <Button variant="destructive">
             Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
