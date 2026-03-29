"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function AuthFormField({
  label,
  error,
  icon,
  className,
  type,
  ...props
}: AuthFormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-muted-foreground ml-0.5">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          type={inputType}
          className={cn(
            "w-full bg-background border border-border",
            "text-foreground text-sm",
            "rounded-md px-4 py-2.5",
            "placeholder:text-muted-foreground/40",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
            "transition-all duration-200",
            error && "border-destructive focus:border-destructive focus:ring-destructive/10",
            icon && "pl-10",
            isPassword && "pr-10",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-destructive mt-0.5 ml-1">
          {error}
        </span>
      )}
    </div>
  );
}