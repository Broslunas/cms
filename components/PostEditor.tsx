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
import { Wand2, AlertTriangle, Lock, Sparkles, BookOpen } from "lucide-react";


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
  const [uploadTarget, setUploadTarget] = useState<{ type: 'content' | 'metadata', key?: string, index?: number, subKey?: string }>({ type: 'content' });
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("images");
  const [uploadFilename, setUploadFilename] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLimitedStorage, setIsLimitedStorage] = useState(false);
  const [uploadStorage, setUploadStorage] = useState<'repo' | 'default'>('repo');

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
          <p className="font-semibold">Using Free Limited Storage</p>
          <ul className="text-[10px] list-disc list-inside opacity-90">
            <li>Images only</li>
            <li>Auto converted to WebP</li>
            <li>Max 300KB</li>
            <li>Random name</li>
            <li>Root folder</li>
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

      const response = await fetch(`/api/upload?repoId=${encodeURIComponent(post.repoId)}&folder=${encodeURIComponent(folderArg)}&filename=${encodeURIComponent(filenameArg)}&useDefault=${uploadStorage === 'default'}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (uploadTarget.type === 'metadata' && uploadTarget.key) {
          if (uploadTarget.index !== undefined && uploadTarget.subKey) {
            // Nested array metadata update
            const array = [...(metadata[uploadTarget.key] || [])];
            if (array[uploadTarget.index]) {
              array[uploadTarget.index] = { ...array[uploadTarget.index], [uploadTarget.subKey]: data.url };
              updateMetadata(uploadTarget.key, array);
            }
          } else {
            // Simple metadata update
            updateMetadata(uploadTarget.key, data.url);
          }
          toast.success("Image uploaded and updated");
        } else {
          insertText(`![${file.name}](${data.url})`, "");
          toast.success("Image uploaded and inserted");
        }
      } else {
        const err = await response.json();
        toast.error(err.error || "Upload error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Connection error during upload");
    } finally {
      setIsUploading(false);
      setPendingFile(null);
    }
  };

  const triggerUpload = (target: { type: 'content' | 'metadata', key?: string, index?: number, subKey?: string }) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  // --- Handlers for Metadata Tools ---
  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("Field name is required");
      return;
    }
    
    if (metadata[newFieldName]) {
      toast.error("This field already exists");
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
    toast.success(`Field '${newFieldName}' added`);
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
      toast.error("Error loading posts");
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
    toast.success("Metadata and path imported. Check the title.");
  };

  const handleDeleteField = (key: string) => {
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      setMetadata(newMetadata);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const toastId = toast.loading("Deleting post...");

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
        toast.success("Post deleted successfully", { id: toastId });
        router.push(`/dashboard/repos?repo=${encodeURIComponent(post.repoId)}`);
      } else {
        const error = await response.json();
        toast.error(`Error deleting: ${error.error}`, { id: toastId });
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting the post", { id: toastId });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating content with AI...");

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
        toast.success("Generation completed. Check the result.", { id: toastId });
      } else {
        const error = await res.json();
        toast.error(`Error: ${error.error || "Unknown error"}`, { id: toastId });
      }
    } catch (e) {
      toast.error("Error connecting to AI", { id: toastId });
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
    toast.success("Changes applied successfully!");
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

    const toastId = toast.loading(commitToGitHub ? "Saving and committing..." : "Saving...");

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
              <p className="font-medium">Changes saved and committed to GitHub</p>
              <a 
                href={commitUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View commit on GitHub
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>,
            { duration: 6000 }
          );
        } else {
          toast.success("Changes saved locally", { id: toastId });
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
      toast.error("Error saving changes", { id: toastId });
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
              toast.error("Error loading Blame");
          }
      } catch (e) {
          toast.error("Connection error for Blame");
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
      <main className="max-w-7xl mx-auto px-6 py-8 pb-16 space-y-6 bg-background min-h-screen">
        {/* Meta Info */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-foreground/60">Repository:</span> {post.repoId}
              </p>
              
              {isNew ? (
                <div className="mt-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">File Path</label>
                    <input 
                        type="text" 
                        value={createFilePath}
                        onChange={(e) => setCreateFilePath(e.target.value)}
                        className="w-full bg-background border border-input rounded px-2 py-1 text-sm text-foreground font-mono focus:border-ring focus:outline-none"
                    />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                    <span className="text-foreground/60">File:</span> {post.filePath}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
                {isCheckingSync && (
                    <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" title="Checking sync..." />
                )}
                <span
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                    isSynced
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                }`}
                title={isSynced ? "Synced with GitHub" : "Local changes not uploaded or outdated"}
                >
                <span className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {isSynced ? "Synced" : "Not Synced"}
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
        title="Content Differences"
        description="Comparing original content (saved) with your current draft."
        className="max-w-6xl"
        footer={<button onClick={()=>setShowDiffModal(false)} className="px-4 py-2 text-sm text-foreground bg-secondary rounded hover:bg-secondary/80">Close</button>}
      >
        <DiffViewer oldValue={diffOriginal} newValue={diffCurrent} />
      </Modal>

      {/* Blame Modal/Overlay - Using a Modal due to potential size */}
       <Modal
        isOpen={showBlame}
        onClose={() => setShowBlame(false)}
        title="Git Blame Information"
        description={`Line-by-line change history for ${post.filePath}`}
        className="max-w-5xl"
        footer={<button onClick={()=>setShowBlame(false)} className="px-4 py-2 text-sm text-foreground bg-secondary rounded hover:bg-secondary/80">Close</button>}
      >
        <div className="max-h-[70vh] overflow-y-auto">
            {loadingBlame && (
                <div className="flex justify-center p-8">
                     <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            )}
            {!loadingBlame && blameRanges.length === 0 && <p className="text-muted-foreground text-center p-4">No blame information available.</p>}
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
                                            : "Unknown date"}
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
        title="Add New Field"
        description="Define the name and type of the new metadata field."
        footer={
          <div className="flex justify-end gap-2">
            <button
               onClick={() => setShowAddField(false)}
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
               onClick={handleAddField}
               className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
            >
              Add
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
                    Pro Features (AI & Audio)
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
                            sections <span className="opacity-50 text-[10px]">(chapters)</span>
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
                    Repository suggestions (config.ts)
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
                        <p className="text-xs text-muted-foreground italic">All suggested fields are already added.</p>
                    )}
                </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Field Name (Key)</label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
              placeholder="Ex: author, category, date..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Data Type</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
            >
              <option value="string">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean (Yes/No)</option>
              <option value="array">List (Tags)</option>
              <option value="date">Date</option>
              <option value="transcription">Transcription (Deepgram)</option>
              <option value="sections">Sections (Chapters)</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {setShowUploadModal(false); setPendingFile(null);}}
        title="Upload File"
        description="Select the destination directory for your file in storage."
        footer={
          <div className="flex justify-end gap-2">
            <button
               onClick={() => {setShowUploadModal(false); setPendingFile(null);}}
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
               onClick={() => pendingFile && performUpload(pendingFile)}
               disabled={isUploading || !pendingFile}
               className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload now"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {pendingFile && (
                <div className="text-sm border border-border p-2 rounded bg-muted/20">
                    <p className="font-semibold text-foreground mb-1">Selected file:</p>
                    <p className="font-mono text-muted-foreground">{pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)</p>
                </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Storage Destination</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-all ${uploadStorage === 'repo' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}>
                   <input 
                      type="radio" 
                      name="uploadStorage" 
                      className="mt-0.5 text-primary focus:ring-primary"
                      checked={uploadStorage === 'repo'} 
                      onChange={()=>setUploadStorage('repo')} 
                      disabled={isLimitedStorage} 
                   />
                   <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isLimitedStorage ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Repository Storage</span>
                      <span className="text-[10px] text-muted-foreground">High quality, custom filenames, folder support.</span>
                   </div>
                </label>
                
                <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-all ${uploadStorage === 'default' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}>
                   <input 
                      type="radio" 
                      name="uploadStorage" 
                      className="mt-0.5 text-primary focus:ring-primary"
                      checked={uploadStorage === 'default'} 
                      onChange={()=>setUploadStorage('default')} 
                   />
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Server Optimization</span>
                      <span className="text-[10px] text-muted-foreground">Auto-compression (WebP), random filenames, max 300KB.</span>
                   </div>
                </label>
              </div>
            </div>

            {uploadStorage === 'default' ? (
                <div className="text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded border border-blue-500/20">
                    <p className="font-semibold text-xs mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Optimized Storage Mode
                    </p>
                    <ul className="list-disc list-inside text-[10px] space-y-0.5 opacity-90">
                        <li>Images are automatically compressed and converted to WebP</li>
                        <li>Strict 300KB size limit for performance</li>
                        <li>Filenames and folders are managed automatically</li>
                    </ul>
                </div>
            ) : (
                <>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">File Name</label>
                      <input
                        type="text"
                        value={uploadFilename}
                        onChange={(e) => setUploadFilename(e.target.value)}
                        className="w-full bg-background border border-input rounded p-2 text-sm text-foreground font-mono focus:border-ring outline-none"
                        placeholder="e.g. my-beautiful-image"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Destination Directory</label>
                      <input
                        type="text"
                        value={uploadFolder}
                        onChange={(e) => setUploadFolder(e.target.value)}
                        className="w-full bg-background border border-input rounded p-2 text-sm text-foreground font-mono focus:border-ring outline-none"
                        placeholder="images, uploads, assets/blog..."
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        The file will be saved in: /public/{uploadFolder || '(root)'}/{uploadFilename || 'uuid'}.{pendingFile?.name.split('.').pop()}
                      </p>
                    </div>
                </>
            )}
        </div>
      </Modal>

      {/* Import Metadata Modal */}
       <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Choose a Template"
        description={`Select an existing post from the collection "${post.collection}" to use as a base.`}
        footer={
           <button
             onClick={() => setShowTemplateModal(false)}
             className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
           >
             Start from scratch (no template)
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
                                {p.metadata.title || "Untitled"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                    {p.filePath}
                                </span>
                                {p.status === 'synced' && <span className="w-2 h-2 rounded-full bg-green-500" title="Synced"/>}
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
        title="Import Metadata"
        description="Select an existing post to copy its metadata to the current post."
        footer={
           <button
             onClick={() => setShowImportModal(false)}
             className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
           >
             Cancel
           </button>
        }
      >
        <div className="space-y-4">
           {/* Search */}
           <input
             type="text"
             placeholder="Search posts..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-ring outline-none"
           />

           {/* List */}
           <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {loadingPosts ? (
               <div className="text-center py-4 text-muted-foreground">Loading posts...</div>
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
                     {post.metadata.title || "Untitled"}
                   </div>
                   <div className="text-xs text-muted-foreground font-mono truncate">
                     {post.filePath}
                   </div>
                 </button>
               ))
             )}
             {!loadingPosts && importablePosts.length > 0 && importablePosts.filter(p => p.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No posts found</div>
             )}
             {!loadingPosts && importablePosts.length === 0 && (
               <div className="text-center py-4 text-muted-foreground">No other posts available</div>
             )}
           </div>
        </div>
      </Modal>
      {/* Conflict Modal */}
      {showConflictError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-destructive/10 border border-destructive p-6 rounded-lg max-w-md shadow-lg">
            <h3 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ⚠️ Conflict Detected
            </h3>
            <p className="text-sm text-foreground mb-4">
              The file has been modified externally (probably on GitHub). Your changes cannot be saved automatically.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm font-medium"
              >
                Refresh and lose my changes
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
                Recommendation: Copy your current content locally before refreshing.
            </p>
          </div>
        </div>
      )}
      <Modal
        isOpen={showPermissionError}
        onClose={() => setShowPermissionError(false)}
        title="❌ Permission Error"
        description="Your application does not have write permissions to this repository."
        footer={
          <button
            onClick={() => setShowPermissionError(false)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            Understood
          </button>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Your GitHub OAuth App does not have permissions to make commits.</p>
          <div className="bg-muted p-3 rounded border border-border">
            <h4 className="font-semibold text-foreground mb-1">Solution:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Settings &gt; Developer Settings on GitHub</li>
              <li>Create a <strong>GitHub App</strong> (not OAuth App)</li>
              <li>Give it <code>Contents: Read & Write</code> permissions</li>
              <li>Update credentials in <code>.env.local</code></li>
            </ol>
          </div>
          <p>See <code>GITHUB_PERMISSIONS.md</code> for more details.</p>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        footer={
           <div className="flex justify-end gap-3 w-full">
                <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleDelete} 
                    disabled={deleting}
                    className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 flex items-center gap-2"
                >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
           </div>
        }
      >
        <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded border border-input">
                 {post.status === 'synced' ? (
                     <>
                        <input 
                            type="checkbox" 
                            id="deleteGithub" 
                            className="bg-background"
                            checked={deleteFromGitHub}
                            onChange={(e) => setDeleteFromGitHub(e.target.checked)}
                        />
                        <label htmlFor="deleteGithub" className="text-sm cursor-pointer select-none">
                            Also delete from GitHub
                        </label>
                     </>
                 ) : (
                     <p className="text-xs text-muted-foreground">Post not synced. Local delete only.</p>
                 )}
            </div>
            {deleteFromGitHub && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    This will delete the file <code className="bg-destructive/10 px-1 rounded">{post.filePath}</code> from the remote repository.
                </p>
            )}
            {!deleteFromGitHub && (
                <p className="text-xs text-muted-foreground">
                    The post will be permanently deleted from the local database.
                </p>
            )}
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
        title="AI Assistant (Gemini 2.0)"
        description={aiPreview ? "Validate the generated content before applying it to the post." : "Describe what type of post you want to generate. The AI will complete metadata and content automatically."}
        footer={
           <div className="flex justify-end gap-2">
             <button
               onClick={() => { setShowAiModal(false); setAiPreview(null); }}
               className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
               disabled={isGenerating}
             >
               {aiPreview ? "Discard" : "Cancel"}
             </button>
             
             {aiPreview ? (
                <button
                    onClick={applyAiGeneration}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded font-medium hover:bg-green-700 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Changes
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
                    Generating...
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Post
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
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Schema</label>
                    {!referencePost ? (
                        <button 
                            onClick={() => { setShowRefSelector(true); loadImportablePosts(); }}
                            className="w-full p-3 border border-dashed border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-between group"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                Select reference post...
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
                                    <p className="text-[10px] text-indigo-400 font-mono uppercase">Using this schema ({Object.keys(referencePost.metadata).length} fields)</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReferencePost(null)}
                                className="p-1 hover:text-destructive transition-colors"
                                title="Remove reference"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Instructions for AI</label>
                    <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Write a post about the advantages of using Next.js 15 in production..."
                    className="w-full h-32 bg-background border border-input rounded p-3 text-sm text-foreground focus:border-indigo-500 outline-none resize-none"
                    />
                </div>
             </>
           ) : (
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Metadata</h4>
                    <pre className="text-[11px] bg-muted/50 p-3 rounded border border-border overflow-x-auto font-mono">
                        {JSON.stringify(aiPreview.metadata, null, 2)}
                    </pre>
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Preview</h4>
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
                    Applying will overwrite current fields with these new values.
                    </p>
                </div>
             </div>
           )}
        </div>
      </Modal>

      {/* Reference Selector Modal */}
      <Modal
        isOpen={showRefSelector}
        onClose={() => setShowRefSelector(false)}
        title="Select Post as Schema"
        description={`Loading posts from collection '${post.collection}' to use their fields as reference.`}
        footer={
           <button
             onClick={() => setShowRefSelector(false)}
             className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
           >
             Cancel
           </button>
        }
      >
        <div className="space-y-4">
           <input
             type="text"
             placeholder="Filter by title or file..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-background border border-input rounded p-2 text-sm text-foreground focus:border-indigo-500 outline-none"
           />
           
           <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {loadingPosts ? (
               <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Searching posts in the repository...</p>
               </div>
             ) : (
               importablePosts
                  .filter(p => 
                    p.collection === post.collection && // Same collection
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
                      {p.metadata.title || "Untitled"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                            {Object.keys(p.metadata).length} fields
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
                    <p>No posts found in this collection.</p>
                </div>
              )}
           </div>
        </div>
      </Modal>

    </>
  );
}
