import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar si el usuario tiene la app instalada
  if (!session.appInstalled) {
    redirect("/setup");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile settings.
        </p>
      </div>
      <Separator />
      <ProfileForm user={session.user} />
    </div>
  );
}
