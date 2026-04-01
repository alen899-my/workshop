"use client";

import React from "react";
import Link from "next/link";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Percent, ChevronRight, Building2, ShieldCheck, Bell, Palette } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    group: "Billing & Finance",
    items: [
      {
        href: "/app/settings/taxes",
        icon: Percent,
        title: "Tax Configuration",
        description: "Configure GST, VAT, Sales Tax, and global billing conditions.",
        badge: "Global",
        color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <ModuleLayout
      title="System Settings"
      description="Configure core application parameters and logic."
    >
      <div className="flex flex-col gap-10 max-w-4xl">
        {SETTINGS_SECTIONS.map(section => (
          <div key={section.group} className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground px-1">{section.group}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group p-5 rounded-2xl border border-border bg-card hover:bg-muted/10 transition-colors flex items-start gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-tight text-foreground">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase tracking-[2px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModuleLayout>
  );
}
