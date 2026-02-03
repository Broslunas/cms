import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import Link from "next/link";
import ImportButton from "@/components/ImportButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCw, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Verificar si el usuario tiene la app instalada
  if (!session.appInstalled) {
    redirect("/setup");
  }

  // Obtener proyectos importados del usuario
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const userCollection = db.collection(getUserCollectionName(session.user.id));
  
  const projects = await userCollection
    .find({ type: "project" })
    .sort({ updatedAt: -1 })
    .toArray();

  // Serializar proyectos para pasar al cliente
  const serializedProjects = projects.map((project) => ({
    _id: project._id.toString(),
    repoId: project.repoId,
    name: project.name,
    description: project.description,
    postsCount: project.postsCount,
    lastSync: project.lastSync.toISOString(),
  }));

  return (
    <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="space-y-8">
        {/* Header con botón de importar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Mis Proyectos
            </h2>
            <p className="text-muted-foreground mt-1">
              {projects.length === 0
                ? "Comienza importando tu primer repositorio"
                : `${projects.length} ${projects.length === 1 ? "proyecto importado" : "proyectos importados"}`}
            </p>
          </div>

          <ImportButton />
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16 rounded-lg border border-dashed border-border bg-card/50">
            <div className="max-w-md mx-auto space-y-4">
              <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">
                No hay proyectos aún
              </h3>
              <p className="text-muted-foreground">
                Importa tu primer repositorio de GitHub para comenzar a gestionar tu contenido
              </p>
              <div className="pt-4">
                <ImportButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serializedProjects.map((project) => (
              <Link
                key={project._id}
                href={`/dashboard/repos?repo=${encodeURIComponent(project.repoId)}`}
                className="block group"
              >
                <Card className="h-full transition-all hover:bg-muted/50 hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="truncate font-mono text-xs">
                      {project.repoId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">
                        Sin descripción
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground border-t bg-muted/20 p-4 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{project.postsCount} posts</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{new Date(project.lastSync).toLocaleDateString()}</span>
                     </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
