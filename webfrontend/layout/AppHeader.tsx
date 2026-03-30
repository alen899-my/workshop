"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, LogOut, UserCog, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const [user, setUser] = useState<{ 
    shopName?: string; 
    ownerName?: string; 
    role?: string 
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live clock — ticks every second
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load user
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("workshop_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("workshop_token");
    localStorage.removeItem("workshop_user");
    window.location.href = "/login";
  };

  const timeStr = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    : "--:--:--";

  const dateStr = now
    ? now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "--- --, ----";

  const initials = (
    user?.shopName?.[0] || user?.ownerName?.[0] || "W"
  ).toUpperCase();

  const roleLabels: Record<string, string> = {
    admin: "Super Admin",
    shop_owner: "Shop Owner",
    worker: "Technician",
    shop: "Shop Manager"
  };

  const displayRole = user?.role ? (roleLabels[user.role.toLowerCase()] || user.role) : "Administrator";

  return (
    <header className="h-14 shrink-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 sm:px-6 sticky top-0 transition-all">

      {/* ── Left: mobile spacer (hamburger is absolute-positioned in sidebar) ── */}
      <div className="flex items-center gap-3">
        <div className="w-8 md:hidden" />

        {/* Date + Time — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-4 px-1">
          {/* Date */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <CalendarDays size={13} className="text-primary" />
            </div>
            <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-foreground/50 uppercase">
              {dateStr}
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/60" />

          {/* Time with seconds */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-accent/10">
              <Clock size={13} className="text-accent-foreground" />
            </div>
            <span className="font-mono text-[15px] font-black tabular-nums tracking-tighter text-foreground/90">
              {timeStr}
            </span>
          </div>
        </div>

        {/* Mobile: time only, no date */}
        <div className="flex sm:hidden items-center gap-1.5 px-1">
          <Clock size={11} className="text-primary/70 shrink-0" />
          <span className="font-mono text-[12px] font-bold tabular-nums tracking-widest text-foreground/80">
            {timeStr}
          </span>
        </div>
      </div>

      {/* ── Right: shop name + avatar dropdown ── */}
      <div className="flex items-center gap-3" ref={dropdownRef}>

        {/* Identity labels: Shop Name & Username */}
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-bold tracking-tight text-foreground leading-none">
            {(user?.shopName || "Workshop").toUpperCase()}
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-primary leading-none">
            {displayRole}
          </span>
        </div>

        {/* Avatar button */}
        <button
          onClick={() => setDropdownOpen(v => !v)}
          aria-label="Account menu"
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-1 pr-2 transition-all duration-200 active:scale-95",
            dropdownOpen
              ? "border-primary/50 bg-primary/5 shadow-inner"
              : "hover:border-primary/30 hover:bg-white"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-black tracking-tighter text-primary-foreground shadow-md shadow-primary/25">
            {initials}
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "text-muted-foreground transition-transform duration-300",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* ── Dropdown menu ── */}
        {dropdownOpen && (
          <div className="absolute right-4 top-[calc(3.5rem+8px)] sm:right-6 w-52 rounded-2xl border border-border bg-card shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

            {/* User info header */}
            <div className="border-b border-border bg-muted/20 px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                  Operator Panel
                </p>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="font-mono text-[14px] font-black text-foreground truncate leading-none">
                {(user?.shopName || "Workshop").toUpperCase()}
              </p>
              <p className="font-mono text-[10px] font-bold text-muted-foreground tracking-tight truncate mt-1.5">
                SECURE SESSION ACTIVE
              </p>
            </div>

            {/* Actions */}
            <div className="p-1.5 flex flex-col gap-0.5">
              <button
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/10"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <UserCog size={13} className="text-primary" />
                </div>
                <div>
                  <p className="font-mono text-[12px] font-bold text-foreground leading-none">
                    Edit Profile
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    Update shop details
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="my-1 h-px bg-border" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-destructive/8 group"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                  <LogOut size={13} className="text-destructive" />
                </div>
                <div>
                  <p className="font-mono text-[12px] font-bold text-destructive leading-none">
                    Log Out
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    End your session
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}