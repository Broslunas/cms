"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import Modal from "./Modal";
import { SocialLinksEditor } from "./SocialLinksEditor";

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
  templatePosts?: Post[];
}

function JsonFieldEditor({ fieldKey, value, onChange, onDelete, isComplexArray = false }: { fieldKey: string, value: any, onChange: (val: any) => void, onDelete: () => void, isComplexArray?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  const handleSave = () => {
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setIsEditing(false);
      setError("");
    } catch (e) {
      setError("JSON inválido: " + (e as Error).message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setText(JSON.stringify(value, null, 2));
    setError("");
  };

  if (isEditing) {
    return (
        <div key={fieldKey} className="w-full">
            <div className="bg-card border border-border rounded-md p-3">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-48 bg-muted/50 text-foreground font-mono text-xs p-2 rounded border border-border focus:outline-none focus:border-ring resize-y"
                    spellCheck={false}
                />
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                <div className="flex justify-end gap-2 mt-3">
                    <button onClick={handleCancel} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancelar</button>
                    <button onClick={handleSave} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Guardar JSON</button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-md p-4">
        <div className="flex justify-between items-start mb-2">
             <p className="text-sm text-muted-foreground">
               {isComplexArray 
                 ? `Campo complejo con ${value.length} elementos`
                 : "Campo objeto complejo"}
             </p>
             <button
                onClick={() => { setText(JSON.stringify(value, null, 2)); setIsEditing(true); }}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                title="Editar JSON"
             >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 Editar JSON
             </button>
        </div>
        <details className="mt-2">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
            Ver JSON Actual
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 bg-muted/50 p-2 rounded border border-border">
            {JSON.stringify(value, null, 2)}
            </pre>
        </details>
    </div>
  )
}



function TranscriptionEditor({ fieldKey, value, onChange, onDelete }: { fieldKey: string, value: any[], onChange: (val: any[]) => void, onDelete: () => void }) {
  // Verificación de seguridad
  if (!Array.isArray(value)) return null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const handleUpdate = (index: number, field: string, newValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...value, { time: "00:00", text: "" }]);
    setIsExpanded(true); // Auto-expand when adding
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const toggleJsonMode = () => {
      if (!isJsonMode) {
          setJsonText(JSON.stringify(value, null, 2));
          setIsJsonMode(true);
      } else {
          setIsJsonMode(false);
          setJsonError("");
      }
  };

  const handleImport = () => {
      // Intentar primero como JSON
      try {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed)) {
            onChange(parsed);
            setIsJsonMode(false);
            setJsonError("");
            return;
          }
      } catch (e) {
         // Silently fail JSON parse, try text parse
      }

      // Intentar Parseo de Texto ([00:00] Speaker: Text)
      try {
          const lines = jsonText.split('\n');
          const transcription: any[] = [];
          const regex = /^\[(\d{1,2}:\d{2})\]\s*(?:[^:]+:\s*)?(.*)/;

          let hasMatches = false;

          lines.forEach(line => {
              const cleanLine = line.trim();
              if (!cleanLine) return;

              const match = cleanLine.match(regex);
              if (match) {
                  hasMatches = true;
                  const time = match[1];
                  const textContent = match[2] ? match[2].trim() : "";
                  
                  // Simple unescape if user pasted stringified text by mistake, otherwise keep distinct
                  transcription.push({
                      time: time,
                      text: textContent
                  });
              }
          });

          if (hasMatches && transcription.length > 0) {
              onChange(transcription);
              setIsJsonMode(false);
              setJsonError("");
              return;
          }

          throw new Error("No se pudo detectar formato JSON ni Texto válido ([00:00] ...)");
      } catch (e) {
          setJsonError((e as Error).message);
      }
  };

  return (
    <div key={fieldKey} className="w-full">
      <div className="bg-muted/30 border border-border rounded-lg overflow-hidden transition-all">
        {/* Header - Always visible & clickable to toggle */}
        <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center gap-3">
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                 >
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                 </button>
                 <div>
                    <p className="text-sm font-medium text-foreground">Editor de Transcripción</p>
                    <p className="text-xs text-muted-foreground">{value.length} segmentos</p>
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                 {isExpanded && (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleJsonMode(); }}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${isJsonMode ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'}`}
                    >
                        {isJsonMode ? 'Cancelar Importación' : 'Importar JSON/Texto'}
                    </button>
                 )}
            </div>
        </div>
        
        {/* Content Body */}
        {isExpanded && (
            <div className="p-4 border-t border-border bg-card/30">
                {isJsonMode ? (
                    <div className="space-y-3">
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            className="w-full h-64 bg-background text-foreground font-mono text-xs p-3 rounded border border-input focus:outline-none focus:border-ring resize-y"
                            placeholder="Pega tu JSON o Texto con formato [00:00] Speaker: ... aquí..."
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-destructive text-xs">{jsonError}</p>}
                        <div className="flex justify-end gap-2">
                            <button onClick={toggleJsonMode} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancelar</button>
                            <button onClick={handleImport} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Procesar e Importar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {value.map((item, index) => (
                            <div key={index} className="flex gap-3 bg-card border border-border p-3 rounded-md group hover:border-input transition-colors">
                            <div className="w-24 shrink-0">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Tiempo</label>
                                <input
                                type="text"
                                value={item.time || ""}
                                onChange={(e) => handleUpdate(index, "time", e.target.value)}
                                placeholder="00:00"
                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Texto</label>
                                <textarea
                                value={item.text || ""}
                                onChange={(e) => handleUpdate(index, "text", e.target.value)}
                                placeholder="Escribe la transcripción..."
                                rows={2}
                                className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[60px]"
                                />
                            </div>
                            <button
                                onClick={() => handleRemove(index)}
                                className="self-start mt-6 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar segmento"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            </div>
                        ))}
                        </div>

                        <button
                        onClick={handleAdd}
                        className="mt-4 w-full py-2 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-input hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                        >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Añadir Nuevo Segmento
                        </button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

function SectionsEditor({ fieldKey, value, onChange, onDelete }: { fieldKey: string, value: any[], onChange: (val: any[]) => void, onDelete: () => void }) {
    // Verificación de seguridad
    if (!Array.isArray(value)) return null;

    const [isExpanded, setIsExpanded] = useState(false);
    const [isJsonMode, setIsJsonMode] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
  
    const handleUpdate = (index: number, field: string, newValue: string) => {
      const updated = [...value];
      updated[index] = { ...updated[index], [field]: newValue };
      onChange(updated);
    };
  
    const handleAdd = () => {
      onChange([...value, { time: "00:00", title: "" }]);
      setIsExpanded(true);
    };
  
    const handleRemove = (index: number) => {
      const updated = value.filter((_, i) => i !== index);
      onChange(updated);
    };

    const toggleJsonMode = () => {
        if (!isJsonMode) {
            setJsonText(JSON.stringify(value, null, 2));
            setIsJsonMode(true);
        } else {
            setIsJsonMode(false);
            setJsonError("");
        }
    };

    const handleJsonSave = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
            onChange(parsed);
            setIsJsonMode(false);
            setJsonError("");
        } catch (e) {
            setJsonError("JSON inválido: " + (e as Error).message);
        }
    };
  
    return (
      <div key={fieldKey} className="w-full">
        <div className="bg-muted/30 border border-border rounded-lg overflow-hidden transition-all">
          {/* Header */}
          <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div>
                         <p className="text-sm font-medium text-foreground">Editor de Secciones</p>
                         <p className="text-xs text-muted-foreground">{value.length} secciones</p>
                    </div>
              </div>
              <div className="flex items-center gap-2">
                 {isExpanded && (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleJsonMode(); }}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${isJsonMode ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'}`}
                    >
                        {isJsonMode ? 'Cancelar JSON' : 'Importar/Editar JSON'}
                    </button>
                 )}
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-4 border-t border-border bg-card/30">
                 {isJsonMode ? (
                    <div className="space-y-3">
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            className="w-full h-64 bg-background text-foreground font-mono text-xs p-3 rounded border border-input focus:outline-none focus:border-ring resize-y"
                            placeholder="Pega tu JSON aquí..."
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-destructive text-xs">{jsonError}</p>}
                        <div className="flex justify-end gap-2">
                            <button onClick={toggleJsonMode} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancelar</button>
                            <button onClick={handleJsonSave} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Guardar Cambios</button>
                        </div>
                    </div>
                 ) : (
                    <>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {value.map((item, index) => (
                            <div key={index} className="flex gap-3 bg-card border border-border p-3 rounded-md group hover:border-input transition-colors items-center">
                                <div className="w-24 shrink-0">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Tiempo</label>
                                <input
                                    type="text"
                                    value={item.time || ""}
                                    onChange={(e) => handleUpdate(index, "time", e.target.value)}
                                    placeholder="00:00"
                                    className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                </div>
                                <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Título</label>
                                <input
                                    type="text"
                                    value={item.title || ""}
                                    onChange={(e) => handleUpdate(index, "title", e.target.value)}
                                    placeholder="Título de la sección..."
                                    className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                </div>
                                <button
                                onClick={() => handleRemove(index)}
                                className="mt-4 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar sección"
                                >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            ))}
                        </div>
                
                        <button
                            onClick={handleAdd}
                            className="mt-4 w-full py-2 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-input hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Añadir Nueva Sección
                        </button>
                    </>
                 )}
            </div>
          )}
        </div>
      </div>
    );
  }

