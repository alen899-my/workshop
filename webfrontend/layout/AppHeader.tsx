"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  LogOut,
  UserCog,
  User as UserIcon,
  Clock,
  CalendarDays,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useRBAC } from "@/lib/rbac";
import { useRouter } from "next/navigation";
import { triggerMobileSidebar } from "@/layout/Appsidebar";

export function AppHeader() {
  const router = useRouter();
  const { user, can } = useRBAC();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
    document.cookie = "workshop_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "workshop_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "workshop_permissions=; path=/; max-age=0; SameSite=Lax";
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
    shop: "Shop Manager",
  };

  const displayRole = user?.role
    ? roleLabels[user.role.toLowerCase()] || user.role
    : "Administrator";

  return (
    <header className="h-14 shrink-0 z-30 flex items-center border-b border-border bg-background px-4 sm:px-6 sticky top-0">

      {/* ── Left: hamburger (mobile) ── */}
      <button
        onClick={() => triggerMobileSidebar(true)}
        aria-label="Open menu"
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-2"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile: centered logo ── */}
      <div className="flex-1 flex justify-center md:hidden">
        <span className="font-mono text-base font-black tracking-[0.18em] text-primary uppercase">
          REPAIRO
        </span>
      </div>

      {/* ── Desktop left: date & time ── */}
      <div className="hidden md:flex items-center gap-4 flex-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays size={14} />
          <span className="text-sm">{dateStr}</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock size={14} />
          <span className="text-sm tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* ── Right: theme toggle + user menu ── */}
      <div className="flex items-center gap-2 md:gap-3" ref={dropdownRef}>

        <ThemeToggle />

        {/* Shop name & role — desktop only */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {user?.shopName || "Workshop"}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">{displayRole}</span>
        </div>

        {/* Avatar button */}
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="Open account menu"
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-border p-1 pr-2 transition-colors",
            dropdownOpen ? "bg-muted" : "hover:bg-muted"
          )}
        >
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <ChevronDown
            size={13}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* ── Dropdown ── */}
        {dropdownOpen && (
          <div className="fixed right-4 sm:right-6 top-[calc(3.5rem+6px)] w-56 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">

            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.shopName || "Workshop"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{displayRole}</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              {can("can:see:the:shop:details:and:can:edit") && (
                <Link
                  href="/app/settings/shop"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <UserCog size={15} className="text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <p className="font-medium leading-none">Shop Profile</p>
                    <p className="text-xs text-muted-foreground mt-0.5">View &amp; edit shop details</p>
                  </div>
                </Link>
              )}

              <Link
                href="/app/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <UserIcon size={15} className="text-muted-foreground shrink-0" />
                <div className="text-left">
                  <p className="font-medium leading-none">My Profile</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Account settings</p>
                </div>
              </Link>

              <div className="my-1 h-px bg-border" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={15} className="text-destructive shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-destructive leading-none">Log Out</p>

                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}