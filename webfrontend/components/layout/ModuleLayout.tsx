"use client";

import React from "react";
import { Plus } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

interface ModuleLayoutProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  children: React.ReactNode;
}

/** Standardized Layout for Dashboard Modules */
export function ModuleLayout({
  title,
  description,
  buttonLabel,
  onButtonClick,
  children,
}: ModuleLayoutProps) {
  return (
    <div className="flex flex-col gap-8 p-1 sm:p-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {buttonLabel && (
          <WorkshopButton
            onClick={onButtonClick}
            variant="primary"
            size="md"
            className="w-full sm:w-auto font-medium transition-all"
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
