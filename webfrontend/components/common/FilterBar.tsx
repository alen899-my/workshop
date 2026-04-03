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
    <div className="flex flex-col gap-0 rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden mb-5 transition-all">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border/40">
        {/* Search */}
        <div
          className={cn(
            "flex items-center gap-2.5 flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5",
            "focus-within:border-primary/50 focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300"
          )}
        >
          <Search size={14} className="shrink-0 text-primary opacity-60" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="flex items-center justify-center w-5 h-5 rounded-lg bg-muted/20 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        {children && (
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "relative flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-300 shrink-0 shadow-sm active:scale-95",
              open
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/60 bg-background/50 text-foreground hover:bg-card hover:border-primary/40"
            )}
          >
            <SlidersHorizontal size={14} className={cn(open ? "opacity-100" : "text-primary opacity-70")} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest">Filters</span>
            {!open && activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground shadow-md shadow-primary/30 animate-in zoom-in">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Reset */}
        {totalActive > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-destructive transition-all duration-200 hover:bg-destructive/10 hover:border-destructive/40 active:scale-95 shrink-0"
          >
            <RotateCcw size={14} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Reset</span>
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
    <div className="flex flex-col gap-2 min-w-[170px]">
      <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-xl border border-border/60 bg-card px-4 py-2.5",
          "text-[13px] font-bold text-foreground outline-none cursor-pointer transition-all duration-300",
          "focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm",
          !value && "text-muted-foreground/60"
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
