"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PopupSignIn() {
  useEffect(() => {
    signIn("github", { callbackUrl: "/auth/popup/success" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground font-medium">Connecting to GitHub...</p>
    </div>
  );
}
