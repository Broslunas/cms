"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Modal from "./Modal";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { VersionHistory } from "./VersionHistory";
import { DiffViewer } from "./DiffViewer";
import { EditorHeader } from "./post-editor/EditorHeader";
import { MetadataEditor } from "./post-editor/MetadataEditor";
import { ContentEditor } from "./post-editor/ContentEditor";
import { Wand2 } from "lucide-react";


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

function generateYaml(meta: any) {
  let output = "---\n";
  for(const [key, value] of Object.entries(meta)) {
      if(value === undefined || value === null) continue;
      if(Array.isArray(value)) {
         output += `${key}:\n`;
         value.forEach(v => {
             if(typeof v === 'object') output += `  - ${JSON.stringify(v)}\n`;
             else output += `  - ${v}\n`;
         });
      } else if (typeof value === 'object') {
         output += `${key}: ${JSON.stringify(value)}\n`;
      } else {
         output += `${key}: ${value}\n`;
      }
  }
  output += "---\n";
  return output;
}

export default function PostEditor({ post, schema, isNew = false, templatePosts = [] }: PostEditorProps) {
  const [metadata, setMetadata] = useState<PostMetadata>(post.metadata);
  const [content, setContent] = useState(post.content);
  const [createFilePath, setCreateFilePath] = useState(
    isNew 
      ? `src/content/${post.collection || 'blog'}/untitled.md` 
      : post.filePath
  );
  const [currentSha, setCurrentSha] = useState(post.sha);

  useEffect(() => {
    if (post.sha) setCurrentSha(post.sha);
  }, [post.sha]);
  
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
  
  const [showHistory, setShowHistory] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffOriginal, setDiffOriginal] = useState("");
  const [diffCurrent, setDiffCurrent] = useState("");

  // Blame State
  const [showBlame, setShowBlame] = useState(false);
  const [blameRanges, setBlameRanges] = useState<any[]>([]);
  const [loadingBlame, setLoadingBlame] = useState(false);

  // Sync State
  const [isSynced, setIsSynced] = useState(post.status === "synced");

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'content' | 'metadata', key?: string }>({ type: 'content' });
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("images");
  const [uploadFilename, setUploadFilename] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLimitedStorage, setIsLimitedStorage] = useState(false);

  useEffect(() => {
    fetch(`/api/storage/status?repoId=${encodeURIComponent(post.repoId)}`)
      .then(res => res.json())
      .then(data => setIsLimitedStorage(!!data.isLimited))
      .catch(() => setIsLimitedStorage(true)); // Fallback to limited if check fails
  }, [post.repoId]);

  useEffect(() => {
    // Poll for sync status if not new
    if (isNew || !post.repoId || !post.filePath || !currentSha) return;

    const checkSync = async () => {
        setIsCheckingSync(true);
        try {
            const [owner, repo] = post.repoId.split('/');
            const res = await fetch(`/api/repo/check-sync?owner=${owner}&repo=${repo}&path=${encodeURIComponent(post.filePath)}&sha=${currentSha}`);
            if (res.ok) {
                const data = await res.json();
                setIsSynced(data.synced);
            }
        } catch (e) {
            console.error("Sync check failed", e);
        } finally {
            setIsCheckingSync(false);
        }
    };

    const interval = setInterval(checkSync, 30000); // Check every 30s
    checkSync(); // Initial check

    return () => clearInterval(interval);
  }, [post.repoId, post.filePath, currentSha, isNew]);

  const [suggestedFields, setSuggestedFields] = useState<Record<string, { type: string; nestedFields?: Record<string, any> }>>({});

  useEffect(() => {
    if (post.repoId) {
        // Only fetch when opening the modal or if not fetched yet
        fetch(`/api/repo/config?repo=${encodeURIComponent(post.repoId)}`)
            .then(res => res.json())
            .then(data => {
                if (data.schemas) {
                    // Try to match collection
                    const collectionName = post.collection || 'blog';
                    // The parser returns keys like 'episodios', 'blog'
                    // We try exact match first
                    let schema = data.schemas[collectionName];
                    
                    // If not found, maybe the collection name in URL doesn't match config variable
                    // We could try to show aggregated fields or just fail gracefully.
                    // For now, if exact match fails, try case insensitive?
                    if (!schema) {
                        const foundKey = Object.keys(data.schemas).find(k => k.toLowerCase() === collectionName.toLowerCase());
                        if (foundKey) schema = data.schemas[foundKey];
                    }

                    if (schema) {
                        setSuggestedFields(schema);
                    }
                }
            })
            .catch(err => console.error("Error fetching suggestions:", err));
    }
  }, [post.repoId, post.collection]);

  const [showTemplateModal, setShowTemplateModal] = useState(isNew && templatePosts.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

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

  const updateMetadata = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set initial custom filename without extension for easier editing
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
    setUploadFilename(nameWithoutExt || file.name);

    if (isLimitedStorage) {
      // Skip modal, show info and upload directly
      toast.info(
        <div className="space-y-1">
          <p className="font-semibold">Usando Almacenamiento Free Limitado</p>
          <ul className="text-[10px] list-disc list-inside opacity-90">
            <li>Solo imágenes</li>
            <li>Convertido auto a WebP</li>
            <li>Máximo 300KB</li>
            <li>Nombre aleatorio</li>
            <li>Carpeta raíz</li>
          </ul>
        </div>,
        { duration: 5000 }
      );
      
      // We need to call confirmUpload but we don't have pendingFile in state yet synchronously
      // So we use the file directly
      await performUpload(file);
    } else {
      setPendingFile(file);
      setShowUploadModal(true);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    await performUpload(pendingFile);
  };

  const performUpload = async (file: File) => {
    setIsUploading(true);
    setShowUploadModal(false);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // If limited, we override folder and filename to be safe, though server does it too
      const folderArg = isLimitedStorage ? "" : uploadFolder;
      const filenameArg = isLimitedStorage ? "" : uploadFilename;

      const response = await fetch(`/api/upload?repoId=${encodeURIComponent(post.repoId)}&folder=${encodeURIComponent(folderArg)}&filename=${encodeURIComponent(filenameArg)}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (uploadTarget.type === 'metadata' && uploadTarget.key) {
          updateMetadata(uploadTarget.key, data.url);
          toast.success("Imagen subida y actualizada");
        } else {
          insertText(`![${file.name}](${data.url})`, "");
          toast.success("Imagen subida e insertada");
        }
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al subir");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error de conexión al subir");
    } finally {
      setIsUploading(false);
      setPendingFile(null);
    }
  };

  const triggerUpload = (target: { type: 'content' | 'metadata', key?: string }) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

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
    if (newFieldType === "transcription") initialValue = [];
    if (newFieldType === "sections") initialValue = [];

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
          repoId: post.repoId,
          deleteFromGitHub: deleteFromGitHub && currentSha, 
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

  const handleHistoryRestore = (newMetadata: any, newContent: string, newSha: string) => {
    setMetadata(newMetadata);
    setContent(newContent);
    setCurrentSha(newSha);
    router.refresh(); 
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
            repoId: post.repoId,
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
          
          if (result.newSha) {
            setCurrentSha(result.newSha);
          }
          
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

  const loadBlame = async () => {
      setLoadingBlame(true);
      try {
          const [owner, repo] = post.repoId.split('/');
          const res = await fetch(`/api/repo/blame?owner=${owner}&repo=${repo}&path=${encodeURIComponent(post.filePath)}`);
          if (res.ok) {
              const data = await res.json();
              setBlameRanges(data.ranges);
          } else {
              toast.error("Error cargando Blame");
          }
      } catch (e) {
          toast.error("Error conectando para Blame");
      } finally {
          setLoadingBlame(false);
      }
  };

  const handleShowDiff = () => {
    // Construct original (Initial Load)
    // Note: post.metadata is the initial metadata passed via props.
    // If post.content is null, use empty string.
    const oldYaml = generateYaml(post.metadata);
    const oldFull = isNew ? "" : (oldYaml + (post.content || ""));

    // Construct current (Draft)
    const currentYaml = generateYaml(metadata);
    const currentFull = currentYaml + (content || "");

    setDiffOriginal(oldFull);
    setDiffCurrent(currentFull);
    setShowDiffModal(true);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.zip"
      />
      
      <EditorHeader 
        repoId={post.repoId}
        isNew={!!isNew}
        saving={saving}
        committing={committing}
        onSave={handleSave}
        onShowDiff={handleShowDiff}
        onShowBlame={() => {
            setShowBlame(true);
            if (blameRanges.length === 0) loadBlame();
        }}
        onShowHistory={() => setShowHistory(true)}

        onDelete={() => setShowDeleteConfirm(true)}
      />

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
            <div className="flex items-center gap-2">
                {isCheckingSync && (
                    <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" title="Comprobando sincronización..." />
                )}
                <span
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                    isSynced
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                }`}
                title={isSynced ? "Sincronizado con GitHub" : "Cambios locales no subidos o desactualizado"}
                >
                <span className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {isSynced ? "Sincronizado" : "No Sincronizado"}
                </span>
            </div>
          </div>
        </div>

        {/* Metadata Fields */}
        <MetadataEditor 
            metadata={metadata}
            onUpdate={updateMetadata}
            onDeleteField={handleDeleteField}
            onShowImportModal={() => { setShowImportModal(true); loadImportablePosts(); }}
            onShowAiModal={() => setShowAiModal(true)}
            onShowAddField={() => setShowAddField(true)}
            onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
            isNew={!!isNew}
            triggerUpload={triggerUpload}
            isUploading={isUploading}
            uploadTarget={uploadTarget}
            suggestedFields={suggestedFields}
            content={content}
            repoId={post.repoId}
        />

        {/* Content Editor */}
        <ContentEditor 
            content={content}
            onChange={setContent}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            textareaRef={textareaRef}
            insertText={insertText}
            triggerUpload={triggerUpload}
            isUploading={isUploading}
            uploadTarget={uploadTarget}
            repoId={post.repoId}
        />

        {/* Danger Zone - Removed redundant content as it's just empty or duplicates actions */}

      </main>

      {/* History Modal */}
      {post.repoId && (
        <VersionHistory
          owner={post.repoId.split('/')[0]}
          repo={post.repoId.split('/')[1]}
          path={post.filePath}
          postId={post._id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestore={handleHistoryRestore}
        />
      )}

      {/* Diff Modal */}
      <Modal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        title="Diferencias de Contenido"
        description="Comparando el contenido original (guardado) con tu borrador actual."
        className="max-w-6xl"
        footer={<button onClick={()=>setShowDiffModal(false)} className="px-4 py-2 text-sm text-foreground bg-secondary rounded hover:bg-secondary/80">Cerrar</button>}
      >
        <DiffViewer oldValue={diffOriginal} newValue={diffCurrent} />
      </Modal>

      {/* Blame Modal/Overlay - Using a Modal due to potential size */}
       <Modal
        isOpen={showBlame}
        onClose={() => setShowBlame(false)}
        title="Git Blame Information"
        description={`Historial de cambios línea por línea para ${post.filePath}`}
        className="max-w-5xl"
        footer={<button onClick={()=>setShowBlame(false)} className="px-4 py-2 text-sm text-foreground bg-secondary rounded hover:bg-secondary/80">Cerrar</button>}
      >
        <div className="max-h-[70vh] overflow-y-auto">
            {loadingBlame && (
                <div className="flex justify-center p-8">
                     <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            )}
            {!loadingBlame && blameRanges.length === 0 && <p className="text-muted-foreground text-center p-4">No hay información de blame disponible.</p>}
            {!loadingBlame && blameRanges.length > 0 && (
                <div className="font-mono text-xs">
                    {blameRanges.map((range, idx) => (
                        <div key={idx} className="flex border-b border-border hover:bg-muted/30 p-1">
                             <div className="w-16 text-muted-foreground border-r border-border pr-2 mr-2 text-right">
                                {range.startingLine}-{range.endingLine}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-primary">{range.commit.author.name}</span>
                                    <span className="text-muted-foreground">
                                        {range.commit.committedDate && !isNaN(new Date(range.commit.committedDate).getTime())
                                            ? formatDistanceToNow(new Date(range.commit.committedDate), { addSuffix: true, locale: es })
                                            : "Fecha desconocida"}
                                    </span>
                                </div>
                                <div className="text-muted-foreground truncate" title={range.commit.message}>
                                    {range.commit.message}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5 select-all">
                                    {range.commit.oid.substring(0, 7)}
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </Modal>


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
          {/* Global Suggestions for new features */}
          {(!metadata.transcription || !metadata.sections) && (
            <div className="bg-indigo-500/5 p-3 rounded-md border border-indigo-500/20 mb-4">
                <p className="text-xs font-medium text-indigo-500 mb-2 flex items-center gap-2">
                    <Wand2 className="w-3 h-3" />
                    Funciones Pro (IA & Audio)
                </p>
                <div className="flex flex-wrap gap-2">
                    {!metadata.transcription && (
                        <button
                            onClick={() => { setNewFieldName("transcription"); setNewFieldType("transcription"); }}
                            className={`px-2 py-1 text-xs border rounded transition-colors flex items-center gap-1 ${
                                newFieldName === "transcription" 
                                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-500" 
                                    : "bg-background border-border text-foreground hover:border-indigo-500/50"
                            }`}
                        >
                            transcription <span className="opacity-50 text-[10px]">(audio)</span>
                        </button>
                    )}
                    {!metadata.sections && (
                        <button
                            onClick={() => { setNewFieldName("sections"); setNewFieldType("sections"); }}
                            className={`px-2 py-1 text-xs border rounded transition-colors flex items-center gap-1 ${
                                newFieldName === "sections" 
                                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-500" 
                                    : "bg-background border-border text-foreground hover:border-indigo-500/50"
                            }`}
                        >
                            sections <span className="opacity-50 text-[10px]">(capítulos)</span>
                        </button>
                    )}
                </div>
            </div>
          )}

          {/* Suggestions from config.ts */}
          {Object.keys(suggestedFields).length > 0 && (
            <div className="bg-muted/30 p-3 rounded-md border border-dashed border-border mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Sugerencias del repositorio (config.ts)
                </p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(suggestedFields)
                        .filter(([key]) => !metadata[key]) // Filter out already existing fields
                        .map(([key, def]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setNewFieldName(key);
                                setNewFieldType(def.type);
                            }}
                            className={`px-2 py-1 text-xs border rounded transition-colors flex items-center gap-1 ${
                                newFieldName === key 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "bg-background border-border text-foreground hover:border-primary/50"
                            }`}
                        >
                            {key} <span className="opacity-50 text-[10px]">({def.type})</span>
                        </button>
                    ))}
                    {Object.entries(suggestedFields).filter(([key]) => !metadata[key]).length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Todos los campos sugeridos ya están añadidos.</p>
                    )}
                </div>
            </div>
          )}

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
              <option value="transcription">Transcripción (Deepgram)</option>
              <option value="sections">Secciones (Capítulos)</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); setPendingFile(null); }}
        title="Subir Archivo"
        description="Selecciona el directorio de destino para tu archivo en el almacenamiento."
        footer={
           <div className="flex justify-end gap-2">
             <button
               onClick={() => { setShowUploadModal(false); setPendingFile(null); }}
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
             >
               Cancelar
             </button>
             <button
               onClick={confirmUpload}
               disabled={isUploading}
               className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
             >
               {isUploading && <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />}
               {isUploading ? "Subiendo..." : "Subir ahora"}
             </button>
           </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-md italic text-xs text-muted-foreground">
             <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             Archivo seleccionado: {pendingFile?.name} ({pendingFile ? (pendingFile.size / 1024).toFixed(1) : 0} KB)
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Nombre del Archivo</label>
            <div className="relative">
                <input
                    type="text"
                    value={uploadFilename}
                    onChange={(e) => setUploadFilename(e.target.value)}
                    className="w-full bg-background border border-input rounded p-2 pl-8 text-sm text-foreground focus:border-ring outline-none"
                    placeholder="ej: mi-imagen-bonita"
                />
                <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Directorio de Destino</label>
            <div className="relative">
                <input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full bg-background border border-input rounded p-2 pl-8 text-sm text-foreground focus:border-ring outline-none"
                    placeholder="images, uploads, assets/blog..."
                />
                <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
                El archivo se guardará en: <span className="font-mono">{uploadFolder || '(raíz)'}/{uploadFilename || 'uuid'}.{pendingFile?.name.split('.').pop()}</span>
            </p>
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
                <div className="text-center py-8 text-muted-foreground">
                    <p>No se encontraron posts en esta colección.</p>
                </div>
              )}
           </div>
        </div>
      </Modal>

    </>
  );
}
