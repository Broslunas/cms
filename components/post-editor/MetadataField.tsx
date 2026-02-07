"use client";

import { JsonFieldEditor } from "./JsonFieldEditor";
import { TranscriptionEditor } from "./TranscriptionEditor";
import { SectionsEditor } from "./SectionsEditor";
import { SocialLinksEditor } from "../SocialLinksEditor";
import { useState } from "react";
import { toast } from "sonner";

// Función para convertir rutas relativas a URLs de GitHub raw
const convertToGitHubRawUrl = (src: string, repoId?: string): string => {
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
  
  return src;
};

interface MetadataFieldProps {
    fieldKey: string;
    value: any;
    content: string; // Passed from parent
    metadata: any; // Added
    onUpdate: (key: string, value: any) => void;
    onDelete: (key: string) => void;
    triggerUpload: (target: { type: 'content' | 'metadata', key?: string }) => void;
    isUploading: boolean;
    uploadTarget: { type: 'content' | 'metadata', key?: string };
    suggestedFields: Record<string, any>;
    repoId: string;
}

export function MetadataField({
    fieldKey,
    value,
    content,
    metadata, // Added
    onUpdate,
    onDelete,
    triggerUpload,
    isUploading,
    uploadTarget,
    suggestedFields,
    repoId
}: MetadataFieldProps) {
    const key = fieldKey;
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAutoSeo = async () => {
        if (!content || content.length < 50) {
            toast.warning("El contenido es muy corto para generar SEO.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("Generando SEO...");

        try {
            const res = await fetch("/api/ai/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "seo",
                    context: content
                })
            });

            if (!res.ok) throw new Error("Error en la respuesta");
            const data = await res.json();
            
            if (data.title) onUpdate('title', data.title);
            if (data.description) onUpdate('description', data.description);

            toast.success("SEO Generado", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Error al generar SEO", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutoTags = async () => {
        if (!content || content.length < 50) {
            toast.warning("El contenido es muy corto para generar tags.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("Generando tags...");

        try {
            const res = await fetch("/api/ai/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "tags",
                    context: content
                })
            });

            if (!res.ok) throw new Error("Error en la respuesta");
            const data = await res.json();
            
            if (data.tags && Array.isArray(data.tags)) {
                onUpdate('tags', data.tags);
                toast.success("Tags generados", { id: toastId });
            } else {
                throw new Error("Formato inválido");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al generar tags", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Special Components ---
    if (key === 'social' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
            <div key={key}>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                    {key} <span className="text-xs text-muted-foreground font-normal">(Redes Sociales)</span>
                    </label>
                    <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <SocialLinksEditor 
                    value={value}
                    onChange={(val) => onUpdate(key, val)}
                    allowedNetworks={
                         Object.keys(suggestedFields).length > 0 
                            ? (suggestedFields['social']?.nestedFields ? Object.keys(suggestedFields['social'].nestedFields) : [])
                            : undefined
                    }
                />
            </div>
        );
    }

    if (Array.isArray(value)) {
      const isTranscription = (value.length > 0 && typeof value[0] === "object" && value[0] !== null && 'time' in value[0] && 'text' in value[0]) || 
                              (['transcription', 'transcript', 'transcripcion'].includes(key.toLowerCase()));
      
      if (isTranscription) {
          return (
             <div key={key}>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">{key}</label>
                    <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <TranscriptionEditor fieldKey={key} value={value} onChange={(val) => onUpdate(key, val)} onDelete={() => onDelete(key)} metadata={metadata} />
             </div>
          )
      }

      const isSections = (value.length > 0 && 
                         value.every(item => typeof item === 'object' && item !== null && 'time' in item && 'title' in item)) ||
                         (['sections', 'capitulos', 'chapters', 'secciones'].includes(key.toLowerCase()));
      
      if (isSections) {
        return (
           <div key={key}>
              <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground capitalize">{key}</label>
                  <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>
              <SectionsEditor fieldKey={key} value={value} onChange={(val) => onUpdate(key, val)} onDelete={() => onDelete(key)} metadata={metadata} />
           </div>
        )
      }

      const isComplexArray = value.length > 0 && typeof value[0] === 'object' && value[0] !== null;

      if (isComplexArray) {
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground capitalize">{key}</label>
              <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <JsonFieldEditor fieldKey={key} value={value} onChange={(val: any) => onUpdate(key, val)} onDelete={() => onDelete(key)} isComplexArray={true} />
          </div>
        );
      }
    }

    // --- Simple Arrays (Tags) ---
    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
              {key} <span className="text-muted-foreground text-xs font-normal">(separados por coma)</span>
              {(key === 'tags' || key === 'categories') && (
                  <button 
                    onClick={handleAutoTags} 
                    disabled={isGenerating}
                    className="text-xs flex items-center gap-1 bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <div className="animate-spin w-3 h-3 border border-current rounded-full border-t-transparent" /> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  </button>
              )}
            </label>
            <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <input
            type="text"
            value={value.join(", ")}
            onChange={(e) => onUpdate(key, e.target.value.split(",").map((t: string) => t.trim()))}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      );
    }

    // --- Strings (Title, Desc, etc) ---
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      
      // Date Check
      const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(trimmedValue);
      if (isDate) {
         try {
            const dateObj = new Date(trimmedValue);
            const localISOTime = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">{key} <span className="text-muted-foreground text-xs font-normal">(Fecha)</span></label>
                    <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <input type="datetime-local" value={localISOTime} onChange={(e) => { const newDate = new Date(e.target.value); onUpdate(key, newDate.toISOString()); }} className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm [color-scheme:dark]" />
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{trimmedValue}</p>
                </div>
            );
         } catch (e) {}
      }

      const isImage = trimmedValue.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif)(\?.*)?$/i) || ((trimmedValue.startsWith("http") || trimmedValue.startsWith("/")) && (key.toLowerCase().includes("image") || key.toLowerCase().includes("img") || key.toLowerCase().includes("cover") || key.toLowerCase().includes("avatar") || key.toLowerCase().includes("thumbnail") || key.toLowerCase().includes("banner") || key.toLowerCase().includes("poster") || key.toLowerCase().includes("logo") || key.toLowerCase().includes("icon") || key.toLowerCase().includes("bg")));

      return (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
                {key}
                {(key === 'title' || key === 'description') && (
                    <button 
                        onClick={handleAutoSeo} 
                        disabled={isGenerating}
                        className="text-xs flex items-center gap-1 bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? <div className="animate-spin w-3 h-3 border border-current rounded-full border-t-transparent" /> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    </button>
                )}
            </label>
            <button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={`Eliminar campo ${key}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={value} onChange={(e) => onUpdate(key, e.target.value)} className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              <button type="button" onClick={() => triggerUpload({ type: 'metadata', key })} className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-border" title="Subir imagen">
                {isUploading && uploadTarget.key === key ? <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>} <span className="hidden sm:inline">Subir</span>
              </button>
            </div>
            {isImage && trimmedValue.length > 0 && (
              <div className="relative group w-fit">
                <div className="rounded-lg overflow-hidden border border-border bg-muted/50 max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={trimmedValue} src={convertToGitHubRawUrl(trimmedValue, repoId)} alt={`Preview of ${key}`} className="max-h-48 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"><span className="text-xs text-white bg-black/70 px-2 py-1 rounded">Vista Previa</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Numbers & Booleans & Objects (kept standard)
    if (typeof value === "number") {
        return ( <div key={key}><div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-foreground capitalize">{key}</label><button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div><input type="number" value={value} onChange={(e) => onUpdate(key, parseFloat(e.target.value))} className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" /></div> );
    }
    if (typeof value === "boolean") {
        return ( <div key={key}><div className="flex items-center justify-between"><label className="flex items-center gap-2"><input type="checkbox" checked={value} onChange={(e) => onUpdate(key, e.target.checked)} className="w-4 h-4 bg-background border-input rounded" /><span className="text-sm font-medium text-foreground capitalize">{key}</span></label><button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></div> );
    }
    if (typeof value === "object" && value !== null) {
        return ( <div key={key}><div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-foreground capitalize">{key}</label><button onClick={() => onDelete(key)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div><JsonFieldEditor fieldKey={key} value={value} onChange={(val: any) => onUpdate(key, val)} onDelete={() => onDelete(key)} /></div> );
    }
    return null;
}
