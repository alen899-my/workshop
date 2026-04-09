"use client";

import React from "react";
import Link from "next/link";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Percent, Building2, Palette, Coins, User } from "lucide-react";
import { ThemeSelector } from "@/components/ui/ThemeToggle";
import { useRBAC } from "@/lib/rbac";

const SHOP_PERMISSION = "can:see:the:shop:details:and:can:edit";

const BILLING_ITEMS = [
  {
    href: "/app/settings/taxes",
    icon: Percent,
    title: "Tax Configuration",
    description: "Configure GST, VAT, Sales Tax, and global billing conditions.",
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    href: "/app/settings/currency",
    icon: Coins,
    title: "Currency Settings",
    description: "Set your branch's default currency code for bills and reporting.",
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
];

function SettingCard({ href, icon: Icon, title, description, color }: { href: string; icon: React.ElementType; title: string; description: string; color: string }) {
  return (
    <Link
      href={href}
      className="group p-5 rounded-2xl border border-border bg-card hover:bg-muted/10 transition-colors flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-sm font-bold tracking-tight text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}

export default function SettingsPage() {
  const { can } = useRBAC();
  const canManageShop = can(SHOP_PERMISSION);

  return (
    <ModuleLayout
      title="System Settings"
      description="Change settings for your workshop."
    >
      <div className="flex flex-col gap-10 max-w-4xl">

        {/* ── General Information ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground px-1">General Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingCard
              href="/app/settings/profile"
              icon={User}
              title="User Profile"
              description="Manage your personal information, security, and preferences."
              color="text-primary bg-primary/10 border-primary/20"
            />
            {canManageShop && (
              <SettingCard
                href="/app/settings/shop"
                icon={Building2}
                title="Shop Details"
                description="Update workshop name, address, contact details, and brand logo."
                color="text-indigo-600 bg-indigo-500/10 border-indigo-500/20"
              />
            )}
          </div>
        </div>

        {/* ── Billing & Finance ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground px-1">Billing &amp; Finance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BILLING_ITEMS.map(item => (
              <SettingCard key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground px-1">Appearance</h2>
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 text-violet-600 bg-violet-500/10 border-violet-500/20">
                <Palette size={18} strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold tracking-tight text-foreground">Theme Mode</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose between light and dark mode, or follow your system preference.
                </p>
              </div>
            </div>
            <ThemeSelector />
          </div>
        </div>

      </div>
    </ModuleLayout>
  );
}

