import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAppInstallUrl } from "@/lib/github-app";
import { Download, CheckCircle2, Github, ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallationChecker } from "@/components/InstallationChecker";

export default async function SetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // If the app is already installed, redirect to the dashboard
  if (session.appInstalled) {
    redirect("/dashboard");
  }

  const installUrl = getAppInstallUrl();
  const isConfigured = process.env.GITHUB_APP_NAME !== undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Github className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to the CMS!</CardTitle>
          <CardDescription className="text-base">
            To get started, you need to install our GitHub application
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isConfigured && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Configuration Error</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    The environment variable <code className="bg-destructive/20 px-1 rounded">GITHUB_APP_NAME</code> is not configured.
                    Please configure the environment variables in your hosting platform.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Install the GitHub App</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button below to install the application on your GitHub account.
                  This will allow us to access your repositories securely.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Select your repositories</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which repositories you want to manage with the CMS. You can select all
                  or just specific ones.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Start working!</h3>
                <p className="text-sm text-muted-foreground">
                  Once the app is installed, you will be automatically redirected to the dashboard
                  to start managing your content.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Required Permissions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The app needs permission to read and write to your repositories.
                  This allows us to sync your content securely.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="w-full sm:flex-1">
            <a href={installUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-5 w-5" />
              Install GitHub App
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:flex-1">
            <Link href="/dashboard">
              I already installed the app
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Component that automatically checks the installation */}
      <InstallationChecker />
    </div>
  );
}