export default function PostEditor({ post, schema, isNew = false, templatePosts = [] }: PostEditorProps) {
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

  // Permissions
  // const userPermissions = post.userPermissions;
  // const canEdit = !userPermissions || userPermissions.includes("manage") || (isNew && userPermissions.includes("create"));
  // const canDelete = !userPermissions || userPermissions.includes("manage");

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importablePosts, setImportablePosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ metadata: any, content: string } | null>(null);
  const [referencePost, setReferencePost] = useState<Post | null>(null);
  const [showRefSelector, setShowRefSelector] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(isNew && templatePosts.length > 0);
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

    if (isNew) {
        const lastSlashIndex = sourcePost.filePath.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
            const folderPath = sourcePost.filePath.substring(0, lastSlashIndex);
            // Mantener el nombre de archivo actual ("untitled.md" u otro que haya escrito el usuario)
            const currentFileName = createFilePath.split("/").pop() || "untitled.md";
            setCreateFilePath(`${folderPath}/${currentFileName}`);
        }
    }

    setShowImportModal(false);
    toast.success("Metadatos y ruta importados. Revisa el título.");
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Por favor, introduce un prompt");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generando contenido con IA...");

    // Si el usuario eligió un post de referencia, extraemos su esquema
    let currentSchema = schema;
    if (referencePost) {
        currentSchema = {};
        Object.keys(referencePost.metadata).forEach(key => {
            const val = referencePost.metadata[key];
            currentSchema![key] = { 
                type: Array.isArray(val) ? "array" : typeof val, 
                optional: true 
            };
        });
    } else if (!currentSchema && Object.keys(metadata).length > 0) {
      currentSchema = {};
      Object.keys(metadata).forEach(key => {
        const val = metadata[key];
        currentSchema![key] = { 
            type: Array.isArray(val) ? "array" : typeof val, 
            optional: true 
        };
      });
    }

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          schema: currentSchema 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiPreview({
          metadata: data.metadata || {},
          content: data.content || ""
        });
        toast.success("Generación completada. Revisa el resultado.", { id: toastId });
      } else {
        const error = await res.json();
        toast.error(`Error: ${error.error || "Error desconocido"}`, { id: toastId });
      }
    } catch (e) {
      toast.error("Error conectando con la IA", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAiGeneration = () => {
    if (!aiPreview) return;
    
    if (aiPreview.metadata) {
      setMetadata(prev => ({ ...prev, ...aiPreview.metadata }));
    }
    if (aiPreview.content) {
      setContent(aiPreview.content);
    }
    
    setAiPreview(null);
    setShowAiModal(false);
    setAiPrompt("");
    toast.success("¡Cambios aplicados correctamente!");
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

      let finalCollection = post.collection;
      
      // Inferir colección desde el path
      // Formato esperado: src/content/<collection>/<filename>
      const pathToCheck = isNew ? createFilePath : post.filePath;
      const match = pathToCheck.match(/src\/content\/([^/]+)\//);
      if (match && match[1]) {
          finalCollection = match[1];
      }

      if (isNew) {
         body = {
            repoId: post.repoId,
            collection: finalCollection,
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
          // Descartar el toast de loading
          toast.dismiss(toastId);
          
          // Construir la URL del commit en GitHub
          const commitUrl = `https://github.com/${result.owner}/${result.repo}/commit/${result.commitSha}`;
          
          // Mostrar un toast personalizado con enlace al commit
          toast.success(
            <div className="flex flex-col gap-1">
              <p className="font-medium">Cambios guardados y commiteados a GitHub</p>
              <a 
                href={commitUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Ver commit en GitHub
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>,
            { duration: 6000 }
          );
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
    // Arrays especiales (como transcription)
    if (key === 'social' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
            <div key={key}>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                    {key} <span className="text-xs text-muted-foreground font-normal">(Redes Sociales)</span>
                    </label>
                    <button 
                    onClick={() => handleDeleteField(key)} 
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title={`Eliminar campo ${key}`}
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    </button>
                </div>
                <SocialLinksEditor 
                    value={value}
                    onChange={(val) => updateMetadata(key, val)}
                />
            </div>
        );
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      // Check for Transcription format (time + text)
      const isTranscription = value.every(item => 'time' in item && 'text' in item);
      if (isTranscription) {
          return (
             <div key={key}>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                    {key}
                    </label>
                    <button 
                    onClick={() => handleDeleteField(key)} 
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title={`Eliminar campo ${key}`}
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    </button>
                </div>
                <TranscriptionEditor 
                    fieldKey={key}
                    value={value}
                    onChange={(val) => updateMetadata(key, val)}
                    onDelete={() => handleDeleteField(key)}
                />
             </div>
          )
      }

      // Check for Sections format (time + title)
      const isSections = value.every(item => 'time' in item && 'title' in item);
        if (isSections) {
        return (
           <div key={key}>
              <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground capitalize">
                  {key}
                  </label>
                  <button 
                  onClick={() => handleDeleteField(key)} 
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title={`Eliminar campo ${key}`}
                  >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  </button>
              </div>
              <SectionsEditor 
                  fieldKey={key}
                  value={value}
                  onChange={(val) => updateMetadata(key, val)}
                  onDelete={() => handleDeleteField(key)}
              />
           </div>
        )
    }

      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <JsonFieldEditor 
            fieldKey={key} 
            value={value} 
            onChange={(val: any) => updateMetadata(key, val)}
            onDelete={() => handleDeleteField(key)}
            isComplexArray={true}
          />
        </div>
      );
    }

    // Arrays simples (como tags)
    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground capitalize">
              {key} (separados por coma)
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      );
    }

    // Strings
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      
      // Detección de fecha ISO
      // Regex flexible para ISO 8601
      const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(trimmedValue);

      if (isDate) {
         try {
            const dateObj = new Date(trimmedValue);
            // Convertir a formato datetime-local (YYYY-MM-DDThh:mm)
            // Usamos getTimezoneOffset para ajustar a la hora local para el input
            const localISOTime = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            
            return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {key} <span className="text-muted-foreground text-xs font-normal">(Fecha)</span>
                    </label>
                    <button 
                      onClick={() => handleDeleteField(key)} 
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title={`Eliminar campo ${key}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={localISOTime}
                    onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        updateMetadata(key, newDate.toISOString());
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm [color-scheme:dark]"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{trimmedValue}</p>
                </div>
            );
         } catch (e) {
            // Si falla el parseo, mostrar como string normal
         }
      }

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
            <label className="text-sm font-medium text-foreground capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            {isImage && trimmedValue.length > 0 && (
              <div className="relative group w-fit">
                <div className="rounded-lg overflow-hidden border border-border bg-muted/50 max-w-xs">
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
            <label className="text-sm font-medium text-foreground capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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
                  className="w-4 h-4 bg-background border-input rounded"
                />
                <span className="text-sm font-medium text-foreground capitalize">{key}</span>
             </label>
             <button 
                onClick={() => handleDeleteField(key)} 
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
            <label className="text-sm font-medium text-foreground capitalize">
              {key}
            </label>
            <button 
              onClick={() => handleDeleteField(key)} 
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title={`Eliminar campo ${key}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <JsonFieldEditor 
             fieldKey={key} 
             value={value} 
             onChange={(val: any) => updateMetadata(key, val)}
             onDelete={() => handleDeleteField(key)}
          />
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
      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
    >
      {icon}
    </button>
  );

  return (
<>
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard/repos?repo=${encodeURIComponent(post.repoId)}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
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
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving || committing}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {committing ? "Commiteando..." : "Guardar y Commitear"}
            </button>

            {!isNew && (
              <div className="hidden md:block w-px h-6 bg-border mx-1" />
            )}

            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar Post"
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-background min-h-screen">
        {/* Meta Info */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-foreground/60">Repositorio:</span> {post.repoId}
              </p>
              
              {isNew ? (
                <div className="mt-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Path del archivo</label>
                    <input 
                        type="text" 
                        value={createFilePath}
                        onChange={(e) => setCreateFilePath(e.target.value)}
                        className="w-full bg-background border border-input rounded px-2 py-1 text-sm text-foreground font-mono focus:border-ring focus:outline-none"
                    />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                    <span className="text-foreground/60">Archivo:</span> {post.filePath}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${
                post.status === "synced"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
              }`}
            >
              {post.status}
            </span>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Metadata</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowImportModal(true); loadImportablePosts(); }}
                className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded border border-border transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
                Importar
              </button>
              <button
                onClick={() => setShowAiModal(true)}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar con IA
              </button>
              <button
                onClick={() => setShowAddField(true)}
                className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded transition-colors flex items-center gap-2"
              >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir Campo
              </button>
              {!isNew && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded transition-colors flex items-center gap-2"
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
            <p className="text-muted-foreground text-sm">No hay campos de metadata</p>
          )}
        </div>

        {/* Content Editor - THEMED + TOOLBAR */}
        <div className="bg-card rounded-lg shadow-sm border border-border flex flex-col min-h-[600px]">
          {/* Tabs & Toolbar */}
          <div className="border-b border-border bg-card">
            <div className="flex items-center justify-between px-4 py-2">
              {/* Tabs */}
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "edit"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "preview"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("split")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "split"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Split
                </button>
              </div>

              {/* Formatting Toolbar */}
              {(activeTab === "edit" || activeTab === "split") && (
                <div className="flex items-center gap-1 border-l border-border pl-4 ml-4">
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
                  <div className="w-px h-4 bg-border mx-1" />
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
                  <div className="w-px h-4 bg-border mx-1" />
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
                  <div className="w-px h-4 bg-border mx-1" />
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
                  className="flex-1 w-full p-8 bg-background text-foreground placeholder-muted-foreground outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Empieza a escribir..."
                />
              </div>
            )}

            {activeTab === "preview" && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || "*No hay contenido para previsualizar*"}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === "split" && (
              <div className="flex-1 grid grid-cols-2 divide-x divide-border">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-6 bg-background text-foreground placeholder-muted-foreground outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Escribe aquí..."
                />
                <div className="h-full p-6 bg-background overflow-y-auto">
                   <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || "*Previsualización*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Bar */}
            <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
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
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
               onClick={handleAddField}
               className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
            >
              Añadir
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre del Campo (Key)</label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
              placeholder="Ej: author, category, date..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Dato</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
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
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Elige una Plantilla"
        description={`Selecciona un post existente de la colección "${post.collection}" para usarlo como base.`}
        footer={
           <button
             onClick={() => setShowTemplateModal(false)}
             className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
           >
             Empezar desde cero (sin plantilla)
           </button>
        }
      >
        <div className="space-y-4">
           {/* List */}
           <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {templatePosts.map(p => (
                 <button
                   key={p._id}
                   onClick={() => {
                        handleImportMetadata(p);
                        setShowTemplateModal(false);
                   }}
                   className="w-full text-left p-4 rounded-lg bg-card border border-border hover:border-primary hover:bg-muted/50 transition-all group relative overflow-hidden"
                 >
                   <div className="flex justify-between items-start gap-4 z-10 relative">
                       <div className="min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {p.metadata.title || "Sin título"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                    {p.filePath}
                                </span>
                                {p.status === 'synced' && <span className="w-2 h-2 rounded-full bg-green-500" title="Sincronizado"/>}
                            </div>
                       </div>
                       <div className="text-xs text-muted-foreground whitespace-nowrap">
                           {new Date(p.metadata.date || Date.now()).toLocaleDateString()}
                       </div>
                   </div>
                 </button>
               ))}
           </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Metadatos"
        description="Selecciona un post existente para copiar sus metadatos al post actual."
        footer={
           <button
             onClick={() => setShowImportModal(false)}
             className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
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
             className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
           />
           
           {/* List */}
           <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {loadingPosts ? (
               <div className="text-center py-4 text-muted-foreground">Cargando posts...</div>
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
                   className="w-full text-left p-3 rounded bg-card border border-border hover:border-ring hover:bg-muted transition-all group"
                 >
                   <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                     {post.metadata.title || "Sin título"}
                   </div>
                   <div className="text-xs text-muted-foreground font-mono truncate">
                     {post.filePath}
                   </div>
                 </button>
               ))
             )}
             {!loadingPosts && importablePosts.length > 0 && importablePosts.filter(p => p.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No se encontraron posts</div>
             )}
             {!loadingPosts && importablePosts.length === 0 && (
               <div className="text-center py-4 text-muted-foreground">No hay otros posts disponibles</div>
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
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
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
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            Entendido
          </button>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Tu GitHub OAuth App no tiene permisos para hacer commits.</p>
          <div className="bg-muted p-3 rounded border border-border">
            <h4 className="font-semibold text-foreground mb-1">Solución:</h4>
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
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
               disabled={deleting}
             >
               Cancelar
             </button>
             <button
               onClick={handleDelete}
               disabled={deleting}
               className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded font-medium hover:bg-destructive/90 disabled:opacity-50"
             >
               {deleting ? "Eliminando..." : "Sí, Eliminar"}
             </button>
           </div>
        }
      >
         <div className="space-y-4">
           {post.sha && (
            <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-md">
                <input
                  type="checkbox"
                  id="deleteFromGithub"
                  checked={deleteFromGitHub}
                  onChange={(e) => setDeleteFromGitHub(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-background border-input rounded focus:ring-destructive text-destructive"
                />
                <label htmlFor="deleteFromGithub" className="text-sm text-muted-foreground cursor-pointer select-none">
                   <strong className="text-foreground">También eliminar de GitHub</strong>
                   <p className="text-muted-foreground/80 text-xs mt-1">
                      Esto eliminará el archivo <code>{post.filePath}</code> del repositorio remoto.
                   </p>
                </label>
            </div>
           )}
           <div className="text-sm text-muted-foreground">
              El post se eliminará permanentemente de la base de datos local.
           </div>
         </div>
      </Modal>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => {
            if (!isGenerating) {
                setShowAiModal(false);
                setAiPreview(null);
            }
        }}
        title="Asistente de IA (Gemini 2.0)"
        description={aiPreview ? "Valida el contenido generado antes de aplicarlo al post." : "Describe qué tipo de post quieres generar. La IA completará los metadatos y el contenido automáticamente."}
        footer={
           <div className="flex justify-end gap-2">
             <button
               onClick={() => { setShowAiModal(false); setAiPreview(null); }}
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
               disabled={isGenerating}
             >
               {aiPreview ? "Descartar" : "Cancelar"}
             </button>
             
             {aiPreview ? (
                <button
                    onClick={applyAiGeneration}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded font-medium hover:bg-green-700 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aplicar Cambios
                </button>
             ) : (
                <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                {isGenerating ? (
                    <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generar Post
                    </>
                )}
                </button>
             )}
           </div>
        }
      >
        <div className="space-y-4">
           {!aiPreview ? (
             <>
                {/* Referencia Selector */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Esquema de Referencia</label>
                    {!referencePost ? (
                        <button 
                            onClick={() => { setShowRefSelector(true); loadImportablePosts(); }}
                            className="w-full p-3 border border-dashed border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-between group"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                Seleccionar post de referencia...
                            </span>
                            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-indigo-500/10 rounded">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-foreground truncate">{referencePost.metadata.title || referencePost.filePath}</p>
                                    <p className="text-[10px] text-indigo-400 font-mono uppercase">Usando este esquema ({Object.keys(referencePost.metadata).length} campos)</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReferencePost(null)}
                                className="p-1 hover:text-destructive transition-colors"
                                title="Quitar referencia"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Instrucciones para la IA</label>
                    <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Escribe un post sobre las ventajas de usar Next.js 15 en producción..."
                    className="w-full h-32 bg-background border border-input rounded p-3 text-sm text-foreground focus:border-indigo-500 outline-none resize-none"
                    />
                </div>
             </>
           ) : (
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadatos Generados</h4>
                    <pre className="text-[11px] bg-muted/50 p-3 rounded border border-border overflow-x-auto font-mono">
                        {JSON.stringify(aiPreview.metadata, null, 2)}
                    </pre>
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vista Previa del Contenido</h4>
                    <div className="bg-background border border-border rounded p-4 text-xs prose dark:prose-invert max-w-none max-h-48 overflow-y-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {aiPreview.content}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-md p-3">
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Al aplicar, se sobrescribirán los campos actuales con estos nuevos valores.
                    </p>
                </div>
             </div>
           )}
        </div>
      </Modal>

      {/* Reference Post Selector Modal */}
      <Modal
        isOpen={showRefSelector}
        onClose={() => setShowRefSelector(false)}
        title="Seleccionar Post como Esquema"
        description={`Cargando posts de la colección '${post.collection}' para usar sus campos como referencia.`}
        footer={
           <button
             onClick={() => setShowRefSelector(false)}
             className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
           >
             Cancelar
           </button>
        }
      >
        <div className="space-y-4">
           <input
             type="text"
             placeholder="Filtrar por título o archivo..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-indigo-500 outline-none"
           />
           
           <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {loadingPosts ? (
               <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Buscando posts en el repositorio...</p>
               </div>
             ) : (
               importablePosts
                  .filter(p => 
                    p.collection === post.collection && // Misma colección
                    (p.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.filePath.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(p => (
                  <button
                    key={p._id}
                    onClick={() => {
                        setReferencePost(p);
                        setShowRefSelector(false);
                    }}
                    className="w-full text-left p-3 rounded bg-card border border-border hover:border-indigo-500/50 hover:bg-muted transition-all group"
                  >
                    <div className="font-medium text-foreground group-hover:text-indigo-500 transition-colors">
                      {p.metadata.title || "Sin título"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                            {Object.keys(p.metadata).length} campos
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {p.filePath.split('/').pop()}
                        </span>
                    </div>
                  </button>
                ))
             )}
             {!loadingPosts && importablePosts.filter(p => p.collection === post.collection).length === 0 && (
                <div className="text-center py-8 bg-muted/20 border border-dashed border-border rounded-md">
                   <p className="text-sm text-muted-foreground">No se encontraron otros posts en esta colección.</p>
                </div>
             )}
           </div>
        </div>
      </Modal>
    </>
  );
}
