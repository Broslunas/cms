import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link } from "next-view-transitions";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import SyncButton from "@/components/SyncButton";
import { VercelWidget } from "@/components/VercelIntegration";
import RepoFilters from "@/components/RepoFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


export default async function ReposPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    repo?: string; 
    q?: string; 
    status?: string; 
    collection?: string; 
  }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    redirect("/");
  }

  const repoId = params.repo;

  if (!repoId) {
    redirect("/dashboard");
  }

  const query = params.q?.toLowerCase() || "";
  const status = params.status || "all";
  const collectionFilter = params.collection || "all";

  // Obtener posts del repositorio
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const userCollection = db.collection(getUserCollectionName(session.user.id));
  
  let targetCollection = userCollection;
  let postQuery: any = { type: "post", repoId };

  // Check if this is a shared project
  const sharedRef = await userCollection.findOne({ 
      type: "shared_project_reference", 
      repoId 
  });

  if (sharedRef) {
       // Switch to owner's collection
       targetCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
       // No userId filter needed here as we are in owner's collection and filtering by repoId
  } else {
       // Own project
       postQuery.userId = session.user.id;
  }

  let posts: any[] = await targetCollection
    .find(postQuery)
    .sort({ updatedAt: -1 })
    .toArray();

  // Obtener colecciones únicas antes de filtrar
  const uniqueCollections = Array.from(new Set(posts.map(p => p.collection || "blog")));

  // Aplicar filtros en memoria
  if (query) {
    posts = posts.filter(post => {
      const title = post.metadata.title || "";
      const path = post.filePath || "";
      const content = post.content || "";
      
      return (
        title.toLowerCase().includes(query) ||
        path.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query)
      );
    });
  }

  if (status !== "all") {
    posts = posts.filter(post => post.status === status);
  }

  if (collectionFilter !== "all") {
    posts = posts.filter(post => (post.collection || "blog") === collectionFilter);
  }

  return (
    <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                   <ArrowLeft className="h-4 w-4" />
                   Volver
                </Button>
             </Link>
             <div className="h-4 w-px bg-border hidden md:block" />
             <div>
                <h1 className="text-xl font-bold tracking-tight">Contenido</h1>
                <p className="text-sm text-muted-foreground font-mono">{repoId}</p>
             </div>
           </div>

           <div className="flex items-center gap-3">
              <VercelWidget repoId={repoId} />
              <Link href={`/dashboard/editor/new?repo=${encodeURIComponent(repoId)}`}>
                 <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Nuevo Post
                 </Button>
              </Link>
              <SyncButton repoId={repoId} />
           </div>
        </div>

        {/* Filtros */}
        <RepoFilters collections={uniqueCollections} />

        {/* Posts List */}
        <div className="space-y-1">
           <div className="text-sm text-muted-foreground pb-2 ml-1">
              {posts.length} {posts.length === 1 ? "resultado" : "resultados"}
           </div>

          {posts.length === 0 ? (
            <div className="text-center p-12 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">
                No se encontraron posts con estos filtros
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <Link
                  key={post._id.toString()}
                  href={`/dashboard/editor/${post._id.toString()}?repo=${encodeURIComponent(post.repoId)}`}
                  className="block group"
                >
                  <Card className="p-4 transition-all hover:bg-muted/50 hover:border-primary/50">
                     <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-secondary-foreground/10">
                                 {post.collection || "blog"}
                              </span>
                           </div>
                           <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                              {post.metadata.title || 
                                (Object.keys(post.metadata).length > 0 
                                  ? String(Object.values(post.metadata)[0]) 
                                  : "Sin título")}
                           </h3>
                           <p className="text-sm text-muted-foreground mt-1 font-mono line-clamp-1">
                              {post.filePath}
                           </p>

                           {/* Tags */}
                           {post.metadata.tags && post.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.metadata.tags.slice(0, 5).map((tag: string, i: number) => (
                                <span
                                  key={`${tag}-${i}`}
                                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.metadata.tags.length > 5 && (
                                <span className="px-2 py-1 text-muted-foreground text-xs">
                                  +{post.metadata.tags.length - 5} más
                                </span>
                              )}
                            </div>
                           )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                           {/* Status Badge */}
                           <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              post.status === "synced"
                                ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                                : post.status === "modified"
                                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400"
                                : "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400"
                           }`}>
                              {post.status === "synced" && "Sincronizado"}
                              {post.status === "modified" && "Modificado"}
                              {post.status === "draft" && "Borrador"}
                           </div>
                           <span className="text-xs text-muted-foreground">
                              {new Date(post.updatedAt).toLocaleDateString()}
                           </span>
                        </div>
                     </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
