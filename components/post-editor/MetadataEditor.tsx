"use client";

import { MetadataField } from "./MetadataField";

interface MetadataEditorProps {
    metadata: any;
    content: string; // Added to support AI generation based on content
    onUpdate: (key: string, value: any) => void;
    onDeleteField: (key: string) => void;
    onShowImportModal: () => void;
    onShowAiModal: () => void;
    onShowAddField: () => void;
    onShowDeleteConfirm: () => void;
    isNew: boolean;
    triggerUpload: (target: { type: 'content' | 'metadata', key?: string, index?: number, subKey?: string }) => void;
    isUploading: boolean;
    uploadTarget: { type: 'content' | 'metadata', key?: string, index?: number, subKey?: string };
    suggestedFields: Record<string, any>;
    repoId: string;
}

export function MetadataEditor({
    metadata,
    content,
    onUpdate,
    onDeleteField,
    onShowImportModal,
    onShowAiModal,
    onShowAddField,
    onShowDeleteConfirm,
    isNew,
    triggerUpload,
    isUploading,
    uploadTarget,
    suggestedFields,
    repoId
}: MetadataEditorProps) {
  return (
        <div className="bg-card rounded-lg p-6 border border-border space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Metadata</h2>
            <div className="flex gap-2">
              <button
                onClick={onShowImportModal}
                className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded border border-border transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
                Import
              </button>
              <button
                onClick={onShowAiModal}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </button>
              <button
                onClick={onShowAddField}
                className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded transition-colors flex items-center gap-2"
              >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Field
              </button>
              {!isNew && (
                <button
                  onClick={onShowDeleteConfirm}
                  className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(metadata).map(([key, value]) => (
                <MetadataField 
                    key={key}
                    fieldKey={key}
                    value={value}
                    content={content} // Pass content down
                    metadata={metadata} // Pass metadata down
                    onUpdate={onUpdate}
                    onDelete={onDeleteField}
                    triggerUpload={triggerUpload}
                    isUploading={isUploading}
                    uploadTarget={uploadTarget}
                    suggestedFields={suggestedFields}
                    repoId={repoId}
                />
            ))}
          </div>
          {Object.keys(metadata).length === 0 && (
            <p className="text-muted-foreground text-sm">No metadata fields</p>
          )}
        </div>
  );
}
