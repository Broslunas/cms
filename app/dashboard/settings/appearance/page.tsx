import { Separator } from "@/components/ui/separator";
import { AppearanceForm } from "./appearance-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsAppearancePage() {
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
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day and night themes.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
