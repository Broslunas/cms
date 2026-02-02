import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import SyncButton from "@/components/SyncButton";
import RepoFilters from "@/components/RepoFilters";

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
  
  let posts: any[] = await userCollection
    .find({ type: "post", repoId })
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al Dashboard
            </Link>
          </div>

          <SyncButton repoId={repoId} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Title & Stats */}
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Contenido</h1>
              <p className="text-zinc-400">{repoId}</p>
            </div>
            <div className="text-sm text-zinc-500 pb-1">
              {posts.length} resultados
            </div>
          </div>

          {/* Filtros */}
          <RepoFilters collections={uniqueCollections} />

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">
                No se encontraron posts con estos filtros
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <Link
                  key={post._id.toString()}
                  href={`/dashboard/editor/${post._id.toString()}`}
                  className="block bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-800">
                          {post.collection || "blog"}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {post.metadata.title || 
                         (Object.keys(post.metadata).length > 0 
                           ? String(Object.values(post.metadata)[0]) 
                           : "Sin título")}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1 font-mono">
                        {post.filePath}
                      </p>
                      {/* Tags */}
                      {post.metadata.tags && post.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.metadata.tags.slice(0, 5).map((tag: string, i: number) => (
                            <span
                              key={`${tag}-${i}`}
                              className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs border border-zinc-700/50"
                            >
                              {tag}
                            </span>
                          ))}
                          {post.metadata.tags.length > 5 && (
                            <span className="px-2 py-1 text-zinc-500 text-xs">
                              +{post.metadata.tags.length - 5} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <span
                        className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          post.status === "synced"
                            ? "bg-green-950/30 text-green-400 border border-green-900/50"
                            : post.status === "modified"
                            ? "bg-yellow-950/30 text-yellow-400 border border-yellow-900/50"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {post.status === "synced" && "✓ Sincronizado"}
                        {post.status === "modified" && "⚠ Modificado"}
                        {post.status === "draft" && "📝 Borrador"}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
