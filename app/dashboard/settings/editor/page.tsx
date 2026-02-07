import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EditorSettingsForm } from "./editor-settings-form"

export default async function SettingsEditorPage() {
  const session = await auth();
  
  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/");
  }

  // Verificar si el usuario tiene la app instalada
  if (!session.appInstalled) {
    redirect("/setup");
  }

  return <EditorSettingsForm />
}
