"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  PlusCircle,
  Car,
  ClipboardList,
  Users,
  Receipt,
  BarChart2,
  Settings,
  UsersRound,
  ShieldCheck,
  ShieldHalf,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useRBAC } from "@/lib/rbac";

// ─── Nav structure ───────────────────────────────────────────────────────────

const NAV_MAIN = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/app", icon: LayoutDashboard, title: "Dashboard" },
      { href: "/app/repairs/create",  icon: PlusCircle,    title: "New Repair", permission: "create:repair"  },
      { href: "/app/repairs",     icon: Wrench,         title: "Repairs", permission: "view:repairs"     },
      { href: "/app/vehicles",    icon: Car,            title: "Vehicles"    },
      { href: "/app/jobs",        icon: ClipboardList,  title: "Job Cards"   },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/app/users",       icon: UsersRound,   title: "Users",       permission: "view:users" },
      { href: "/app/customers",   icon: Users,        title: "Customers",   permission: "view:customers" },
      { href: "/app/shops",       icon: Building2,    title: "Shops",       permission: "view:shops" },
      { href: "/app/roles",       icon: ShieldHalf,   title: "Roles",       permission: "view:role" },
      { href: "/app/permissions", icon: ShieldCheck,  title: "Permissions", permission: "view:permission" },
      { href: "/app/invoices",    icon: Receipt,      title: "Invoices",    permission: "view:invoices" },
      { href: "/app/reports",     icon: BarChart2,    title: "Reports",     permission: "view:reports" },
    ],
  },
];

const NAV_BOTTOM = [
  { href: "/app/settings", icon: Settings, title: "Settings" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}

// ─── Nav Item ────────────────────────────────────────────────────────────────

function NavItem({ href, icon: Icon, title, collapsed, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md shadow-sidebar-primary/10"
          : "text-sidebar-foreground/60"
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary-foreground/80" />
      )}

      <Icon
        size={16}
        className={cn(
          "shrink-0",
          active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
        )}
      />

      {!collapsed && (
        <span className="truncate tracking-wide font-mono text-[13px]">
          {title}
        </span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-[var(--radius)] bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg group-hover:opacity-100">
          {title}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { can, user } = useRBAC();

  // Helper to close mobile menu
  const closeMobile = () => setMobileOpen(false);

  // Sub-component for the actual content to avoid duplication
  const SidebarContent = ({ isCollapsed, onItemClick }: { isCollapsed: boolean, onItemClick?: () => void }) => (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border px-4 py-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <span className="font-mono text-base font-bold tracking-[4px] text-sidebar-foreground">
            VEH<span className="text-sidebar-primary">REP</span>
          </span>
        )}
        {isCollapsed && (
          <span className="font-mono text-sm font-bold tracking-widest text-sidebar-primary">
            VR
          </span>
        )}

        {/* Desktop collapse toggle */}
        {!onItemClick && ( // Only show on desktop
          <button
            onClick={() => setCollapsed(v => !v)}
            className={cn(
              "hidden rounded-[var(--radius)] p-1 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex",
              isCollapsed && "mx-auto"
            )}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 no-scrollbar">
        {NAV_MAIN.map((group) => {
          // Filter items based on permissions
          const visibleItems = group.items.filter(item => {
            // 1. If no permission required, show it
            if (!("permission" in item)) return true;
            
            // 2. Otherwise check explicit permission mapping
            return item.permission && can(item.permission as string);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              {!isCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[2px] text-sidebar-foreground/35">
                  {group.label}
                </p>
              )}
              {isCollapsed && (
                <div className="mb-2 mx-auto h-px w-5 bg-sidebar-border" />
              )}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  let active = false;
                  if (item.href === "/app") active = pathname === "/app";
                  else if (item.href === "/app/repairs") active = pathname === "/app/repairs";
                  else active = pathname.startsWith(item.href);

                  return (
                    <NavItem
                      key={item.href}
                      {...item}
                      collapsed={isCollapsed}
                      onClick={onItemClick}
                      active={active}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <div className="flex flex-col gap-0.5">
          {NAV_BOTTOM.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={isCollapsed}
              onClick={onItemClick}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>

      
        {isCollapsed && (
          <div className="mt-2 flex justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
              WS
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0 border-r border-sidebar-border shadow-sm">
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex md:hidden items-center justify-center rounded-[var(--radius)] bg-sidebar p-2 text-sidebar-foreground shadow-md"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[220px] shadow-xl md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={closeMobile}
          className="absolute right-3 top-3.5 z-10 rounded-[var(--radius)] p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
        <SidebarContent isCollapsed={false} onItemClick={closeMobile} />
      </aside>
    </>
  );
}