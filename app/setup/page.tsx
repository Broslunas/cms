import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAppInstallUrl } from "@/lib/github-app";
import { Download, CheckCircle2, Github, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallationChecker } from "@/components/InstallationChecker";

export default async function SetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Si ya tiene la app instalada, redirigir al dashboard
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
          <CardTitle className="text-3xl">¡Bienvenido al CMS!</CardTitle>
          <CardDescription className="text-base">
            Para comenzar, necesitas instalar nuestra aplicación de GitHub
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isConfigured && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error de configuración</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    La variable de entorno <code className="bg-destructive/20 px-1 rounded">GITHUB_APP_NAME</code> no está configurada.
                    Por favor, configura las variables de entorno en tu plataforma de hosting.
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
                <h3 className="font-semibold">Instala la GitHub App</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en el botón de abajo para instalar la aplicación en tu cuenta de GitHub.
                  Esto nos permitirá acceder a tus repositorios de forma segura.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Selecciona tus repositorios</h3>
                <p className="text-sm text-muted-foreground">
                  Elige qué repositorios quieres gestionar con el CMS. Puedes seleccionar todos
                  o solo algunos específicos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">¡Comienza a trabajar!</h3>
                <p className="text-sm text-muted-foreground">
                  Una vez instalada la app, serás redirigido automáticamente al dashboard
                  para empezar a gestionar tu contenido.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Permisos necesarios</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La app necesita permiso para leer y escribir en tus repositorios.
                  Esto nos permite sincronizar tu contenido de forma segura.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="w-full sm:flex-1">
            <a href={installUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-5 w-5" />
              Instalar GitHub App
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:flex-1">
            <Link href="/dashboard">
              Ya instalé la app
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Componente que verifica automáticamente la instalación */}
      <InstallationChecker />
    </div>
  );
}
