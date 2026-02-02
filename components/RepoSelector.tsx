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

export default function RepoSelector() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
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

  const handleImport = async (fullName: string) => {
    setImporting(true);
    setSelectedRepo(fullName);

    try {
      const [owner, repo] = fullName.split("/");
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Importado: ${result.imported} de ${result.total} archivos`);
        
        // Redirigir a la vista de posts
        router.push(`/dashboard/repos?repo=${encodeURIComponent(fullName)}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">
        Tus Repositorios
      </h3>

      {repos.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">No se encontraron repositorios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-white truncate">
                    {repo.name}
                  </h4>
                  <p className="text-sm text-zinc-500 mt-1">{repo.full_name}</p>
                  {repo.description && (
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600 mt-3">
                    Actualizado: {new Date(repo.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleImport(repo.full_name)}
                  disabled={importing}
                  className="px-5 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
  );
}
