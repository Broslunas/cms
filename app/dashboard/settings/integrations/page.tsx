import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { IntegrationsForm } from "./integrations-form"

export default async function SettingsIntegrationsPage() {
  const session = await auth();
  
  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/login");
  }

  // Verificar si el usuario tiene la app instalada
  if (!session.appInstalled) {
    redirect("/setup");
  }

  return <IntegrationsForm />
}
