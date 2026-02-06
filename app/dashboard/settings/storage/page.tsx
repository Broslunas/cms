import { Separator } from "@/components/ui/separator";
import { StorageForm } from "./storage-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsStoragePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Storage</h3>
        <p className="text-sm text-muted-foreground">
          Configure your S3-compatible storage for assets and images.
        </p>
      </div>
      <Separator />
      <StorageForm />
    </div>
  );
}
