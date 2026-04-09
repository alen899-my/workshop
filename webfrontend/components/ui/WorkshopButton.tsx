"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "steel";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface WorkshopButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary/50 " +
    "hover:bg-primary/90 hover:shadow-[0_8px_20px_rgba(61,122,120,0.3)] dark:hover:shadow-[0_8px_25px_rgba(61,122,120,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:text-white",

  outline:
    "bg-transparent text-foreground border border-border " +
    "hover:bg-primary/5 hover:border-primary/30 hover:text-primary active:scale-95 dark:text-white dark:hover:text-primary",

  ghost:
    "bg-transparent text-muted-foreground " +
    "hover:bg-primary/10 hover:text-primary active:scale-95 dark:text-white/70 dark:hover:text-white",

  danger:
    "bg-destructive text-destructive-foreground border border-destructive/50 " +
    "hover:bg-destructive/90 hover:shadow-[0_8px_20px_rgba(192,39,45,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:text-white",

  steel:
    "bg-foreground text-background border border-foreground " +
    "hover:bg-foreground/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:bg-muted dark:text-white dark:border-border",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-[11px] font-black uppercase tracking-wider px-3 py-2 gap-2",
  md: "text-xs font-black uppercase tracking-widest px-5 py-3 gap-2.5",
  lg: "text-sm font-black uppercase tracking-[0.15em] px-8 py-4 gap-3",
  xl: "text-base font-black uppercase tracking-[0.2em] px-10 py-5 gap-4",
};

export function WorkshopButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: WorkshopButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        // base
        "inline-flex items-center justify-center",
        "rounded-xl", // Softer, more modern corners
        "cursor-pointer",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // variant + size
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className="flex-shrink-0 inline-flex">{icon}</span>
          )}
          {children}
          {icon && iconPosition === "right" && (
            <span className="flex-shrink-0 inline-flex">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}