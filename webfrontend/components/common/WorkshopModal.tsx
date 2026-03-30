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
      {/* Fixed Backdrop - Higher Z than content but in same layer */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Content container - Center aligned in the grid */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 m-auto pointer-events-auto",
          widthClasses[width]
        )}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-mono text-[14px] font-black uppercase tracking-[0.25em] text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/40 hover:bg-accent/10 hover:text-foreground transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Maximum visibility scrollable area */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-8 sm:px-8 no-scrollbar text-foreground/90">
          {children}
        </div>

        {/* Footer actions area */}
        {footer && (
          <div className="border-t border-border bg-muted/10 px-6 py-5 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
