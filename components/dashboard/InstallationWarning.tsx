"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusCheckProps {
  initiallyInstalled: boolean;
}

export function InstallationWarning({ initiallyInstalled }: StatusCheckProps) {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(initiallyInstalled);
  const [isChecking, setIsChecking] = useState(!initiallyInstalled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado al montar el componente (al visitar el dashboard)
    checkStatus();
    
    // Y verificar periódicamente cada 5 minutos mientras esté en pantalla
    const interval = setInterval(checkStatus, 300000);
    
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      if (!isInstalled) setIsChecking(true);
      
      const res = await fetch("/api/check-installation", { 
        method: "GET",
        headers: { 'Cache-Control': 'no-store' }
      });
      
      if (res.status === 401) return;
      
      if (!res.ok) throw new Error("Error checking status");
      
      const data = await res.json();
      
      // Si el estado cambió respecto a lo que teníamos
      if (data.installed !== isInstalled) {
        setIsInstalled(data.installed);
        router.refresh(); // Actualizar componentes de servidor (layout, page)
      } else {
        // Aunque no cambie, si el servidor dice 'false' y nosotros 'true', la sesión puede estar desactualizada
        // Pero aquí data.installed viene de la API que verifica con GitHub O con la sesión
        // La API /check-installation llama a checkAppInstalled que verifica con GitHub
      }
      
      setError(null);
    } catch (err) {
      console.error("Failed to check app installation status", err);
      // En caso de error de red, asumimos que no ha cambiado para no molestar,
      // a menos que ya supiéramos que no estaba instalada
      if (!isInstalled) {
        setError("No se pudo verificar la conexión");
      }
    } finally {
      setIsChecking(false);
    }
  }

  // Si está instalada, no mostramos nada
  if (isInstalled) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
        <div className="flex items-center gap-3">
            <div className="bg-destructive/15 p-2 rounded-full hidden sm:block">
                <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <span className="sm:hidden"><AlertCircle className="h-4 w-4 inline" /></span>
                    Aplicación de GitHub no detectada
                </h3>
                <p className="text-xs text-destructive/80 mt-0.5">
                    {isChecking 
                        ? "Verificando conexión..." 
                        : error 
                            ? "Error de conexión. Reintentando..." 
                            : "Necesitas instalar la app para gestionar tus repositorios."}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
            {isChecking ? (
                <Button variant="ghost" size="sm" disabled className="text-destructive">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Verificando
                </Button>
            ) : (
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => router.push("/setup")}
                    className="gap-2 shadow-sm"
                >
                    Configurar
                    <ArrowRight className="h-4 w-4" />
                </Button>
            )}
        </div>
    </div>
  );
}
