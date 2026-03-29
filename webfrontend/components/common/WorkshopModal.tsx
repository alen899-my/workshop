"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

/** Professional Themed Modal for Dashboard Modules */
export function WorkshopModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "md",
}: WorkshopModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div 
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300",
          widthClasses[width]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-mono text-[14px] font-black uppercase tracking-[0.2em] text-foreground">
              {title}
            </h2>
            {subtitle && (
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {subtitle}
                </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-accent/10 hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 no-scrollbar text-foreground/80">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border bg-muted/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
