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
      bg: "bg-emerald-600 border-emerald-500",
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      text: "text-white",
      desc: "text-emerald-50",
    },
    error: {
      bg: "bg-destructive border-destructive",
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      text: "text-white",
      desc: "text-red-50",
    },
    warning: {
      bg: "bg-amber-500 border-amber-400",
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      text: "text-white",
      desc: "text-amber-50",
    },
    info: {
      bg: "bg-blue-600 border-blue-500",
      icon: <Info className="w-5 h-5 text-white" />,
      text: "text-white",
      desc: "text-blue-50",
    },
  };

  const v = variants[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start w-full border shadow-2xl rounded-xl p-4 transition-all transform animate-in slide-in-from-top-5 duration-300",
        v.bg
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{v.icon}</div>
      <div className="ml-3 flex-1 overflow-hidden">
        <h3 className={cn("text-sm font-semibold leading-tight", v.text)}>
          {toast.title}
        </h3>
        {toast.description && (
          <p className={cn("mt-1 text-sm leading-relaxed opacity-90", v.desc)}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          "ml-4 flex-shrink-0 flex items-center justify-center rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20",
          v.text
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
