"use client";

import { useState } from "react";

export function JsonFieldEditor({ fieldKey, value, onChange, onDelete, isComplexArray = false }: { fieldKey: string, value: any, onChange: (val: any) => void, onDelete: () => void, isComplexArray?: boolean }) {
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
      setError("Invalid JSON: " + (e as Error).message);
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
                    <button onClick={handleCancel} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancel</button>
                    <button onClick={handleSave} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Save JSON</button>
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
                 ? `Complex field with ${value.length} items`
                 : "Complex object field"}
             </p>
             <button
                onClick={() => { setText(JSON.stringify(value, null, 2)); setIsEditing(true); }}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                title="Edit JSON"
             >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 Edit JSON
             </button>
        </div>
        <details className="mt-2">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
            View Current JSON
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 bg-muted/50 p-2 rounded border border-border">
            {JSON.stringify(value, null, 2)}
            </pre>
        </details>
    </div>
  )
}
