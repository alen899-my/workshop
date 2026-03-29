"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

/** Professional Denied Access Screen */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-destructive/10 blur-[60px] rounded-full scale-150" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-destructive/20 bg-card/50 shadow-2xl backdrop-blur-md">
           <ShieldAlert size={48} className="text-destructive" />
        </div>
      </div>

      <h1 className="font-mono text-4xl font-black uppercase tracking-tighter text-foreground mb-2">
        ACCESS <span className="text-destructive tracking-widest">DENIED</span>
      </h1>
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 max-w-md mx-auto leading-relaxed mb-10">
        Your security clearance level is insufficient for this sector. 
        Please contact a system administrator if you believe this is an error.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/app">
          <WorkshopButton variant="primary" size="lg" className="px-10 font-black italic uppercase tracking-widest">
            <Home size={18} className="mr-2" />
            Dashboard
          </WorkshopButton>
        </Link>
        <button onClick={() => window.history.back()}>
          <WorkshopButton variant="ghost" size="lg" className="font-black italic uppercase tracking-widest text-muted-foreground">
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </WorkshopButton>
        </button>
      </div>

      <div className="mt-16 pt-8 border-t border-border/40 w-full max-w-sm">
         <p className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            SECURITY PROTOCOL 403-E
         </p>
      </div>
    </div>
  );
}
