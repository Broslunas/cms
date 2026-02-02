"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  updated_at: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen]);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/repos");
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      }
    } catch (error) {
      console.error("Error fetching repos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (repo: Repo) => {
    setImporting(true);
    setSelectedRepo(repo.full_name);

    try {
      const [owner, repoName] = repo.full_name.split("/");
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo: repoName,
          name: repo.name,
          description: repo.description,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Importado: ${result.imported} de ${result.total} archivos`);
        onClose();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("❌ Error al importar");
    } finally {
      setImporting(false);
      setSelectedRepo(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Importar Repositorio
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Solo repositorios con Astro
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-white"></div>
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No se encontraron repositorios de Astro</p>
              <p className="text-zinc-500 text-sm mt-2">Asegúrate de tener repositorios con Astro en tu cuenta de GitHub</p>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        {repo.full_name}
                      </p>
                      {repo.description && (
                        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleImport(repo)}
                      disabled={importing}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {importing && selectedRepo === repo.full_name ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-black border-t-transparent"></div>
                          Importando...
                        </span>
                      ) : (
                        "Importar"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
