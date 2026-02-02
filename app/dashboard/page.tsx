import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import Link from "next/link";
import ImportButton from "@/components/ImportButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            Astro-Git <span className="text-zinc-500">CMS</span>
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
              )}
              <span className="text-sm text-zinc-300">{session.user.name}</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header con botón de importar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Mis Proyectos
              </h2>
              <p className="text-zinc-400 mt-1">
                {projects.length === 0
                  ? "Comienza importando tu primer repositorio"
                  : `${projects.length} ${projects.length === 1 ? "proyecto importado" : "proyectos importados"}`}
              </p>
            </div>

            <ImportButton />
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-5xl">�</div>
                <h3 className="text-xl font-semibold text-white">
                  No hay proyectos aún
                </h3>
                <p className="text-zinc-400">
                  Importa tu primer repositorio de GitHub para comenzar a gestionar tu contenido
                </p>
                <div className="pt-4">
                  <ImportButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serializedProjects.map((project) => (
                <Link
                  key={project._id}
                  href={`/dashboard/repos?repo=${encodeURIComponent(project.repoId)}`}
                  className="block bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1 truncate">
                        {project.repoId}
                      </p>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm">�</span>
                        <span className="text-sm text-zinc-400">
                          {project.postsCount} posts
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm">🔄</span>
                        <span className="text-sm text-zinc-400">
                          {new Date(project.lastSync).toLocaleDateString()}
                        </span>
                      </div>
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
