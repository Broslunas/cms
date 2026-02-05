"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Check, AlertCircle, X, Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Image from "next/image";

interface Collaborator {
  userId: string;
  email: string;
  username: string;
  image?: string;
  addedAt: string;
}

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
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [fetchingCollabs, setFetchingCollabs] = useState(false);

  const fetchCollaborators = async () => {
    setFetchingCollabs(true);
    try {
      const res = await fetch(`/api/repo/settings?repoId=${encodeURIComponent(repoId)}`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (e) {
      console.error("Failed to fetch collaborators", e);
    } finally {
      setFetchingCollabs(false);
    }
  };

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
      setEmail("");
      setUsername("");
      fetchCollaborators(); // Refresh list
    } catch (e: any) {
        console.error(e);
      toast.error(e.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este colaborador? Ya no podrá acceder al proyecto desde el CMS.")) return;
    
    const toastId = toast.loading("Eliminando colaborador...");
    try {
      const res = await fetch("/api/projects/unshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, userId })
      });

      if (!res.ok) throw new Error("Error al eliminar colaborador");

      toast.success("Colaborador eliminado", { id: toastId });
      fetchCollaborators(); // Refresh list
    } catch (e) {
      toast.error("Error al eliminar colaborador", { id: toastId });
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
          fetchCollaborators();
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
        description={`Gestiona quién tiene acceso a ${repoName}.`}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-6">
            {/* Share Form Section */}
            <div className="space-y-4">
                <div className="w-full">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 block">
                        Invitar nuevo colaborador
                    </Label>
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
                            Por GitHub
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {activeTab === "email" ? (
                             <Input 
                                placeholder="usuario@ejemplo.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        ) : (
                            <Input 
                                placeholder="GitHub Username (ej. broslunas)" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            />
                        )}
                        <Button
                          onClick={handleShare}
                          disabled={loading}
                          className="bg-primary text-primary-foreground shrink-0"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Collaborators List Section */}
            <div className="space-y-3 pt-4 border-t">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex justify-between">
                    Colaboradores actuales
                    {fetchingCollabs && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {collaborators.length === 0 && !fetchingCollabs ? (
                        <p className="text-sm text-center py-4 text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                            Aún no has invitado a nadie.
                        </p>
                    ) : (
                        // Filter duplicates by userId just in case
                        collaborators
                          .filter((collab, index, self) => 
                            index === self.findIndex((t) => t.userId === collab.userId)
                          )
                          .map((collab) => (
                            <div key={collab.userId} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                                        {collab.image ? (
                                            <Image src={collab.image} alt={collab.username} fill className="object-cover" />
                                        ) : (
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{collab.username}</span>
                                        <span className="text-[10px] text-muted-foreground">{collab.email}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleUnshare(collab.userId)}
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="pt-2">
                <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg flex gap-3 text-xs text-amber-700 dark:text-amber-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="leading-relaxed">
                        <strong>Nota:</strong> Los colaboradores pueden editar contenido. Si usas Vercel (Free), recuerda que el repo debe ser <strong>Público</strong>.
                    </p>
                </div>
            </div>
        </div>
      </Modal>
    </>
  );
}
