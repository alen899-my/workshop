"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Premium animated dark/light mode toggle.
 * Renders a pill-shaped track with a sliding circle + icon swap.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render nothing server-side
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-[52px] rounded-full bg-muted/40 animate-pulse",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-500 ease-out",
        isDark
          ? "border-primary/40 bg-sidebar shadow-[0_0_12px_var(--primary)/0.15]"
          : "border-border bg-muted/50 shadow-sm",
        "hover:shadow-md active:scale-95",
        className
      )}
    >
      {/* Track background glow */}
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          isDark
            ? "bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 opacity-100"
            : "opacity-0"
        )}
      />

      {/* Sliding thumb */}
      <span
        className={cn(
          "pointer-events-none relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark
            ? "translate-x-[22px] bg-primary text-primary-foreground shadow-primary/30"
            : "translate-x-[2px] bg-card text-foreground shadow-border/50"
        )}
      >
        {/* Sun icon — visible in light mode */}
        <Sun
          size={13}
          strokeWidth={2.5}
          className={cn(
            "absolute transition-all duration-300",
            isDark
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          )}
        />
        {/* Moon icon — visible in dark mode */}
        <Moon
          size={13}
          strokeWidth={2.5}
          className={cn(
            "absolute transition-all duration-300",
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0"
          )}
        />
      </span>
    </button>
  );
}

/**
 * Larger theme toggle card for Settings page.
 * Shows both options with labels + visual preview.
 */
export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const options = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      preview: (
        <div className="w-full h-12 rounded-lg bg-[oklch(0.99_0.003_248)] border border-[oklch(0.88_0.012_248)] flex items-end p-2 gap-1.5">
          <div className="h-3 w-6 rounded-sm bg-[oklch(0.48_0.072_188)]" />
          <div className="h-2 flex-1 rounded-sm bg-[oklch(0.94_0.008_248)]" />
        </div>
      ),
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      preview: (
        <div className="w-full h-12 rounded-lg bg-[oklch(0_0_0)] border border-[oklch(0.15_0_0)] flex items-end p-2 gap-1.5">
          <div className="h-3 w-6 rounded-sm bg-[oklch(0.48_0.072_188)]" />
          <div className="h-2 flex-1 rounded-sm bg-[oklch(0.15_0_0)]" />
        </div>
      ),
    },
    {
      value: "system",
      label: "System",
      icon: ({ size, ...p }: { size?: number; [key: string]: any }) => (
        <svg
          width={size || 16}
          height={size || 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...p}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      preview: (
        <div className="w-full h-12 rounded-lg overflow-hidden flex">
          <div className="flex-1 bg-[oklch(0.99_0.003_248)] flex items-end p-2">
            <div className="h-3 w-4 rounded-sm bg-[oklch(0.48_0.072_188)]" />
          </div>
          <div className="flex-1 bg-[oklch(0.18_0.040_184)] flex items-end p-2">
            <div className="h-3 w-4 rounded-sm bg-[oklch(0.58_0.090_188)]" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300",
              isActive
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}

            {/* Preview */}
            {opt.preview}

            {/* Label */}
            <div className="flex items-center gap-2">
              <Icon
                size={14}
                className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-widest",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {opt.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
