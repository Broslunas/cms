import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import PopupSignIn from "@/components/PopupSignIn";
import { Github, ShieldCheck, Zap, Globe } from "lucide-react";
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <Github className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Broslunas CMS</h1>
          <p className="text-muted-foreground">
            Sign in with your GitHub account to start managing your projects.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-primary/5 backdrop-blur-sm">
          <div className="flex justify-center">
            <LoginButton callbackUrl={isPopup ? "/auth/popup/success" : "/dashboard"} />
          </div>
          
          <div className="mt-8 pt-8 border-t border-border">
            <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Secure authentication via NextAuth</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                <span>Instant sync with your repositories</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <span>Open-source and transparency-first</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
          By signing in, you agree to our{" "}
          <a href="/legal/terms" className="underline hover:text-primary transition-colors">Terms of Service</a>
          {" "}and{" "}
          <a href="/legal/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
