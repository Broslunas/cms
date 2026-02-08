"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useGitHubLogin() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validar el origen por seguridad
      if (event.origin !== window.location.origin) return;
      
      if (event.data === "auth-complete") {
        router.refresh();
        router.push("/dashboard");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  const openLoginPopup = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      "/login?popup=true",
      "GitHubAuth",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    if (popup) {
      popup.focus();
    }
  };

  return { openLoginPopup };
}
