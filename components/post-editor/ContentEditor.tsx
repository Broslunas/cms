"use client";

import { RefObject, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Bold, Italic, Heading1, List, Quote, Code, Link as LinkIcon, Image as ImageIcon, Wand2, Sparkles } from "lucide-react";

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
          toast.warning("Select the text you want to process first");
          return;
      }

      setAiProcessing(true);
      const toastId = toast.loading("Processing with AI...");

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

          if (!res.ok) throw new Error("Error in request");
          
          const data = await res.json();
          if (data.result) {
              const newText = textarea.value.substring(0, start) + data.result + textarea.value.substring(end);
              onChange(newText);
              toast.success("Text updated", { id: toastId });
          } else {
              throw new Error("No result received");
          }

      } catch (error: any) {
          console.error(error);
          toast.error("Error processing", { id: toastId });
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
        <div className="bg-card rounded-lg shadow-sm border border-border flex flex-col min-h-[800px]">
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
                <div className="hidden md:block">
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
              </div>

              {/* Formatting Toolbar */}
              {(activeTab === "edit" || activeTab === "split") && (
                <div className="flex items-center">
                  {/* Formatting Tools */}
                  <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
                    <ToolbarButton 
                      label="Bold (Ctrl+B)" 
                      icon={<Bold className="w-4 h-4" />} 
                      onClick={() => insertText("**bold** ")} 
                    />
                    <ToolbarButton 
                      label="Italic (Ctrl+I)" 
                      icon={<Italic className="w-4 h-4" />} 
                      onClick={() => insertText("_italic_ ")} 
                    />
                    <ToolbarButton 
                      label="H1" 
                      icon={<Heading1 className="w-4 h-4" />} 
                      onClick={() => insertText("\n# Title\n")} 
                    />
                    <ToolbarButton 
                      label="List" 
                      icon={<List className="w-4 h-4" />} 
                      onClick={() => insertText("\n- Item\n")} 
                    />
                    <ToolbarButton 
                      label="Quote" 
                      icon={<Quote className="w-4 h-4" />} 
                      onClick={() => insertText("\n> Quote\n")} 
                    />
                    <ToolbarButton 
                      label="Code Block" 
                      icon={<Code className="w-4 h-4" />} 
                      onClick={() => insertText("\n```\ncode\n```\n")} 
                    />
                    <ToolbarButton 
                      label="Link" 
                      icon={<LinkIcon className="w-4 h-4" />} 
                      onClick={() => insertText("[Link Text](url)")} 
                    />
                    <ToolbarButton 
                      label="Upload Image" 
                      icon={isUploading && uploadTarget.type === 'content' ? <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" /> : <ImageIcon className="w-4 h-4" />} 
                      onClick={() => triggerUpload({ type: 'content' })}
                      disabled={isUploading}
                    />
                  </div>

                  {/* AI Tools */}
                  <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
                      <ToolbarButton 
                        label="Fix Grammar" 
                        icon={<Wand2 className="w-4 h-4 text-indigo-500" />} 
                        onClick={() => handleAiAction("grammar")} 
                        disabled={aiProcessing}
                      />
                      <div className="dropdown dropdown-end group relative">
                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="AI Tone" disabled={aiProcessing}>
                                 <Sparkles className="w-4 h-4 text-amber-500" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg p-1 hidden group-hover:block z-20 w-32">
                                 <button onClick={() => handleAiAction("tone", "formal")} className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded">Formal</button>
                                 <button onClick={() => handleAiAction("tone", "shorter")} className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded">Short</button>
                                 <button onClick={() => handleAiAction("tone", "funnier")} className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded">Fun</button>
                            </div>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {activeTab === "edit" && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full min-h-[700px] flex-1 p-4 pb-12 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"
                  placeholder="Write your content in Markdown..."
                />
                
                {/* Drag Overlay */}
                <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-primary font-medium bg-background/80 px-3 py-1 rounded shadow-sm">
                        Drag and drop an image here
                    </p>
                </div>
              </div>
            )}

            {activeTab === "preview" && (
              <div className="flex-1 p-8 pb-12 bg-background overflow-y-auto">
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
                    {content || "*No content to preview*"}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === "split" && (
              <div className="flex-1 grid grid-cols-2 divide-x divide-border overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full min-h-[700px] p-6 pb-12 bg-background text-foreground placeholder-muted-foreground outline-none font-mono text-sm leading-relaxed resize-none whitespace-pre-wrap break-words overflow-y-auto"
                  placeholder="Write here..."
                />
                <div className="min-h-[700px] p-6 pb-12 bg-background overflow-y-auto">
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
                      {content || "*Preview*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer Status Bar */}
          <div className="border-t border-border bg-card p-2 flex justify-between items-center text-xs text-muted-foreground px-4 rounded-b-lg">
             <div className="flex gap-4">
                 <span>{content.length} characters</span>
                 <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                 <span>{content.split('\n').length} lines</span>
             </div>
             <div>
                Markdown Supported
             </div>
          </div>
          </div>
        </div>
  );
}
