"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const tags = [
  { label: "Repair Management", color: "#3d7a78" },
  { label: "Vehicle Tracking", color: "#7ab4cc" },
  { label: "Customer Records", color: "#d4a017" },
  { label: "Worker Assignments", color: "#d4622a" },
  { label: "Billing & Invoices", color: "#8fb8a8" },
];

export function PreviewSection() {
  const [activeCard, setActiveCard] = React.useState<"dashboard" | "vehicles" >("dashboard");

  return (
    <section
      className="bg-background py-16 md:py-[100px] relative overflow-hidden transition-colors duration-500"
    >
      {/* Subtle top rule */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* Ambient glowing blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none dark:from-primary/20" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none dark:from-accent/20" />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 relative z-10">
        {/* Eyebrow */}
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary mb-4">
          Live Product Preview
        </p>

        {/* Headline */}
        <h2 className="font-sans text-[clamp(28px,4vw,44px)] font-bold text-foreground leading-[1.1] max-w-[560px] mb-4">
          See Your Entire Garage{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">At a Glance</span>
        </h2>

        <p className="font-sans text-[14px] text-muted-foreground max-w-[440px] lineHeight-[1.7] mb-8">
          One dashboard. Every vehicle, every worker, every repair — tracked in
          real time so nothing falls through the cracks.
        </p>


        {/* Stacked / fanned preview cards */}
        <div
          className="relative max-w-[900px] mx-auto h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]"
        >
          {/* Dashboard Preview */}
          <div
            onClick={() => setActiveCard("dashboard")}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer",
              activeCard === "dashboard"
                ? "top-0 w-[96%] rotate-[-1.5deg] z-20 border-2 border-primary/30 shadow-[0_20px_60px_var(--primary)/0.18,0_4px_16px_rgba(0,0,0,0.1)]"
                : "top-8 w-full rotate-[3deg] z-10 border border-primary/20 shadow-[0_8px_32px_var(--primary)/0.12,0_2px_8px_rgba(0,0,0,0.08)] opacity-60 grayscale-[0.5]"
            )}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 dark:bg-muted/30 border-b border-primary/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c0272d]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#3d7a78]" />
              </div>
              <div className="flex-1 ml-3 bg-background/50 border border-border/50 rounded-sm px-2.5 py-0.5 text-[9px] font-mono text-muted-foreground truncate">
                app.vehrep.com/dashboard
              </div>
            </div>
            <div className="w-full aspect-video relative bg-muted/20">
              <Image
                src="/images/landing page/preview.png"
                alt="VehRep dashboard preview"
                fill
                quality={90}
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Vehicles Preview */}
          <div
            onClick={() => setActiveCard("vehicles")}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer",
              activeCard === "vehicles"
                ? "top-0 w-[96%] rotate-[1.5deg] z-20 border-2 border-primary/30 shadow-[0_20px_60px_var(--primary)/0.18,0_4px_16px_rgba(0,0,0,0.1)]"
                : "top-8 w-full rotate-[-3deg] z-10 border border-primary/20 shadow-[0_8px_32px_var(--primary)/0.12,0_2px_8px_rgba(0,0,0,0.08)] opacity-60 grayscale-[0.5]"
            )}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 dark:bg-muted/30 border-b border-primary/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c0272d]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#3d7a78]" />
              </div>
              <div className="flex-1 ml-3 bg-background/50 border border-border/50 rounded-sm px-2.5 py-0.5 text-[9px] font-mono text-muted-foreground truncate">
                app.vehrep.com/vehicles
              </div>
            </div>
            <div className="w-full aspect-video relative bg-muted/20">
              <Image
                src="/images/landing page/preview2.png"
                alt="VehRep vehicles page"
                fill
                quality={90}
                className="object-cover object-top"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
