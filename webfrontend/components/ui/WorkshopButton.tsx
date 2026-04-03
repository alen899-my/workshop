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
    "bg-primary text-primary-foreground border border-primary " +
    "hover:ring-1 hover:ring-primary/20",

  outline:
    "bg-transparent text-foreground border border-border " +
    "hover:bg-accent hover:text-accent-foreground",

  ghost:
    "bg-transparent text-muted-foreground " +
    "hover:bg-accent hover:text-accent-foreground",

  danger:
    "bg-destructive text-destructive-foreground border border-destructive " +
    "hover:ring-1 hover:ring-destructive/20",

  steel:
    "bg-foreground text-background border border-foreground " +
    "hover:bg-foreground/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2.5",
  xl: "text-lg px-8 py-4 gap-3",
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
        "font-semibold rounded-md",
        "cursor-pointer",
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
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
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