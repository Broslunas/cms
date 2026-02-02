import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";

export default async function ReposPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>;
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

  // Obtener posts del repositorio
  const client = await clientPromise;
  const db = client.db("astro-cms");
  const posts = await db
    .collection("posts")
    .find({ userId: session.user.id, repoId })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Contenido</h1>
            <p className="text-zinc-400">{repoId}</p>
          </div>

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">
                No hay posts en este repositorio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <Link
                  key={post._id.toString()}
                  href={`/dashboard/editor/${post._id.toString()}`}
                  className="block bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {post.metadata.title || "Sin título"}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        {post.filePath}
                      </p>
                      {post.metadata.tags && post.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.metadata.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          post.status === "synced"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : post.status === "modified"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
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
