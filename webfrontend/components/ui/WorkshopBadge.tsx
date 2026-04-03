"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WorkshopBadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline" | "muted";
  size?: "xs" | "sm" | "md";
  className?: string;
  dot?: boolean;
}

const VARIANTS = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  outline: "bg-transparent text-foreground border-border",
  muted: "bg-muted/50 text-muted-foreground border-border/50",
};

const SIZES = {
  xs: "text-[9px] px-2 py-0.5 rounded-full",
  sm: "text-[10px] px-2.5 py-1 rounded-full",
  md: "text-[11px] px-3 py-1.5 rounded-full",
};

export function WorkshopBadge({
  children,
  variant = "primary",
  size = "xs",
  className,
  dot = false,
}: WorkshopBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium uppercase tracking-wider border transition-all duration-200",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {dot && (
        <span className={cn(
          "w-1 h-1 rounded-full",
          variant === "primary" ? "bg-primary" : 
          variant === "success" ? "bg-emerald-500" : 
          variant === "danger" ? "bg-destructive" : "bg-current"
        )} />
      )}
      {children}
    </span>
  );
}
