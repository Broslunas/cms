"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm transition-all duration-300">
      <div
        className={`premium-card bg-background border border-border rounded-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden ${className || 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="pr-8">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
              {description && (
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {footer && (
          <div className="px-8 py-5 bg-muted/40 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
