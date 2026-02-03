'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Componente que verifica periódicamente si la GitHub App ha sido instalada
 * y redirige automáticamente al dashboard cuando se detecta la instalación
 */
export function InstallationChecker() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Verificar cada 3 segundos si la app fue instalada
    const interval = setInterval(async () => {
      try {
        setChecking(true);
        const response = await fetch('/api/check-installation');
        const data = await response.json();

        if (data.installed) {
          // App instalada, redirigir al dashboard
          clearInterval(interval);
          router.push('/dashboard');
          router.refresh();
        }
      } catch (error) {
        console.error('Error checking installation:', error);
      } finally {
        setChecking(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  if (!checking) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">
        Verificando instalación...
      </span>
    </div>
  );
}
