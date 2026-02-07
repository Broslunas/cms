import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NotificationsForm } from "./notifications-form"

export default async function SettingsNotificationsPage() {
  const session = await auth();
  
  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  // Verificar si el usuario tiene la app instalada
  if (!session.appInstalled) {
    redirect("/setup");
  }

  return <NotificationsForm />
}
