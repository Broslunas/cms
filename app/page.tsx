import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import { Countdown } from "@/components/launch-countdown";
import { Star, Code2, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  // Si ya está autenticado, redirigir al dashboard
  // if (session?.user) {
  //   redirect("/dashboard");
  // }

  // Set launch date to Feb 12, 2026
  const launchDate = new Date('2026-02-12T00:00:00');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Animated Glass Orbs Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-emerald-500/30 blur-[120px] animate-pulse" />
        <div className="absolute right-[15%] top-[10%] h-[350px] w-[350px] rounded-full bg-green-400/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute left-[60%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-teal-500/25 blur-[110px] animate-pulse delay-500" />
        <div className="absolute right-[5%] bottom-[30%] h-[300px] w-[300px] rounded-full bg-emerald-400/30 blur-[90px] animate-pulse delay-[1500ms]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      {/* Floating Glass Elements */}
      <div className="absolute top-24 left-[15%] animate-float hidden lg:block">
        <div className="glass rounded-2xl p-4 shadow-xl">
          <Star className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      <div className="absolute bottom-32 right-[12%] animate-float delay-1000 hidden lg:block">
        <div className="glass rounded-2xl p-4 shadow-xl">
          <Code2 className="w-8 h-8 text-green-400" />
        </div>
      </div>

      <div className="absolute top-1/3 right-[8%] animate-float delay-500 hidden lg:block">
        <div className="glass rounded-2xl p-4 shadow-xl">
          <Globe className="w-8 h-8 text-teal-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center text-center max-w-5xl space-y-12 px-4">
        
        {/* Header Section */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 glass-strong rounded-full px-5 py-2 text-sm font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 border-emerald-500/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-lg shadow-emerald-500/50"></span>
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Próximamente
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter">
            <span className="bg-gradient-to-br from-foreground via-emerald-500/90 to-green-400 bg-clip-text text-transparent drop-shadow-2xl">
              Broslunas CMS
            </span>
          </h1>
          
          {/* Description */}
          <p className="max-w-[42rem] mx-auto text-muted-foreground text-lg md:text-2xl leading-relaxed font-light">
            Estamos preparando algo{" "}
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              gigante
            </span>
            . La nueva generación de gestión de contenido estático está a punto de aterrizar.
          </p>
        </div>

        {/* Countdown Section - Glass Card */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="glass-strong rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 border-emerald-500/20">
            <Countdown targetDate={launchDate} />
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-5 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
           <p className="text-sm text-muted-foreground font-medium">
             ¿Eres administrador?
           </p>
           <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
             <div className="relative glass-strong rounded-xl overflow-hidden shadow-xl">
                {session?.user ? (
                  <Link href="/dashboard">
                    <Button 
                      size="lg" 
                      className="gap-2.5 font-bold text-base px-8 py-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-0 shadow-lg shadow-emerald-500/30 transition-all duration-300"
                    >
                       <LayoutDashboard className="w-5 h-5" />
                       Ir al Dashboard
                    </Button>
                  </Link>
                ) : (
                  <LoginButton />
                )}
             </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center p- animate-in fade-in duration-1000 delay-500">
        <div className="glass rounded-full px-6 py-3 inline-flex items-center gap-2 shadow-lg">
          <Globe className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-muted-foreground font-medium">
            Powered by <span className="text-emerald-400 font-semibold">Broslunas Engineering</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
