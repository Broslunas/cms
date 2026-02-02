"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import Modal from "./Modal";

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
  collection: string;
  sha?: string;
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
  isNew?: boolean;
}

export default function PostEditor({ post, schema, isNew = false }: PostEditorProps) {
  const [metadata, setMetadata] = useState<PostMetadata>(post.metadata);
  const [content, setContent] = useState(post.content);
  const [createFilePath, setCreateFilePath] = useState(
    isNew 
      ? `src/content/${post.collection || 'blog'}/untitled.md` 
      : post.filePath
  );
  
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("edit");
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showConflictError, setShowConflictError] = useState(false);
  
  // Metadata Tools State
  const [showAddField, setShowAddField] = useState(false);
  
  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFromGitHub, setDeleteFromGitHub] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importablePosts, setImportablePosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // --- Handlers for Metadata Tools ---
  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("El nombre del campo es requerido");
      return;
    }
    
    if (metadata[newFieldName]) {
      toast.error("Este campo ya existe");
      return;
    }

    let initialValue: any = "";
    if (newFieldType === "number") initialValue = 0;
    if (newFieldType === "boolean") initialValue = false;
    if (newFieldType === "array") initialValue = [];
    if (newFieldType === "date") initialValue = new Date().toISOString().split('T')[0];

    updateMetadata(newFieldName, initialValue);
    setNewFieldName("");
    setShowAddField(false);
    toast.success(`Campo '${newFieldName}' añadido`);
  };

  const loadImportablePosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?repoId=${encodeURIComponent(post.repoId)}`);
      if (res.ok) {
        const posts = await res.json();
        // Filtrar el post actual
        setImportablePosts(posts.filter((p: any) => p._id !== post._id));
      }
    } catch (e) {
      toast.error("Error cargando posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleImportMetadata = (sourcePost: Post) => {
    const newMetadata = { ...metadata };
    
    Object.entries(sourcePost.metadata).forEach(([key, value]) => {
      // Importamos todo, incluido el título, para que el usuario pueda usarlo de base
      if (key !== "date") { 
          newMetadata[key] = value;
      }
    });

    setMetadata(newMetadata);
    setShowImportModal(false);
    toast.success("Metadatos importados. Revisa el título.");
  };

  const handleDeleteField = (key: string) => {
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      setMetadata(newMetadata);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const toastId = toast.loading("Eliminando post...");

    try {
      const response = await fetch("/api/posts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          deleteFromGitHub: deleteFromGitHub && post.sha, 
        }),
      });

      if (response.ok) {
        toast.success("Post eliminado correctamente", { id: toastId });
        router.push(`/dashboard/repos?repo=${encodeURIComponent(post.repoId)}`);
      } else {
        const error = await response.json();
        toast.error(`Error al eliminar: ${error.error}`, { id: toastId });
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error al eliminar el post", { id: toastId });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async (commitToGitHub: boolean = false) => {
    if (commitToGitHub) {
      setCommitting(true);
    } else {
      setSaving(true);
    }

    const toastId = toast.loading(commitToGitHub ? "Guardando y commiteando..." : "Guardando...");

    try {
      let response;
      let body;

      if (isNew) {
         body = {
            repoId: post.repoId,
            collection: post.collection,
            metadata,
            content,
            filePath: createFilePath,
            commitToGitHub
         };
         response = await fetch("/api/posts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         });
      } else {
         body = {
            postId: post._id,
            metadata,
            content,
            commitToGitHub,
         };
         response = await fetch("/api/posts/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         });
      }

      if (response.ok) {
        const result = await response.json();
        
        if (result.committed) {
          toast.success("Cambios guardados y commiteados a GitHub", { id: toastId });
        } else {
          toast.success("Cambios guardados localmente", { id: toastId });
        }
        
        if (isNew && result.postId) {
            router.push(`/dashboard/editor/${result.postId}`);
        } else {
            router.refresh();
        }

      } else {
        const error = await response.json();
        
        // Descartar toast de loading
        toast.dismiss(toastId);

        if (error.code === "CONFLICT") {
          setShowConflictError(true);
        } else if (error.code === "PERMISSION_ERROR") {
          setShowPermissionError(true);
        } else {
          toast.error(`Error: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error al guardar cambios", { id: toastId });
    } finally {
      setSaving(false);
      setCommitting(false);
    }
  };

  const updateMetadata = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end);

    const newText =
      previousText.substring(0, start) +
      before +
      selectedText +
      after +
      previousText.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const renderField = (key: string, value: any) => {
    // ... misma lógica de render ...
    // Arrays especiales (como transcription)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300 capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300 capitalize">
              {key} (separados por coma)
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
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
      const trimmedValue = value.trim();
      
      const isImage = 
        // 1. Detección por extensión (soportando query params y espacios)
        trimmedValue.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif)(\?.*)?$/i) || 
        // 2. Detección por nombre de campo + URL
        ((trimmedValue.startsWith("http") || trimmedValue.startsWith("/")) && 
         (key.toLowerCase().includes("image") || 
          key.toLowerCase().includes("img") || 
          key.toLowerCase().includes("cover") || 
          key.toLowerCase().includes("avatar") ||
          key.toLowerCase().includes("thumbnail") ||
          key.toLowerCase().includes("banner") ||
          key.toLowerCase().includes("poster") ||
          key.toLowerCase().includes("logo") ||
          key.toLowerCase().includes("icon") ||
          key.toLowerCase().includes("bg")));

      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300 capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={(e) => updateMetadata(key, e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
            />
            {isImage && trimmedValue.length > 0 && (
              <div className="relative group w-fit">
                <div className="rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950/50 max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    key={trimmedValue} // Forzar re-render si cambia la URL
                    src={trimmedValue} 
                    alt={`Preview of ${key}`}
                    className="max-h-48 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = 'block';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                      Vista Previa
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Numbers
    if (typeof value === "number") {
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300 capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
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
          {/* Boolean field with custom delete handling */}
          <div className="flex items-center justify-between">
             <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateMetadata(key, e.target.checked)}
                  className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded"
                />
                <span className="text-sm font-medium text-zinc-300 capitalize">{key}</span>
             </label>
             <button 
                onClick={() => handleDeleteField(key)} 
                className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                title={`Eliminar campo ${key}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
          </div>
        </div>
      );
    }

    // Objetos complejos
    if (typeof value === "object" && value !== null) {
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300 capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
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

  const ToolbarButton = ({ 
    icon, 
    label, 
    onClick 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void 
  }) => (
    <button
      onClick={onClick}
      title={label}
      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
    >
      {icon}
    </button>
  );

  return (
<>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard/repos?repo=${encodeURIComponent(post.repoId)}`}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

            {!isNew && (
              <div className="hidden md:block w-px h-6 bg-zinc-800 mx-1" />
            )}

            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar Post"
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
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
              
              {isNew ? (
                <div className="mt-2">
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Path del archivo</label>
                    <input 
                        type="text" 
                        value={createFilePath}
                        onChange={(e) => setCreateFilePath(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                    />
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                    <span className="text-zinc-500">Archivo:</span> {post.filePath}
                </p>
              )}
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Metadata</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowImportModal(true); loadImportablePosts(); }}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
                Importar
              </button>
              <button
                onClick={() => setShowAddField(true)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 rounded transition-colors flex items-center gap-2"
              >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir Campo
              </button>
              {!isNew && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(metadata).map(([key, value]) => renderField(key, value))}
          </div>
          {Object.keys(metadata).length === 0 && (
            <p className="text-zinc-500 text-sm">No hay campos de metadata</p>
          )}
        </div>

        {/* Content Editor - DARK MODE + TOOLBAR */}
        <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 flex flex-col min-h-[600px]">
          {/* Tabs & Toolbar */}
          <div className="border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between px-4 py-2">
              {/* Tabs */}
              <div className="flex gap-1 bg-zinc-950/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "edit"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "preview"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("split")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "split"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  Split
                </button>
              </div>

              {/* Formatting Toolbar */}
              {(activeTab === "edit" || activeTab === "split") && (
                <div className="flex items-center gap-1 border-l border-zinc-800 pl-4 ml-4">
                   <ToolbarButton 
                    label="Negrita (Ctrl+B)" 
                    onClick={() => insertText("**", "**")}
                    icon={<span className="font-bold">B</span>}
                  />
                  <ToolbarButton 
                    label="Cursiva (Ctrl+I)" 
                    onClick={() => insertText("*", "*")}
                    icon={<span className="italic">I</span>}
                  />
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <ToolbarButton 
                    label="Título 1" 
                    onClick={() => insertText("# ", "")}
                    icon={<span className="font-bold text-sm">H1</span>}
                  />
                  <ToolbarButton 
                    label="Título 2" 
                    onClick={() => insertText("## ", "")}
                    icon={<span className="font-bold text-sm">H2</span>}
                  />
                  <ToolbarButton 
                    label="Título 3" 
                    onClick={() => insertText("### ", "")}
                    icon={<span className="font-bold text-sm">H3</span>}
                  />
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <ToolbarButton 
                    label="Lista" 
                    onClick={() => insertText("- ", "")}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    }
                  />
                  <ToolbarButton 
                    label="Cita" 
                    onClick={() => insertText("> ", "")}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    }
                  />
                  <ToolbarButton 
                    label="Código" 
                    onClick={() => insertText("```\n", "\n```")}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    }
                  />
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <ToolbarButton 
                    label="Link" 
                    onClick={() => insertText("[", "](url)")}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    }
                  />
                  <ToolbarButton 
                    label="Imagen" 
                    onClick={() => insertText("![Alt text](", ")")}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative">
            {activeTab === "edit" && (
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full p-8 bg-zinc-900 text-zinc-100 placeholder-zinc-700 outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Empieza a escribir..."
                />
              </div>
            )}

            {activeTab === "preview" && (
              <div className="flex-1 p-8 bg-zinc-900 overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || "*No hay contenido para previsualizar*"}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === "split" && (
              <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-6 bg-zinc-900 text-zinc-100 placeholder-zinc-700 outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Escribe aquí..."
                />
                <div className="h-full p-6 bg-zinc-900 overflow-y-auto">
                   <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || "*Previsualización*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Bar */}
            <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2 flex items-center justify-between text-xs text-zinc-500">
               <div className="flex gap-4">
                  <span>{content.length} caracteres</span>
                  <span>{content.split(/\s+/).filter(w => w.length > 0).length} palabras</span>
                  <span>{content.split("\n").length} líneas</span>
               </div>
               <div>
                  Markdown Compatible
               </div>
            </div>
          </div>
        </div>


        {/* Danger Zone */}
        {!isNew && (
          <div className="bg-red-500/5 rounded-lg p-6 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-red-400">Zona de Peligro</h3>
                <p className="text-zinc-400 text-sm">
                  Esta acción eliminará el post permanentemente. No se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/50 rounded-md transition-all text-sm font-medium"
              >
                Eliminar Post
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Definitions */}
      {/* Add Field Modal */}
      <Modal
        isOpen={showAddField}
        onClose={() => setShowAddField(false)}
        title="Añadir Nuevo Campo"
        description="Define el nombre y el tipo del nuevo campo de metadatos."
        footer={
          <div className="flex justify-end gap-2">
            <button
               onClick={() => setShowAddField(false)}
               className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
               onClick={handleAddField}
               className="px-4 py-2 text-sm bg-white text-black rounded font-medium hover:bg-zinc-200"
            >
              Añadir
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre del Campo (Key)</label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-white outline-none"
              placeholder="Ej: author, category, date..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo de Dato</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-white outline-none"
            >
              <option value="string">Texto</option>
              <option value="number">Número</option>
              <option value="boolean">Booleano (Si/No)</option>
              <option value="array">Lista (Tags)</option>
              <option value="date">Fecha</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Import Metadata Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Metadatos"
        description="Selecciona un post existente para copiar sus metadatos al post actual."
        footer={
           <button
             onClick={() => setShowImportModal(false)}
             className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
           >
             Cancelar
           </button>
        }
      >
        <div className="space-y-4">
           {/* Search */}
           <input
             type="text"
             placeholder="Buscar posts..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-white outline-none"
           />
           
           {/* List */}
           <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
             {loadingPosts ? (
               <div className="text-center py-4 text-zinc-500">Cargando posts...</div>
             ) : (
               importablePosts
                  .filter(p => 
                    (p.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.filePath.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(post => (
                 <button
                   key={post._id}
                   onClick={() => handleImportMetadata(post)}
                   className="w-full text-left p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all group"
                 >
                   <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                     {post.metadata.title || "Sin título"}
                   </div>
                   <div className="text-xs text-zinc-500 font-mono truncate">
                     {post.filePath}
                   </div>
                 </button>
               ))
             )}
             {!loadingPosts && importablePosts.length > 0 && importablePosts.filter(p => p.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="text-center py-4 text-zinc-500">No se encontraron posts</div>
             )}
             {!loadingPosts && importablePosts.length === 0 && (
               <div className="text-center py-4 text-zinc-500">No hay otros posts disponibles</div>
             )}
           </div>
        </div>
      </Modal>
      <Modal
        isOpen={showConflictError}
        onClose={() => setShowConflictError(false)}
        title="⚠️ Conflicto Detectado"
        description="El archivo ha sido modificado externamente (probablemente en GitHub). Tus cambios no pueden guardarse automáticamente."
        footer={
          <button
            onClick={() => {
              setShowConflictError(false);
              router.refresh();
            }}
            className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-md transition-colors"
          >
            Refrescar y perder mis cambios
          </button>
        }
      >
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 mb-4 text-sm text-yellow-200">
          Recomendación: Copia tu contenido actual localmente antes de refrescar.
        </div>
      </Modal>

      <Modal
        isOpen={showPermissionError}
        onClose={() => setShowPermissionError(false)}
        title="❌ Error de Permisos"
        description="Tu aplicación no tiene permisos de escritura en este repositorio."
        footer={
          <button
            onClick={() => setShowPermissionError(false)}
            className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-md transition-colors"
          >
            Entendido
          </button>
        }
      >
        <div className="space-y-3 text-sm text-zinc-400">
          <p>Tu GitHub OAuth App no tiene permisos para hacer commits.</p>
          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
            <h4 className="font-semibold text-white mb-1">Solución:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ve a Settings &gt; Developer Settings en GitHub</li>
              <li>Crea una <strong>GitHub App</strong> (no OAuth App)</li>
              <li>Dale permisos de <code>Contents: Read & Write</code></li>
              <li>Actualiza las credenciales en <code>.env.local</code></li>
            </ol>
          </div>
          <p>Consulta <code>GITHUB_PERMISSIONS.md</code> para más detalles.</p>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Post"
        description="¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer."
        footer={
           <div className="flex justify-end gap-2">
             <button
               onClick={() => setShowDeleteConfirm(false)}
               className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
               disabled={deleting}
             >
               Cancelar
             </button>
             <button
               onClick={handleDelete}
               disabled={deleting}
               className="px-4 py-2 text-sm bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
             >
               {deleting ? "Eliminando..." : "Sí, Eliminar"}
             </button>
           </div>
        }
      >
         <div className="space-y-4">
           {post.sha && (
            <div className="flex items-start gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
                <input
                  type="checkbox"
                  id="deleteFromGithub"
                  checked={deleteFromGitHub}
                  onChange={(e) => setDeleteFromGitHub(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-red-500 text-red-600"
                />
                <label htmlFor="deleteFromGithub" className="text-sm text-zinc-300 cursor-pointer select-none">
                   <strong>También eliminar de GitHub</strong>
                   <p className="text-zinc-500 text-xs mt-1">
                      Esto eliminará el archivo <code>{post.filePath}</code> del repositorio remoto.
                   </p>
                </label>
            </div>
           )}
           <div className="text-sm text-zinc-400">
              El post se eliminará permanentemente de la base de datos local.
           </div>
         </div>
      </Modal>
    </>
  );
}
