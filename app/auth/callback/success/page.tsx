"use client";

import { useEffect } from "react";

export default function AuthSuccessPage() {
  useEffect(() => {
    // Send message to parent window
    if (window.opener) {
      window.opener.postMessage("auth-complete", window.location.origin);
      // Close this window
      window.close();
    } else {
      // If opened directly, just redirect to dashboard
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-2xl font-bold">Authenticating...</h1>
      <p className="text-muted-foreground mt-2 text-center">
        Completing login and closing this window.
      </p>
    </div>
  );
}
