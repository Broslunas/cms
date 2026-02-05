"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface GitHubInvitation {
  id: number;
  repository: {
    full_name: string;
    html_url: string;
    description?: string;
  };
  inviter: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
}

interface RepoInvitationAlertProps {
  repoId: string;
}

export function RepoInvitationAlert({ repoId }: RepoInvitationAlertProps) {
  const [loading, setLoading] = useState(true);
  const [visibleRepos, setVisibleRepos] = useState<string[]>([]);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [repoId]);

  const checkAccess = async () => {
    try {
      const res = await fetch(`/api/github/invitations?repoId=${encodeURIComponent(repoId)}`);
      if (res.ok) {
        const data = await res.json();
        setVisibleRepos(data.visibleRepos || []);
        setGithubUser(data.githubUser);
      } else {
        const data = await res.json();
        if (data.code === "MISSING_SCOPE") {
          setScopeError(true);
        }
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (scopeError) {
    return (
      <Card className="border-red-500/50 bg-red-500/10 mb-6 font-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-500/20 p-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-red-700 dark:text-red-400">Permisos de GitHub Insuficientes</h3>
              <p className="text-sm text-muted-foreground">
                Para colaborar en este repositorio, el CMS necesita permisos para gestionar tus invitaciones. 
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Cerrar sesión y volver a entrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCollaborator = visibleRepos.some(r => r.toLowerCase() === repoId.toLowerCase());
  
  // Si ya es colaborador, no mostramos nada
  if (isCollaborator) return null;

  // Si no es colaborador, mostramos el aviso para aceptar la invitación
  return (
    <Card className="border-amber-500/50 bg-amber-500/10 mb-6 font-primary overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-500/20 p-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-1 text-lg">
                Faltan permisos de edición
              </h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-400/80 max-w-2xl">
                Parece que aún no has aceptado la invitación de GitHub para colaborar en <span className="font-mono font-bold">{repoId}</span>. 
                Sin esto, no podrás guardar cambios ni publicar contenido.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-600/20"
              >
                <a
                  href={`https://github.com/${repoId}/invitations`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Aceptar invitación en GitHub
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-amber-700 hover:bg-amber-500/10"
              >
                Ya la acepté, refrescar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
