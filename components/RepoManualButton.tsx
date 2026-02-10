
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { BookOpen, Loader2, ChevronUp, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface RepoManualButtonProps {
  repoId: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary" | "default";
  size?: "default" | "sm" | "icon";
  children?: React.ReactNode;
}

/**
 * Converts a heading text into a URL-friendly slug.
 * Mirrors how GitHub generates heading IDs: lowercase, spaces to hyphens,
 * strip non-alphanumeric (except hyphens), collapse multiple hyphens.
 * Also strips leading emoji characters.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "") // strip emoji
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, "-")       // spaces → hyphens
    .replace(/-+/g, "-")        // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");   // trim leading/trailing hyphens
}

export default function RepoManualButton({ repoId, className, variant = "outline", size = "sm", children }: RepoManualButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualContent, setManualContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchManual = async () => {
    if (manualContent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/manual?repoId=${encodeURIComponent(repoId)}`);
      if (res.ok) {
        const data = await res.json();
        setManualContent(data.content);
      } else {
        setError(
          res.status === 404
            ? "No 'broslunas-cms.md' manual found in this repository."
            : "Failed to load manual."
        );
      }
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchManual();
  };

  /** Scroll an anchor into view inside the modal scroll container */
  const scrollToId = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Try exact match first
    let el = container.querySelector(`#${CSS.escape(id)}`);

    // Fallback: normalize the ID (strip leading/trailing hyphens, collapse)
    // This handles the case where the markdown link is `#-tipos-de-datos`
    // but our heading ID is `tipos-de-datos` (after emoji stripping).
    if (!el) {
      const normalizedId = id.replace(/^-+|-+$/g, "").replace(/-+/g, "-");
      el = container.querySelector(`#${CSS.escape(normalizedId)}`);
    }

    // Fallback: try a partial match (find heading whose ID contains this string)
    if (!el) {
      const allHeadings = container.querySelectorAll("[id]");
      const cleanId = id.replace(/^-+|-+$/g, "");
      for (const heading of allHeadings) {
        if (heading.id.includes(cleanId) || cleanId.includes(heading.id)) {
          el = heading;
          break;
        }
      }
    }

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setShowToc(false);
  }, []);

  /** Extract TOC entries from the raw markdown */
  const tocEntries = useMemo(() => {
    if (!manualContent) return [];
    const lines = manualContent.split("\n");
    const entries: { level: number; text: string; id: string }[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2]
          .replace(/\*\*([^*]+)\*\*/g, "$1")   // strip bold
          .replace(/\*([^*]+)\*/g, "$1")       // strip italic
          .replace(/`([^`]+)`/g, "$1");        // strip code
        entries.push({ level, text: rawText, id: slugify(rawText) });
      }
    }
    return entries;
  }, [manualContent]);

  /** Custom react-markdown component overrides */
  const markdownComponents: Components = useMemo(() => ({
    /* ── Headings with anchor IDs ───────────────────────── */
    h1: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h1 id={id} className="manual-heading manual-h1" {...props}>
          <a href={`#${id}`} className="manual-anchor" aria-hidden="true">#</a>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h2 id={id} className="manual-heading manual-h2" {...props}>
          <a href={`#${id}`} className="manual-anchor" aria-hidden="true">#</a>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h3 id={id} className="manual-heading manual-h3" {...props}>
          <a href={`#${id}`} className="manual-anchor" aria-hidden="true">#</a>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h4 id={id} className="manual-heading manual-h4" {...props}>
          <a href={`#${id}`} className="manual-anchor" aria-hidden="true">#</a>
          {children}
        </h4>
      );
    },

    /* ── Tables ──────────────────────────────────────────── */
    table: ({ children, ...props }) => (
      <div className="manual-table-wrapper">
        <table className="manual-table" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="manual-thead" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }) => (
      <th className="manual-th" {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td className="manual-td" {...props}>{children}</td>
    ),
    tr: ({ children, ...props }) => (
      <tr className="manual-tr" {...props}>{children}</tr>
    ),

    /* ── Links (internal anchors + external) ─────────────── */
    a: ({ href, children, ...props }) => {
      if (href?.startsWith("#")) {
        return (
          <a
            href={href}
            className="manual-link manual-link-internal"
            onClick={(e) => {
              e.preventDefault();
              const targetId = href.slice(1);
              scrollToId(targetId);
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a
          href={href}
          className="manual-link"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },

    /* ── Blockquotes ─────────────────────────────────────── */
    blockquote: ({ children, ...props }) => (
      <blockquote className="manual-blockquote" {...props}>{children}</blockquote>
    ),

    /* ── Code ────────────────────────────────────────────── */
    code: ({ children, className: codeClassName, ...props }) => {
      const isBlock = codeClassName?.startsWith("language-");
      if (isBlock) {
        return (
          <code className={`manual-code-block ${codeClassName}`} {...props}>{children}</code>
        );
      }
      return <code className="manual-code-inline" {...props}>{children}</code>;
    },

    /* ── Horizontal Rule ─────────────────────────────────── */
    hr: () => <hr className="manual-hr" />,

    /* ── Lists ───────────────────────────────────────────── */
    ul: ({ children, ...props }) => <ul className="manual-ul" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="manual-ol" {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li className="manual-li" {...props}>{children}</li>,

  }), [scrollToId]);

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleOpen} title="Open Repository Manual">
        {children || (
          <>
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manual</span>
          </>
        )}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setShowToc(false); }}
        title="Repository Manual"
        className="max-w-5xl max-h-[92vh] flex flex-col"
      >
        {/* Floating TOC + Back to Top buttons */}
        {manualContent && !loading && !error && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setShowToc(!showToc)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors border border-primary/15"
            >
              <List className="h-3.5 w-3.5" />
              Table of Contents
            </button>
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-3 py-1.5 rounded-lg transition-colors border border-border/50"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Top
            </button>
          </div>
        )}

        {/* Collapsible TOC */}
        {showToc && tocEntries.length > 0 && (
          <nav className="manual-toc mb-4">
            <ul className="space-y-0.5">
              {tocEntries.map((entry, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => scrollToId(entry.id)}
                    className="manual-toc-item"
                    style={{ paddingLeft: `${(entry.level - 1) * 16 + 12}px` }}
                  >
                    {entry.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pr-3 custom-scrollbar min-h-[200px] max-h-[72vh] scroll-smooth"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading manual...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/30">
              <div className="p-4 bg-muted/50 rounded-full">
                <BookOpen className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground">{error}</p>
              <p className="text-xs max-w-xs text-center leading-relaxed opacity-80">
                Add a <code className="manual-code-inline">broslunas-cms.md</code> file to the root of your repository (<code className="manual-code-inline">{repoId}</code>) to enable this feature.
              </p>
            </div>
          ) : (
            <div className="manual-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {manualContent || ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

/** Recursively extract text from React children (for heading slug generation). */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((children as any).props.children);
  }
  return "";
}
