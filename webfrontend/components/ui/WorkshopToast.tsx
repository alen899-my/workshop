"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a WorkshopToastProvider");
  return context;
}

export function WorkshopToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((options: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed top-0 right-0 z-[9999] flex flex-col items-end justify-start gap-3 p-6 sm:p-8 pointer-events-none w-full sm:max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 2000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.duration]);

  const variants = {
    success: {
      bg: "bg-[oklch(0.55_0.15_150)] border-[oklch(0.45_0.15_150)]",
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      titleColor: "text-white",
      descColor: "text-white/90",
      closeBtn: "text-white/70 hover:text-white"
    },
    error: {
      bg: "bg-[oklch(0.60_0.19_42)] border-[oklch(0.50_0.19_42)]",
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      titleColor: "text-white",
      descColor: "text-white/90",
      closeBtn: "text-white/70 hover:text-white"
    },
    warning: {
      bg: "bg-[oklch(0.75_0.15_80)] border-[oklch(0.65_0.15_80)]",
      icon: <AlertTriangle className="w-5 h-5 text-[oklch(0.15_0.025_240)]" />,
      titleColor: "text-[oklch(0.15_0.025_240)]",
      descColor: "text-[oklch(0.15_0.025_240)]/80",
      closeBtn: "text-[oklch(0.15_0.025_240)]/60 hover:text-[oklch(0.15_0.025_240)]"
    },
    info: {
      bg: "bg-[oklch(0.38_0.13_248)] border-[oklch(0.28_0.13_248)]",
      icon: <Info className="w-5 h-5 text-white" />,
      titleColor: "text-white",
      descColor: "text-white/90",
      closeBtn: "text-white/70 hover:text-white"
    },
  };

  const v = variants[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start w-full shadow-2xl border rounded-md p-4 font-mono transition-all transform animate-in slide-in-from-top-5",
        v.bg
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{v.icon}</div>
      <div className="ml-3 flex-1 overflow-hidden">
        <h3 className={cn("text-xs font-bold uppercase tracking-widest truncate", v.titleColor)}>
          {toast.title}
        </h3>
        {toast.description && (
          <p className={cn("mt-1 text-sm font-medium leading-relaxed", v.descColor)}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={cn("ml-4 flex-shrink-0 transition-colors focus:outline-none", v.closeBtn)}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
