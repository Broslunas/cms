import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await auth();

  // Si ya está autenticado, redirigir al dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Hero */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight">
            Astro-Git <span className="text-zinc-400">CMS</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto">
            Gestiona tus Content Collections de Astro con el poder de Git
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-3">Rápido y Ligero</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Sin bases de datos de contenido. Todo se sincroniza directamente con GitHub.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-white mb-3">Interfaz Intuitiva</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Edita tu contenido con una UI moderna y fluida, sin tocar código.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold text-white mb-3">Sincronización Total</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Cada cambio se guarda en MongoDB y se commitea a tu repositorio.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <LoginButton />
          <p className="text-zinc-500 text-sm">
            Conecta con GitHub para comenzar
          </p>
        </div>
      </div>
    </div>
  );
}
