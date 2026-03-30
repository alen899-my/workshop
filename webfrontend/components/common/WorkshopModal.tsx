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

/** 
 * Professional Themed Modal for Dashboard Modules 
 * Force-Centered via Grid & Fixed Portals
 */
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
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Also prevent touch events on body for mobile
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center p-4 overflow-y-auto no-scrollbar outline-none focus:outline-none animate-in fade-in duration-300">
      {/* Fixed Backdrop - Fully transparent with no blur */}
      <div
        className="fixed inset-0 bg-background/20 transition-opacity cursor-pointer z-[-1]"
        onClick={onClose}
      />

      {/* Modal Content container - Center aligned in the grid */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 m-auto pointer-events-auto",
          widthClasses[width]
        )}
      >
        {/* Decorative Top Bar */}
        <div className="h-1 bg-primary w-full" />
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border bg-muted/10 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-mono text-[13px] font-black uppercase tracking-[0.25em] text-foreground leading-none">
              {title}
            </h2>
            {subtitle && (
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-primary/70 leading-none">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body - Maximum visibility scrollable area */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-8 sm:px-8 no-scrollbar text-foreground/90">
          {children}
        </div>

        {/* Footer actions area */}
        {footer && (
          <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
