"use client";

import { Button } from "@/components/ui/button";
import { useGitHubLogin } from "@/hooks/use-github-login";

export function LoginButtonHeader() {
  const { openLoginPopup } = useGitHubLogin();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="font-semibold text-primary hover:bg-primary/10 transition-colors"
      onClick={openLoginPopup}
    >
      Inicia sesión
    </Button>
  );
}


