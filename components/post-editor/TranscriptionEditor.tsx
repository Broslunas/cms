"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Music, Scissors, Type, Wand2 } from "lucide-react";

export function TranscriptionEditor({ 
    fieldKey, 
    value, 
    onChange, 
    onDelete, 
    metadata 
}: { 
    fieldKey: string, 
    value: any[], 
    onChange: (val: any[]) => void, 
    onDelete: () => void,
    metadata?: any
}) {
  // Verificación de seguridad
  if (!Array.isArray(value)) return null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  
  // Deepgram integration state
  const [audioUrl, setAudioUrl] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showDeepgramPanel, setShowDeepgramPanel] = useState(false);

  // Auto-detect audio URL from metadata
  useEffect(() => {
    if (metadata) {
        const possibleKeys = ['audio', 'audio_url', 'podcast_url', 'mp3', 'url', 'audioUrl'];
        for (const k of possibleKeys) {
            if (metadata[k] && typeof metadata[k] === 'string' && (metadata[k].startsWith('http') || metadata[k].startsWith('/'))) {
                setAudioUrl(metadata[k]);
                break;
            }
        }
    }
  }, [metadata]);

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
          setShowDeepgramPanel(false);
      } else {
          setIsJsonMode(false);
          setJsonError("");
      }
  };

  const toggleDeepgramPanel = () => {
        if (!showDeepgramPanel) {
            setShowDeepgramPanel(true);
            setIsJsonMode(false);
        } else {
            setShowDeepgramPanel(false);
        }
  };

  const handleTranscribe = async () => {
    if (!audioUrl) {
        toast.error("Please enter a valid audio URL.");
        return;
    }

    setIsTranscribing(true);
    const toastId = toast.loading("Transcribing audio with Deepgram...");

    try {
        const res = await fetch("/api/ai/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: audioUrl })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Transcription error");
        }

        const data = await res.json();
        
        if (value.length > 0) {
            // Confirm overwrite if there's already content
            if (confirm("Current transcription will be replaced. Continue?")) {
                onChange(data);
                toast.success("Transcription completed", { id: toastId });
                setShowDeepgramPanel(false);
            }
        } else {
            onChange(data);
            toast.success("Transcription completed", { id: toastId });
            setShowDeepgramPanel(false);
        }
    } catch (error: any) {
        console.error("Transcription error:", error);
        toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
        setIsTranscribing(false);
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

          throw new Error("Could not detect valid JSON or Text format ([00:00] ...)");
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
                    <p className="text-sm font-medium text-foreground">Transcription Editor</p>
                    <p className="text-xs text-muted-foreground">{value.length} segments</p>
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                 {isExpanded && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleDeepgramPanel(); }}
                            className={`text-xs px-2 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${showDeepgramPanel ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'}`}
                        >
                            <Wand2 className="w-3 h-3" />
                            {showDeepgramPanel ? 'Close Deepgram' : 'Auto-Transcribe (Deepgram)'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleJsonMode(); }}
                            className={`text-xs px-2 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${isJsonMode ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'}`}
                        >
                            <Type className="w-3 h-3" />
                            {isJsonMode ? 'Cancel Import' : 'Import JSON/Text'}
                        </button>
                    </>
                 )}
            </div>
        </div>
        
        {/* Content Body */}
        {isExpanded && (
            <div className="p-4 border-t border-border bg-card/30">
                {showDeepgramPanel && (
                    <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-indigo-500 mb-1">
                            <Music className="w-4 h-4" />
                            <h4 className="text-sm font-semibold uppercase tracking-wider">Generate with AI</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Enter the URL of an audio file (MP3, WAV, etc.) to automatically generate the full transcription.</p>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={audioUrl}
                                onChange={(e) => setAudioUrl(e.target.value)}
                                placeholder="https://example.com/audio.mp3"
                                className="flex-1 bg-background border border-input rounded px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button 
                                onClick={handleTranscribe}
                                disabled={isTranscribing || !audioUrl}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                {isTranscribing ? 'Processing...' : 'Transcribe'}
                            </button>
                        </div>
                        {audioUrl && !audioUrl.startsWith('http') && !audioUrl.startsWith('/') && (
                            <p className="text-[10px] text-destructive italic">URL must start with http:// or https://</p>
                        )}
                    </div>
                )}

                {isJsonMode ? (
                    <div className="space-y-3">
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            className="w-full h-64 bg-background text-foreground font-mono text-xs p-3 rounded border border-input focus:outline-none focus:border-ring resize-y"
                            placeholder="Paste your JSON or Text formatted [00:00] Speaker: ... here..."
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-destructive text-xs">{jsonError}</p>}
                        <div className="flex justify-end gap-2">
                            <button onClick={toggleJsonMode} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancel</button>
                            <button onClick={handleImport} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Process and Import</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                        {value.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                                <Type className="w-8 h-8 text-muted-foreground mb-3 opacity-20" />
                                <p className="text-sm text-muted-foreground">No transcription segments.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Add manually or use Deepgram.</p>
                            </div>
                        )}
                        {value.map((item, index) => (
                            <div key={index} className="flex gap-3 bg-card border border-border p-3 rounded-md group hover:border-input transition-colors">
                            <div className="w-24 shrink-0">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Time</label>
                                <div className="relative">
                                    <input
                                    type="text"
                                    value={item.time || ""}
                                    onChange={(e) => handleUpdate(index, "time", e.target.value)}
                                    placeholder="00:00"
                                    className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                    <Scissors className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">Text</label>
                                <textarea
                                value={item.text || ""}
                                onChange={(e) => handleUpdate(index, "text", e.target.value)}
                                placeholder="Enter transcription..."
                                rows={2}
                                className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[60px]"
                                />
                            </div>
                            <button
                                onClick={() => handleRemove(index)}
                                className="self-start mt-6 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete segment"
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
                        Add New Segment
                        </button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
