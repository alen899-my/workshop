"use client";

import React from "react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ModuleFormProps {
  title: string;
  subtitle: string;
  backUrl: string;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  children: React.ReactNode;
  footerVisible?: boolean;
}

/** Professional Themed Form Wrapper for Modules */
export function ModuleForm({
  title,
  subtitle,
  backUrl,
  onSubmit,
  loading,
  children,
  footerVisible = true,
}: ModuleFormProps) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Form Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href={backUrl}
          className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-primary transition-all"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Main Form Area */}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
             {children}
           </div>
        </div>

        {/* Action Footer */}
        {footerVisible && (
          <div className="flex items-center justify-end gap-3 mt-4">
            <Link href={backUrl}>
               <WorkshopButton 
                 variant="ghost" 
                 type="button" 
                 size="md"
                 className="font-medium text-muted-foreground hover:text-foreground"
               >
                 Cancel
               </WorkshopButton>
            </Link>
            <WorkshopButton
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="px-8 font-semibold transition-all"
              icon={<Save size={18} />}
            >
              Save
            </WorkshopButton>
          </div>
        )}
      </form>
    </div>
  );
}
