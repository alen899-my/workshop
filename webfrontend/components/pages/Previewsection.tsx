"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const tags = [
  { label: "Repair Management", color: "#3d7a78" },
  { label: "Vehicle Tracking", color: "#5bb0ae" },
  { label: "Customer Records", color: "#d4a017" },
  { label: "Worker Assignments", color: "#d4622a" },
  { label: "Billing & Invoices", color: "#8fb8a8" },
];

export function PreviewSection() {
  const [activeCard, setActiveCard] = React.useState<"dashboard" | "vehicles">("dashboard");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

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
        >          {/* Dashboard Preview */}
          <div
            onClick={() => setActiveCard("dashboard")}
            className={cn(
              "absolute left-1/2 rounded-xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer",
              activeCard === "dashboard"
                ? "top-0 w-full -translate-x-1/2 rotate-0 z-20 border-2 border-primary/40 shadow-[0_32px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                : "top-10 w-[95%] -translate-x-[calc(50%+60px)] rotate-[-3deg] z-10 border border-primary/10 shadow-xl opacity-60 hover:opacity-100 hover:-translate-y-2"
            )}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] dark:bg-[#1a1a1a] border-b border-primary/10 dark:border-primary/25">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <div className="w-2 h-2 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 ml-3 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-md px-2.5 py-0.5 text-[9px] font-medium text-muted-foreground/80 truncate">
                app.vehrep.com/dashboard
              </div>
            </div>
            <div className="w-full aspect-video relative bg-white dark:bg-black">
              <Image
                src={isDark ? "/images/landing%20page/previewdark.png" : "/images/landing%20page/preview.png"}
                alt="VehRep dashboard preview"
                fill
                priority
                quality={100}
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Vehicles Preview */}
          <div
            onClick={() => setActiveCard("vehicles")}
            className={cn(
              "absolute left-1/2 rounded-xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer",
              activeCard === "vehicles"
                ? "top-0 w-full -translate-x-1/2 rotate-0 z-20 border-2 border-primary/40 shadow-[0_32px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                : "top-10 w-[95%] -translate-x-[calc(50%-60px)] rotate-[3deg] z-10 border border-primary/10 shadow-xl opacity-60 hover:opacity-100 hover:-translate-y-2"
            )}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] dark:bg-[#1a1a1a] border-b border-primary/10 dark:border-primary/25">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <div className="w-2 h-2 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 ml-3 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-md px-2.5 py-0.5 text-[9px] font-medium text-muted-foreground/80 truncate">
                app.vehrep.com/inventory
              </div>
            </div>
            <div className="w-full aspect-video relative bg-white dark:bg-black">
              <Image
                src={isDark ? "/images/landing%20page/previewdark2.png" : "/images/landing%20page/preview2.png"}
                alt="VehRep vehicles page"
                fill
                quality={100}
                className="object-cover object-top"
              />
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
