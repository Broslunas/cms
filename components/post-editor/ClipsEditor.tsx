"use client";

import { useState, useMemo } from "react";
import { Play, Type, Video, Plus, X, GripVertical, ExternalLink } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Clip {
    title: string;
    url: string;
    [key: string]: any;
}

interface ClipsEditorProps {
    fieldKey: string;
    value: Clip[];
    onChange: (val: Clip[]) => void;
    onDelete: () => void;
}

// Extract video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function SortableClipItem({
    id,
    index,
    clip,
    onUpdate,
    onRemove,
}: {
    id: string;
    index: number;
    clip: Clip;
    onUpdate: (index: number, field: string, value: string) => void;
    onRemove: (index: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    const [showPreview, setShowPreview] = useState(false);
    const videoId = getYouTubeVideoId(clip.url);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-card border border-border rounded-lg group hover:border-input transition-all ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
        >
            <div className="flex items-start gap-3 p-3">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-6 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors shrink-0"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Fields */}
                <div className="flex-1 space-y-2 min-w-0">
                    {/* Title */}
                    <div>
                        <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">
                            Title
                        </label>
                        <input
                            type="text"
                            value={clip.title || ""}
                            onChange={(e) => onUpdate(index, "title", e.target.value)}
                            placeholder="Clip title..."
                            className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1 block">
                            URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={clip.url || ""}
                                onChange={(e) => onUpdate(index, "url", e.target.value)}
                                placeholder="https://youtube.com/shorts/..."
                                className="flex-1 bg-background border border-input rounded px-3 py-1.5 text-sm text-foreground font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            {clip.url && (
                                <a
                                    href={clip.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground border border-input rounded hover:bg-muted transition-colors shrink-0"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            {videoId && (
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`px-2 py-1.5 border rounded transition-colors shrink-0 ${showPreview ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-input hover:text-foreground hover:bg-muted'}`}
                                    title={showPreview ? "Hide preview" : "Show preview"}
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* YouTube Preview */}
                    {showPreview && videoId && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border bg-black/5 flex justify-center">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={clip.title || "YouTube Video"}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full max-w-[320px] aspect-[9/16] rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <button
                    onClick={() => onRemove(index)}
                    className="mt-6 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Remove clip"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function ClipsEditor({ fieldKey, value, onChange, onDelete }: ClipsEditorProps) {
    if (!Array.isArray(value)) return null;

    const [isExpanded, setIsExpanded] = useState(false);
    const [isJsonMode, setIsJsonMode] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const itemIds = useMemo(
        () => value.map((_, i) => `clip-${i}`),
        [value]
    );

    const handleUpdate = (index: number, field: string, newValue: string) => {
        const updated = [...value];
        updated[index] = { ...updated[index], [field]: newValue };
        onChange(updated);
    };

    const handleAdd = () => {
        onChange([...value, { title: "", url: "" }]);
        setIsExpanded(true);
    };

    const handleRemove = (index: number) => {
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
    };

    const toggleJsonMode = () => {
        if (!isJsonMode) {
            setJsonText(JSON.stringify(value, null, 2));
            setIsJsonMode(true);
        } else {
            setIsJsonMode(false);
            setJsonError("");
        }
    };

    const handleJsonSave = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) throw new Error("Must be an array");
            onChange(parsed);
            setIsJsonMode(false);
            setJsonError("");
        } catch (e) {
            setJsonError("Invalid JSON: " + (e as Error).message);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (over && active.id !== over.id) {
            const oldIndex = itemIds.indexOf(active.id as string);
            const newIndex = itemIds.indexOf(over.id as string);
            onChange(arrayMove([...value], oldIndex, newIndex));
        }
    };

    return (
        <div key={fieldKey} className="w-full">
            <div className="bg-muted/30 border border-border rounded-lg overflow-hidden transition-all">
                {/* Header */}
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
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-rose-500" />
                            <div>
                                <p className="text-sm font-medium text-foreground">Clips Editor</p>
                                <p className="text-xs text-muted-foreground">{value.length} clip{value.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isExpanded && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleJsonMode(); }}
                                className={`text-xs px-2 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${isJsonMode ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'}`}
                            >
                                <Type className="w-3 h-3" />
                                {isJsonMode ? 'Cancel JSON' : 'Edit JSON'}
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-4 border-t border-border bg-card/30">
                        {isJsonMode ? (
                            <div className="space-y-3">
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    className="w-full h-64 bg-background text-foreground font-mono text-xs p-3 rounded border border-input focus:outline-none focus:border-ring resize-y"
                                    placeholder="Paste your JSON here..."
                                    spellCheck={false}
                                />
                                {jsonError && <p className="text-destructive text-xs">{jsonError}</p>}
                                <div className="flex justify-end gap-2">
                                    <button onClick={toggleJsonMode} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancel</button>
                                    <button onClick={handleJsonSave} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90">Save Changes</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                                            {value.length === 0 && (
                                                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                                                    <Video className="w-8 h-8 text-muted-foreground mb-3 opacity-20" />
                                                    <p className="text-sm text-muted-foreground">No clips added yet.</p>
                                                    <p className="text-xs text-muted-foreground/60 mt-1">Add clips with a title and YouTube URL.</p>
                                                </div>
                                            )}
                                            {value.map((clip, index) => (
                                                <SortableClipItem
                                                    key={itemIds[index]}
                                                    id={itemIds[index]}
                                                    index={index}
                                                    clip={clip}
                                                    onUpdate={handleUpdate}
                                                    onRemove={handleRemove}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                <button
                                    onClick={handleAdd}
                                    className="mt-4 w-full py-2 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-input hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add New Clip
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
