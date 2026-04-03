"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";

interface ImagePreviewPortalProps {
  src: string | null;
  onClose: () => void;
}

/**
 * Renders a full-screen image preview via a React Portal.
 * Because it's appended directly to document.body, it's completely
 * immune to any parent overflow:hidden, transform, or z-index restrictions.
 */
export function ImagePreviewPortal({ src, onClose }: ImagePreviewPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!mounted || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-8"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20"
      >
        <X size={18} />
      </button>

      {/* Image container — stops click propagation so clicking image doesn't close */}
      <div
        className="relative z-10 max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Full Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          style={{ boxShadow: "0 0 80px rgba(0,0,0,0.6)" }}
        />
      </div>

      {/* Footer hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/40 uppercase tracking-[3px] font-bold">
        Click anywhere or press Esc to close
      </p>
    </div>,
    document.body
  );
}
