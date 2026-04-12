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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 outline-none focus:outline-none">
      {/* Premium Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-background/40 backdrop-blur-[2px] cursor-pointer z-[-1]"
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-none border border-border bg-card shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col",
          "h-auto max-h-[calc(100dvh-2rem)]", // Maximum height on small screens
          widthClasses[width]
        )}
      >
        {/* Decorative Top Bar */}
        <div className="h-1 bg-primary w-full shrink-0" />
        
        {/* Header Section - Fixed at top */}
        <div className="flex items-center justify-between border-b border-border bg-muted/10 px-5 py-4 sm:px-8 sm:py-6 shrink-0">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 leading-tight truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/40 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 hover:scale-105 transition-all shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable Area */}
        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 no-scrollbar text-foreground/90 flex-1 min-h-0">
          {children}
        </div>

        {/* Footer actions area - Fixed at bottom */}
        {footer && (
          <div className="border-t border-border bg-muted/5 px-5 py-5 sm:px-8 sm:py-6 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
