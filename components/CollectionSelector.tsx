"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Schema {
  name: string;
  fields: any;
}

interface CollectionSelectorProps {
  schemas: Schema[];
  repoId: string;
}

export default function CollectionSelector({ schemas, repoId }: CollectionSelectorProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Elige una Colección</h1>
          <p className="text-zinc-400 text-lg">
            ¿Qué tipo de contenido quieres crear en <span className="text-white font-mono">{repoId}</span>?
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemas.map((schema) => (
            <Link
              key={schema.name}
              href={`/dashboard/editor/new?repo=${encodeURIComponent(repoId)}&collection=${schema.name}`}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all hover:shadow-2xl hover:shadow-zinc-900/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 to-zinc-800/0 group-hover:from-zinc-800/50 group-hover:to-zinc-900/50 rounded-xl transition-all" />
              
              <div className="relative space-y-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 group-hover:bg-zinc-700 group-hover:border-zinc-500 transition-colors">
                  <span className="text-2xl">📄</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors capitalize">
                    {schema.name}
                  </h3>
                  <p className="text-zinc-500 mt-2 text-sm line-clamp-2">
                    {Object.keys(schema.fields).length} campos definidos
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap gap-2">
                   {Object.keys(schema.fields).slice(0, 3).map(field => (
                       <span key={field} className="text-xs px-2 py-1 bg-zinc-950 rounded border border-zinc-800 text-zinc-400 font-mono">
                           {field}
                       </span>
                   ))}
                   {Object.keys(schema.fields).length > 3 && (
                       <span className="text-xs px-2 py-1 text-zinc-600 font-mono">...</span>
                   )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center pt-8">
          <Link
            href={`/dashboard/repos?repo=${encodeURIComponent(repoId)}`}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            ← Cancelar y volver
          </Link>
        </div>
      </div>
    </div>
  );
}
