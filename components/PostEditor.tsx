"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TranscriptionBlock {
  time: string;
  text: string;
}

interface PostMetadata {
  title: string;
  slug: string;
  tags?: string[];
  episodeUrl?: string;
  transcription?: TranscriptionBlock[];
}

interface Post {
  _id: string;
  repoId: string;
  filePath: string;
  metadata: PostMetadata;
  content: string;
  status: string;
}

export default function PostEditor({ post }: { post: Post }) {
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

  const addTranscriptionBlock = () => {
    const newBlock: TranscriptionBlock = { time: "", text: "" };
    setMetadata({
      ...metadata,
      transcription: [...(metadata.transcription || []), newBlock],
    });
  };

  const updateTranscriptionBlock = (
    index: number,
    field: "time" | "text",
    value: string
  ) => {
    const updated = [...(metadata.transcription || [])];
    updated[index] = { ...updated[index], [field]: value };
    setMetadata({ ...metadata, transcription: updated });
  };

  const removeTranscriptionBlock = (index: number) => {
    const updated = [...(metadata.transcription || [])];
    updated.splice(index, 1);
    setMetadata({ ...metadata, transcription: updated });
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

        {/* Metadata Fields */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-5">
          <h2 className="text-xl font-semibold text-white">Metadata</h2>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Título
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata({ ...metadata, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={metadata.slug}
                onChange={(e) =>
                  setMetadata({ ...metadata, slug: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tags (separados por coma)
            </label>
            <input
              type="text"
              value={metadata.tags?.join(", ") || ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                })
              }
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
              placeholder="tech, astro, web"
            />
          </div>

          {/* Episode URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Episode URL (opcional)
            </label>
            <input
              type="url"
              value={metadata.episodeUrl || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, episodeUrl: e.target.value })
              }
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Transcription */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Transcripción</h2>
            <button
              onClick={addTranscriptionBlock}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              + Agregar Bloque
            </button>
          </div>

          {metadata.transcription && metadata.transcription.length > 0 ? (
            <div className="space-y-3">
              {metadata.transcription.map((block, index) => (
                <div
                  key={index}
                  className="bg-zinc-800 border border-zinc-700 rounded-md p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="text"
                      value={block.time}
                      onChange={(e) =>
                        updateTranscriptionBlock(index, "time", e.target.value)
                      }
                      placeholder="00:00:00"
                      className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        updateTranscriptionBlock(index, "text", e.target.value)
                      }
                      placeholder="Texto de la transcripción..."
                      rows={2}
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
                    />
                    <button
                      onClick={() => removeTranscriptionBlock(index)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8 text-sm">
              No hay bloques de transcripción. Haz clic en &quot;Agregar Bloque&quot; para comenzar.
            </p>
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
