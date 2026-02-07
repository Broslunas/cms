"use client";

import { RefObject, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

// Función para convertir rutas relativas a URLs de GitHub raw
const convertToGitHubRawUrl = (src: string | Blob | undefined, repoId?: string): string | Blob | undefined => {
  // Si no hay src o es un Blob, devolverlo tal cual
  if (!src || src instanceof Blob) {
    return src;
  }
  
  // Si es una cadena de texto (string)
  if (typeof src === 'string') {
    // Si ya es una URL completa, no hacer nada
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // Construir la URL base dinámicamente desde repoId
    let baseUrl = 'https://raw.githubusercontent.com/Broslunas/portfolio-old/refs/heads/main';
    if (repoId) {
      // repoId viene en formato "owner/repo"
      baseUrl = `https://raw.githubusercontent.com/${repoId}/refs/heads/main`;
    }
    
    // Si es una ruta relativa que empieza con /
    if (src.startsWith('/')) {
      return `${baseUrl}${src}`;
    }
    
    // Si es una ruta relativa sin / al inicio
    if (!src.startsWith('./') && !src.startsWith('../')) {
      return `${baseUrl}/${src}`;
    }
  }
  
  return src;
};

interface ContentEditorProps {
    content: string;
    onChange: (val: string) => void;
    activeTab: "edit" | "preview" | "split";
    onTabChange: (tab: "edit" | "preview" | "split") => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    insertText: (before: string, after?: string) => void;
    triggerUpload: (target: { type: 'content' }) => void;
    isUploading: boolean;
    uploadTarget: { type: 'content' | 'metadata', key?: string };
    repoId: string;
}

export function ContentEditor({
    content,
    onChange,
    activeTab,
    onTabChange,
    textareaRef,
    insertText,
    triggerUpload,
    isUploading,
    uploadTarget,
    repoId
}: ContentEditorProps) {

  const [aiProcessing, setAiProcessing] = useState(false);

  const handleAiAction = async (type: string, option?: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);

      if (!selectedText.trim()) {
          toast.warning("Selecciona primero el texto que quieres procesar");
          return;
      }

      setAiProcessing(true);
      const toastId = toast.loading("Procesando con IA...");

      try {
          const res = await fetch("/api/ai/process", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  type,
                  option,
                  text: selectedText
              })
          });

          if (!res.ok) throw new Error("Error en la petición");
          
          const data = await res.json();
          if (data.result) {
              const newText = textarea.value.substring(0, start) + data.result + textarea.value.substring(end);
              onChange(newText);
              toast.success("Texto actualizado", { id: toastId });
          } else {
              throw new Error("No se recibió resultado");
          }

      } catch (error: any) {
          console.error(error);
          toast.error("Error al procesar", { id: toastId });
      } finally {
          setAiProcessing(false);
      }
  };

  const ToolbarButton = ({  
    icon, 
    label, 
    onClick,
    disabled = false
  }: { 
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void,
    disabled?: boolean
  }) => (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  return (
        <div className="bg-card rounded-lg shadow-sm border border-border flex flex-col min-h-[600px]">
          {/* Tabs & Toolbar */}
          <div className="border-b border-border bg-card">
            <div className="flex items-center justify-between px-4 py-2">
              {/* Tabs */}
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => onTabChange("edit")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "edit"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => onTabChange("preview")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "preview"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => onTabChange("split")}
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
                    label="Subir Imagen"
                    onClick={() => triggerUpload({ type: 'content' })}
                    icon={
                      isUploading && uploadTarget.type === 'content' ? (
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )
                    }
                  />

                  {/* AI Tools Separator */}
                  <div className="w-px h-4 bg-border mx-1" />
                  
                  {/* Grammar Check */}
                  <ToolbarButton 
                    label="Corregir Gramática (Selección)" 
                    onClick={() => handleAiAction("grammar")}
                    disabled={aiProcessing}
                    icon={
                        aiProcessing ? <div className="animate-spin w-3 h-3 border border-current rounded-full border-t-transparent" /> :
                        <span className="text-xs font-bold font-serif">Aa</span>
                    }
                  />

                  {/* Tone Tools - Dropdown like approach via buttons for simplicity or native select? Let's use button group */}
                  <div className="flex items-center bg-muted/30 rounded px-1 ml-1" title="Reescribir tono">
                        <button onClick={() => handleAiAction("tone", "formal")} className="p-1 text-[10px] hover:text-primary transition-colors disabled:opacity-50" disabled={aiProcessing}>Formal</button>
                        <span className="text-border mx-1">|</span>
                        <button onClick={() => handleAiAction("tone", "shorter")} className="p-1 text-[10px] hover:text-primary transition-colors disabled:opacity-50" disabled={aiProcessing}>Corto</button>
                        <span className="text-border mx-1">|</span>
                        <button onClick={() => handleAiAction("tone", "funnier")} className="p-1 text-[10px] hover:text-primary transition-colors disabled:opacity-50" disabled={aiProcessing}>Divertido</button>
                  </div>

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
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 w-full p-8 bg-background text-foreground placeholder-muted-foreground outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Empieza a escribir..."
                />
              </div>
            )}

            {activeTab === "preview" && (
              <div className="flex-1 p-8 bg-background overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      img: ({node, src, alt, ...props}) => {
                        const imageSrc = convertToGitHubRawUrl(src, repoId);
                        return (
                          <img 
                            src={typeof imageSrc === 'string' ? imageSrc : undefined} 
                            alt={alt} 
                            {...props}
                          />
                        );
                      }
                    }}
                  >
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
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-full p-6 bg-background text-foreground placeholder-muted-foreground outline-none font-mono text-sm leading-relaxed resize-none"
                  placeholder="Escribe aquí..."
                />
                <div className="h-full p-6 bg-background overflow-y-auto">
                   <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({node, src, alt, ...props}) => {
                          const imageSrc = convertToGitHubRawUrl(src, repoId);
                          return (
                            <img 
                              src={typeof imageSrc === 'string' ? imageSrc : undefined} 
                              alt={alt} 
                              {...props}
                            />
                          );
                        }
                      }}
                    >
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
  );
}
