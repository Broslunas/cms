"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PostMetadata {
  [key: string]: any;
}

interface Post {
  _id: string;
  repoId: string;
  filePath: string;
  metadata: PostMetadata;
  content: string;
  status: string;
}

interface SchemaField {
  type: string;
  optional: boolean;
}

interface Schema {
  [fieldName: string]: SchemaField;
}

interface PostEditorProps {
  post: Post;
  schema: Schema | null;
}

export default function PostEditor({ post, schema }: PostEditorProps) {
  const [metadata, setMetadata] = useState<PostMetadata>(post.metadata);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const router = useRouter();

  const handleSave = async (commitToGitHub: boolean = false) => {
    if (commitToGitHub) {
      setCommitting(true);
    } else {
      setSaving(true);
    }

    try {
      const response = await fetch("/api/posts/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          metadata,
          content,
          commitToGitHub,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.committed) {
          alert("✅ Cambios guardados y commiteados a GitHub");
        } else {
          alert("✅ Cambios guardados localmente");
        }
        router.refresh();
      } else {
        const error = await response.json();
        if (error.code === "CONFLICT") {
          alert("⚠️ Conflicto: El archivo ha sido modificado externamente. Refresca los datos.");
        } else if (error.code === "PERMISSION_ERROR") {
          alert(
            "❌ Error de Permisos\n\n" +
            "Tu GitHub OAuth App no tiene permisos para hacer commits.\n\n" +
            "Solución:\n" +
            "1. Ve a GitHub Settings > Developer Settings\n" +
            "2. Crea una GitHub App (no OAuth App)\n" +
            "3. Dale permisos de 'Contents: Read & Write'\n" +
            "4. Actualiza las credenciales en .env.local\n\n" +
            "Ver GITHUB_PERMISSIONS.md para más detalles"
          );
        } else {
          alert(`❌ Error: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Error al guardar");
    } finally {
      setSaving(false);
      setCommitting(false);
    }
  };

  const updateMetadata = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const renderField = (key: string, value: any) => {
    // Arrays especiales (como transcription)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
            {key}
          </label>
          <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4">
            <p className="text-sm text-zinc-400">
              Campo complejo con {value.length} elementos
            </p>
            <details className="mt-2">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300">
                Ver JSON
              </summary>
              <pre className="mt-2 text-xs text-zinc-400 overflow-auto max-h-40">
                {JSON.stringify(value, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    // Arrays simples (como tags)
    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
            {key} (separados por coma)
          </label>
          <input
            type="text"
            value={value.join(", ")}
            onChange={(e) =>
              updateMetadata(
                key,
                e.target.value.split(",").map((t) => t.trim())
              )
            }
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
          />
        </div>
      );
    }

    // Strings
    if (typeof value === "string") {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
            {key}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateMetadata(key, e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
          />
        </div>
      );
    }

    // Numbers
    if (typeof value === "number") {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
            {key}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => updateMetadata(key, parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
          />
        </div>
      );
    }

    // Booleans
    if (typeof value === "boolean") {
      return (
        <div key={key}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateMetadata(key, e.target.checked)}
              className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded"
            />
            <span className="text-sm font-medium text-zinc-300 capitalize">{key}</span>
          </label>
        </div>
      );
    }

    // Objetos complejos
    if (typeof value === "object" && value !== null) {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
            {key}
          </label>
          <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4">
            <p className="text-sm text-zinc-400">Campo objeto complejo</p>
            <details className="mt-2">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300">
                Ver JSON
              </summary>
              <pre className="mt-2 text-xs text-zinc-400 overflow-auto max-h-40">
                {JSON.stringify(value, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
<>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard/repos?repo=${encodeURIComponent(post.repoId)}`}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Posts
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || committing}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving || committing}
              className="px-4 py-2 bg-white hover:bg-zinc-100 text-black rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {committing ? "Commiteando..." : "Guardar y Commitear"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-black min-h-screen">
        {/* Meta Info */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">Repositorio:</span> {post.repoId}
              </p>
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">Archivo:</span> {post.filePath}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${
                post.status === "synced"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              }`}
            >
              {post.status}
            </span>
          </div>
        </div>

        {/* Metadata Fields - DINÁMICO */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-5">
          <h2 className="text-xl font-semibold text-white">Metadata</h2>

          <div className="space-y-4">
            {Object.entries(metadata).map(([key, value]) => renderField(key, value))}
          </div>

          {Object.keys(metadata).length === 0 && (
            <p className="text-zinc-500 text-sm">No hay campos de metadata</p>
          )}
        </div>

        {/* Content Editor */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4">
          <h2 className="text-xl font-semibold text-white">Contenido</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 font-mono text-sm resize-none"
            placeholder="Escribe tu contenido en Markdown aquí..."
          />
        </div>
      </main>
    </>
  );
}
