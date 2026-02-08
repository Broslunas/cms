import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import PopupSignIn from "@/components/PopupSignIn";
import LoginContent from "./login-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Broslunas CMS account to manage your content collections.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const isPopup = resolvedParams?.popup === "true";

  if (session && !isPopup) {
    redirect("/dashboard");
  }

  // If already logged in and it IS a popup, we might want to just close it or show success
  // But usually the callback handles that. If the user navigates to /login?popup=true while logged in,
  // we could redirect to success immediately.
  if (session && isPopup) {
     redirect("/auth/popup/success");
  }

  if (isPopup) {
    return <PopupSignIn />;
  }

  return <LoginContent />;
}
