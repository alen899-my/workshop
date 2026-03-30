"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  /** current search query */
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** number of non-search filters that are currently active */
  activeFilterCount?: number;
  /** called when "Clear all" is clicked */
  onReset: () => void;
  /** filter controls rendered inside the collapsible panel */
  children?: React.ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilterCount = 0,
  onReset,
  children,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const totalActive = activeFilterCount + (search.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-border/60 bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04),0_4px_16px_0_rgb(0,0,0,0.04)] overflow-hidden mb-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border/40">
        {/* Search */}
        <div
          className={cn(
            "flex items-center gap-2 flex-1 rounded-xl border border-border/60 bg-muted/40 px-3 py-2",
            "focus-within:border-primary/40 focus-within:bg-background",
            "focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all duration-200"
          )}
        >
          <Search size={13} className="shrink-0 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="flex items-center justify-center w-4 h-4 rounded-full bg-muted-foreground/20 text-muted-foreground/70 hover:bg-muted-foreground/30 hover:text-foreground transition-all text-[9px] font-bold leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter toggle */}
        {children && (
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all duration-200 shrink-0",
              open
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:border-border"
            )}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {!open && activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Reset */}
        {totalActive > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all shrink-0"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* ── Collapsible filter panel ── */}
      {children && open && (
        <div className="px-4 py-4 bg-muted/20 border-b border-border/30 flex flex-wrap gap-4 items-end">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Reusable filter select ──────────────────────────────────────────────── */

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "All",
}: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-lg border border-border/60 bg-background px-3 py-2",
          "text-[12.5px] font-medium text-foreground outline-none cursor-pointer",
          "focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]",
          "transition-all duration-150",
          !value && "text-muted-foreground"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
