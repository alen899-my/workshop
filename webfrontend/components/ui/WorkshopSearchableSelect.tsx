"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
}

interface WorkshopSearchableSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

/** 
 * Professional Combat-Ready Searchable Select
 * Premium UI with real-time filtering and keyboard navigation.
 */
export function WorkshopSearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  label,
  error,
  className,
  disabled = false
}: WorkshopSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selected label lookup
  const selectedOption = useMemo(() => 
    options.find(opt => String(opt.value) === String(value)),
  [options, value]);

  // Filtering logic
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const toggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground ml-0.5">
          {label}
        </label>
      )}

      <div className="relative group">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          className={cn(
            "w-full bg-background border border-border rounded-md px-4 py-2.5 text-left transition-all",
            "flex items-center justify-between gap-2 overflow-hidden",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
            isOpen && "border-primary",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive"
          )}
        >
          <div className="flex-1 truncate">
            {selectedOption ? (
              <span className="text-sm font-semibold text-foreground">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground/40">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={cn(
              "text-muted-foreground/30 transition-transform duration-300",
              isOpen && "rotate-180 text-primary"
            )} 
          />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-border rounded-md shadow-lg z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top overflow-hidden">
            {/* Search Box */}
            <div className="p-2 border-b border-border relative">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/30 border border-transparent rounded-md pl-9 pr-4 py-2 text-sm outline-none focus:bg-muted/50 transition-colors"
                onKeyDown={(e) => {
                   if (e.key === 'Escape') setIsOpen(false);
                }}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-[280px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center">
                   <p className="text-xs text-muted-foreground italic">No results found</p>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-all duration-100 flex items-center justify-between group/opt mb-0.5 last:mb-0",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {opt.label}
                        </span>
                        {opt.subLabel && (
                          <span className={cn(
                            "text-xs",
                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60"
                          )}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-primary-foreground" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive mt-0.5 ml-1">
          {error}
        </p>
      )}
    </div>
  );
}
