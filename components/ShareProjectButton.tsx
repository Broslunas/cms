"use client";

import { useState } from "react";
import { Users, UserPlus, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ShareProjectButtonProps {
  repoId: string;
  repoName: string;
}

export default function ShareProjectButton({ repoId, repoName }: ShareProjectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("email");

  const handleShare = async () => {
    if ((activeTab === "email" && !email) || (activeTab === "username" && !username)) {
      toast.error("Por favor completa el campo requerido");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Enviando invitación...");

    try {
      const payload = {
        repoId,
        [activeTab]: activeTab === "email" ? email : username
      };

      const res = await fetch("/api/projects/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al compartir");
      }

      toast.success(`Proyecto compartido con ${data.user?.username || data.user?.name || "el usuario"}`, { id: toastId });
      setIsOpen(false);
      setEmail("");
      setUsername("");
    } catch (e: any) {
        console.error(e);
      toast.error(e.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
        title="Compartir proyecto"
      >
        <Users className="h-5 w-5" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !loading && setIsOpen(false)}
        title="Compartir Repositorio"
        description={`Comparte acceso a ${repoName} para que otros puedan editar contenido.`}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleShare}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                  <>Compartiendo...</>
              ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Compartir
                  </>
              )}
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex gap-3 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                <p>El usuario recibirá acceso para ver y editar posts, pero no se copiarán archivos a su cuenta.</p>
            </div>

            <div className="w-full">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab("email")}
                        className={`text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Por Email
                    </button>
                    <button
                        onClick={() => setActiveTab("username")}
                        className={`text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "username" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Por GitHub Username
                    </button>
                </div>

                {activeTab === "email" && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="email">Email del usuario</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="usuario@ejemplo.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                )}
                
                {activeTab === "username" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="username">Username de GitHub</Label>
                        <Input 
                            id="username" 
                            placeholder="ej. broslunas" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="pt-2">
                <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg flex gap-3 text-xs text-amber-700 dark:text-amber-500 italic">
                    <p>
                        <strong>Nota importante:</strong> Si usas Vercel (Plan Free), el repositorio debe ser <strong>Público</strong> para que la build se ejecute correctamente. Los repositorios privados requieren Vercel Pro o Enterprise.
                    </p>
                </div>
            </div>
        </div>
      </Modal>
    </>
  );
}
