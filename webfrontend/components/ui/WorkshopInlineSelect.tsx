"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface WorkshopInlineSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  wrapperClassName?: string;
}

export function WorkshopInlineSelect({ 
  value, 
  onChange, 
  options, 
  disabled, 
  className,
  activeClassName,
  wrapperClassName
}: WorkshopInlineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  // Calculate dropdown position from button's bounding rect
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 260; // max-height estimate

    // Open upward if not enough space below
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setDropdownStyle({
        position: "fixed",
        bottom: viewportHeight - rect.top + 4,
        left: rect.left,
        width: Math.max(rect.width, 180),
        zIndex: 9999,
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 180),
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Close on click outside + Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // Close on scroll/resize (reposition)
  useEffect(() => {
    if (!isOpen) return;
    const handle = () => updatePosition();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [isOpen, updatePosition]);

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-card border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 origin-top overflow-hidden"
    >
      <div className="flex flex-col p-1 max-h-[250px] overflow-y-auto">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-colors whitespace-nowrap",
                // Font style: compact uppercase for filter chips, normal for form selects
                className ? "text-sm font-medium" : "text-[10px] font-bold uppercase tracking-wider",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <Check size={14} className="ml-2 shrink-0 opacity-80" />}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn("relative inline-block w-full min-w-[140px]", wrapperClassName)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-primary/20",
          // Default compact filter-chip style (used when no className override)
          !className && "text-[9px] sm:text-xs font-black uppercase tracking-widest px-2 py-1.5 sm:px-3 sm:py-2",
          // Default colors when no className and not open
          !className && !isOpen && "bg-card hover:bg-muted text-foreground border-border",
          // Open state colors
          isOpen ? (activeClassName || className || "bg-accent border-primary text-foreground") : className,
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown size={14} className={cn("transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Portal: renders outside all stacking contexts */}
      {typeof window !== "undefined" && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}
