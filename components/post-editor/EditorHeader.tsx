"use client";

import { Link } from "next-view-transitions";

interface EditorHeaderProps {
    repoId: string;
    isNew: boolean;
    saving: boolean;
    committing: boolean;
    onSave: (commit: boolean) => void;
    onShowDiff: () => void;
    onShowBlame: () => void;
    onShowHistory: () => void;
    onDelete: () => void;
}

export function EditorHeader({
    repoId,
    isNew,
    saving,
    committing,
    onSave,
    onShowDiff,
    onShowBlame,
    onShowHistory,
    onDelete
}: EditorHeaderProps) {
  return (
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard/repos?repo=${encodeURIComponent(repoId)}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Posts
          </Link>

          <div className="flex items-center gap-3">
             <div className="w-px h-6 bg-border mx-1" />

            <button
              onClick={() => onSave(false)}
              disabled={saving || committing}
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={() => onSave(true)}
              disabled={saving || committing}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {committing ? "Commiteando..." : "Guardar y Commitear"}
            </button>

            {!isNew && (
              <button
                 onClick={onShowDiff}
                 className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                 title="Ver Cambios (Diff)"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="hidden sm:inline text-xs font-medium">Cambios</span>
              </button>
            )}

            {!isNew && (
                <button
                    onClick={onShowBlame}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                    title="Git Blame"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="hidden sm:inline text-xs font-medium">Blame</span>
                </button>
            )}

            {!isNew && (
              <button
                onClick={onShowHistory}
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                title="Historial de Versiones"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {!isNew && (
              <div className="hidden md:block w-px h-6 bg-border mx-1" />
            )}

            {!isNew && (
              <button
                onClick={onDelete}
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
  );
}
