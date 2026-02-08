"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";



import { useGitHubLogin } from "@/hooks/use-github-login";

interface LoginButtonProps {
  callbackUrl?: string;
  forcePopup?: boolean;
}

export default function LoginButton({ callbackUrl = "/dashboard", forcePopup = false }: LoginButtonProps) {
  const { openLoginPopup } = useGitHubLogin();

  const handleLogin = (e: React.MouseEvent) => {
    // If we are already in the success flow (inside a popup), just do the standard sign in
    if (callbackUrl.includes("/auth/popup/success")) {
       signIn("github", { callbackUrl });
       return;
    }

    // Otherwise, if we want to force a popup (e.g. from /login page accessed directly)
    // we interrupt the normal flow and open the popup instead.
    e.preventDefault();
    openLoginPopup();
  };

  return (
    <Button
      onClick={handleLogin}
      size="lg"
      className="gap-3 font-bold text-lg px-10 py-7 rounded-xl bg-slate-900 dark:bg-slate-50 dark:text-slate-900 hover:opacity-90 shadow-2xl transition-all duration-300 transform active:scale-95"
    >
      <Github className="w-6 h-6" />
      Continue with GitHub
    </Button>
  );
}
