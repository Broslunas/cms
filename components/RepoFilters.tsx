"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

interface RepoFiltersProps {
  collections: string[];
}

export default function RepoFilters({ collections }: RepoFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados iniciales desde URL
  const initialSearch = searchParams.get("q") || "";
  const initialStatus = searchParams.get("status") || "all";
  const initialCollection = searchParams.get("collection") || "all";

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [collection, setCollection] = useState(initialCollection);

  // Debounce para búsqueda (300ms)
  const [debouncedSearch] = useDebounce(search, 300);

  // Efecto para actualizar URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Search
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");

    // Status
    if (status && status !== "all") params.set("status", status);
    else params.delete("status");

    // Collection
    if (collection && collection !== "all") params.set("collection", collection);
    else params.delete("collection");

    // Mantener repoId
    const repo = searchParams.get("repo");
    if (repo) params.set("repo", repo);

    router.replace(`?${params.toString()}`);
  }, [debouncedSearch, status, collection, router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Buscador */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-sm"
        />
      </div>

      {/* Selectores */}
      <div className="flex gap-4">
        {/* Filtro por Colección */}
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 cursor-pointer"
        >
          <option value="all">Todas las colecciones</option>
          {collections.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        {/* Filtro por Estado */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 cursor-pointer"
        >
          <option value="all">Todos los estados</option>
          <option value="synced">Sincronizados</option>
          <option value="modified">Modificados</option>
          <option value="draft">Borradores</option>
        </select>
      </div>
    </div>
  );
}
