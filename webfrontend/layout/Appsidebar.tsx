"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      { href: "/app/repairs/create", icon: PlusCircle, title: "New Repair", permission: "create:repair" },
      { href: "/app/repairs", icon: Wrench, title: "Repairs", permission: "view:repairs" },
      { href: "/app/vehicles", icon: Car, title: "Vehicles", permission: "view:vehicles" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/app/users", icon: UsersRound, title: "Users", permission: "view:users" },
      { href: "/app/customers", icon: Users, title: "Customers", permission: "view:customers" },
      { href: "/app/shops", icon: Building2, title: "Shops", permission: "view:shops" },
      { href: "/app/roles", icon: ShieldHalf, title: "Roles", permission: "view:role" },
      { href: "/app/permissions", icon: ShieldCheck, title: "Permissions", permission: "view:permission" },
      { href: "/app/invoices", icon: Receipt, title: "Invoices", permission: "view:invoices" },
      { href: "/app/settings", icon: Settings, title: "Settings", permission: "manage:settings" },
    ],
  },
];

// ─── Sidebar open context ─────────────────────────────────────────────────────

type Listener = (open: boolean) => void;
const listeners: Set<Listener> = new Set();
export function onMobileSidebarChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function triggerMobileSidebar(open: boolean) {
  listeners.forEach((fn) => fn(open));
}

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
        "group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md shadow-sidebar-primary/10"
          : "text-sidebar-foreground/85"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary-foreground/80" />
      )}

      <Icon
        size={16}
        className={cn(
          "shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        )}
      />

      {!collapsed && (
        <span className="truncate tracking-wide font-mono text-[13px]">{title}</span>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-[var(--radius)] bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {title}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

function SidebarContent({
  isCollapsed,
  onItemClick,
  onClose,
}: {
  isCollapsed: boolean;
  onItemClick?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { can } = useRBAC();

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        className={cn(
          "shrink-0 flex items-center border-b border-sidebar-border",
          isCollapsed
            ? "justify-center h-14 px-0"
            : "h-14 px-4"
        )}
      >
        {isCollapsed ? (
          <Image
            src="/images/logos/single.png"
            alt="Repairo Logo"
            width={28}
            height={28}
            priority
            className="object-contain"
          />
        ) : (
          <Image
            src="/images/logos/logo.png"
            alt="Repairo Logo"
            width={130}
            height={36}
            priority
            className="object-contain"
          />
        )}
      </Link>

      {/* Close button on mobile drawer */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Close menu"
        >
          <X size={15} />
        </button>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 no-scrollbar">
        {NAV_MAIN.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!("permission" in item)) return true;
            return item.permission && can(item.permission as string);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-4">
              {!isCollapsed ? (
                <p className="mb-1.5 px-3 text-[10px] font-bold tracking-[2px] text-sidebar-foreground/50 uppercase">
                  {group.label}
                </p>
              ) : (
                <div className="mb-1.5 mx-auto h-px w-5 bg-sidebar-border" />
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
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    const unsub = onMobileSidebarChange(setMobileOpen);
    return () => { unsub(); };
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0 border-r border-sidebar-border shadow-sm relative">
        <SidebarContent
          isCollapsed={collapsed}
          onItemClick={undefined}
        />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "absolute bottom-4 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground shadow-sm transition-colors",
            collapsed ? "left-1/2 -translate-x-1/2" : "right-4"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </aside>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full shadow-2xl md:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile drawer is wider for better tap targets */}
        <div className="h-full [&>div]:!w-[260px]">
          <SidebarContent
            isCollapsed={false}
            onItemClick={closeMobile}
            onClose={closeMobile}
          />
        </div>
      </aside>
    </>
  );
}