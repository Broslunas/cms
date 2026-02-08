"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Send message to parent window
    if (window.opener) {
      window.opener.postMessage("auth-complete", window.location.origin);
      // Close this window with a small delay to ensure message is sent
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // If opened directly (not a popup), redirect to dashboard
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background animate-fade-in">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
        Authentication Complete
      </h1>
      <p className="text-muted-foreground mt-2 text-center animate-pulse">
        Closing window...
      </p>
    </div>
  );
}
