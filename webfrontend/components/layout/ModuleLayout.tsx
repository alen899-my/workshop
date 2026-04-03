"use client";

import React from "react";
import { Plus, ChevronLeft } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import Link from "next/link";

interface ModuleLayoutProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  backUrl?: string;
  children: React.ReactNode;
}

/** Standardized Layout for Dashboard Modules */
export function ModuleLayout({
  title,
  description,
  buttonLabel,
  onButtonClick,
  backUrl,
  children,
}: ModuleLayoutProps) {
  return (
    <div className="flex flex-col gap-8 p-1 sm:p-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          {backUrl && (
            <Link href={backUrl} className="flex items-center gap-2 text-xs font-normal text-muted-foreground hover:text-primary transition-colors group w-fit">
               <div className="w-6 h-6 rounded-none bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ChevronLeft size={14} />
               </div>
               Back to overview
            </Link>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {buttonLabel && (
          <WorkshopButton
            onClick={onButtonClick}
            variant="primary"
            size="md"
            className="w-full sm:w-auto font-medium"
            icon={<Plus size={16} />}
          >
            {buttonLabel}
          </WorkshopButton>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
