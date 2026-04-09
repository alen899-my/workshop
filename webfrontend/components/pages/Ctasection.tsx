"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle2, Star, Quote } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { cn } from "@/lib/utils";

const metrics = [
  { val: "300+", label: "Garages on Platform" },
  { val: "12K+", label: "Repairs Tracked" },
  { val: "₹0", label: "To Get Started" },
  { val: "5min", label: "Setup Time" },
];

const testimonials = [
  {
    quote:
      "Earlier I used to forget which vehicle is whose. Now I open VehRep in the morning and everything is right there — who's working on what, what's ready, what needs parts.",
    name: "Rajan Suresh",
    role: "Owner, Rajan Motors — Thrissur",
    initials: "RS",
    color: "#3d7a78",
    bg: "rgba(61,122,120,0.1)",
  },
  {
    quote:
      "The billing part alone saved me so much time. I generate the invoice, share on WhatsApp, done. Customers also trust it more because it looks professional.",
    name: "Abdul Majeed",
    role: "Owner, AM Auto Works — Kozhikode",
    initials: "AM",
    color: "#7ab4cc",
    bg: "rgba(122,180,204,0.12)",
  },
  {
    quote:
      "My mechanics know what job they have each morning. No more me running around telling everyone. I can actually focus on customers instead of managing chaos.",
    name: "Priya Thomas",
    role: "Owner, PT Service Center — Ernakulam",
    initials: "PT",
    color: "#d4a017",
    bg: "rgba(212,160,23,0.12)",
  },
];

export function CTASection() {
  return (
    <section
      className="bg-background py-16 md:py-[100px] relative overflow-hidden transition-colors duration-500"
    >
      {/* Top separator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      <div className="max-w-[1100px] mx-auto px-4 md:px-8">

        {/* ── Ultra-Modern Metrics Strip ── */}
        <div className="relative mb-32 w-full py-16 md:py-24 border-y border-primary/10 overflow-hidden">
          {/* Sweep animation injected to avoid external config edits */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes sweep {
              0% { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
            .animate-sweep {
              background-size: 200% auto;
              animation: sweep 5s linear infinite;
            }
          `}} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-4 md:gap-4 relative z-10 w-full">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="group relative flex flex-col items-center justify-center text-center cursor-default w-full"
              >
                <div
                  className="relative font-sans text-[44px] md:text-[60px] lg:text-[76px] font-black leading-none tracking-tighter"
                >
                  <span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#7ab4cc] to-primary dark:from-primary dark:via-accent-foreground dark:to-primary animate-sweep inline-block transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
                  >
                    {m.val}
                  </span>
                </div>
                
                {/* Metric Label */}
                <div className="mt-4 md:mt-2 px-6 py-2 rounded-full border border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-all duration-[600ms] group-hover:shadow-[0_0_20px_var(--primary)/0.1] relative overflow-hidden">
                   {/* Light sweep animation inside the pill on hover */}
                   <div className="absolute inset-y-0 -inset-x-[100%] -translate-x-[150%] group-hover:translate-x-[150%] bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-[1.5s] ease-in-out pointer-events-none" />
                   
                  <span className="font-mono text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.15em] sm:tracking-[0.25em] uppercase text-foreground opacity-50 group-hover:text-primary group-hover:opacity-100 transition-colors duration-[600ms] font-bold text-center block">
                    {m.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Editorial Testimonials ── */}
        <div className="mb-32">
          {/* Section Header */}
          <div className="flex flex-col items-center mb-16 md:mb-24 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-card/50 dark:bg-card/30 mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
                  Trusted by 300+ Garages
                </span>
             </div>
             <h2 className="font-sans text-[28px] md:text-[36px] lg:text-[42px] font-bold text-foreground tracking-tight max-w-[600px] leading-[1.2]">
               Built for mechanics, by the people who know garages best.
             </h2>
          </div>

          {/* Interactive Focus Grid */}
          <div className="group/testi flex flex-col md:flex-row gap-12 md:gap-0">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`flex-1 relative flex flex-col md:px-10 group-hover/testi:opacity-30 group-hover/testi:blur-[2px] hover:!blur-none hover:!opacity-100 transition-all duration-700 ease-out hover:-translate-y-2 
                  ${i !== 0 ? 'md:border-l border-primary/15 border-t pt-10 md:pt-0 md:border-t-0' : 'pt-10 md:pt-0 md:pl-0'}
                  ${i === testimonials.length - 1 ? 'md:pr-0' : ''}
                `}
              >
                {/* Abstract floating quote mark */}
                <div className="absolute top-0 left-0 md:left-6 text-[80px] font-serif text-primary opacity-10 leading-none -translate-y-4 md:-translate-y-6 select-none pointer-events-none">
                  "
                </div>

                <div className="flex gap-0.5 mb-8 text-[#d4a017] text-[12px]">
                  ★★★★★
                </div>

                <blockquote className="font-sans text-[15px] italic text-foreground/70 dark:text-muted-foreground leading-relaxed transition-colors duration-500 mb-12 relative z-10">
                  "{t.quote}"
                </blockquote>

                <div className="mt-auto flex items-center gap-4 pt-6 relative before:absolute before:top-0 before:left-0 before:w-12 before:h-[1px] before:bg-primary/20">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-sans font-bold text-[12px] text-white shadow-md shadow-black/5"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-[14px] text-foreground tracking-tight">
                      {t.name}
                    </div>
                    <div className="font-sans text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-1">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Final CTA box ── */}
        <div className="relative overflow-hidden rounded-[24px] p-12 md:p-16 text-center shadow-2xl border border-primary/20 bg-card/60 dark:bg-card/20 backdrop-blur-xl transition-all duration-500">
          
          {/* Decorative glow blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />

          <div
            className="inline-block px-4 py-1.5 border border-primary/30 dark:border-primary/20 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-6 shadow-sm relative z-10 font-bold"
          >
            Free to Start — No Credit Card
          </div>

          <h2 className="relative z-10 font-mono text-[28px] md:text-[44px] font-bold text-foreground leading-[1.2] mb-8 tracking-tight uppercase italic">
            Ready to Accelerate Your <br className="hidden md:block" />
            <span className="text-primary">Workshop Growth?</span>
          </h2>
          
          <p className="relative z-10 font-mono text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto mb-12 leading-relaxed tracking-wider">
            Join 300+ workshops in Kerala who have already ditched the paperwork and embraced the digital future with WorkshopPro.
          </p>

          <div className="h-auto flex flex-wrap items-center justify-center gap-4 relative z-10 transition-all duration-500">
            <Link href="/signup" className="flex-1 sm:flex-none">
              <WorkshopButton
                variant="primary"
                size="lg"
                fullWidth
                className="!font-mono !text-[11px] !tracking-[0.25em] !uppercase !py-4 !px-12 !rounded-sm shadow-[0_12px_24px_var(--primary)/0.25] hover:shadow-[0_16px_32px_var(--primary)/0.35] transition-all"
              >
                Ready to Start
              </WorkshopButton>
            </Link>

            <Link
              href="tel:+918921837945"
              className={cn(
                "inline-flex items-center justify-center gap-3 px-10 py-4 font-mono text-[11px] tracking-[0.25em] uppercase font-bold rounded-sm transition-all duration-300",
                "bg-secondary/10 dark:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-secondary/20 dark:hover:bg-white/10"
              )}
            >
              <Phone className="w-4 h-4" />
              Call Support
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-muted-foreground/50 text-[10px] tracking-[0.2em] uppercase font-mono font-bold relative z-10">
            <span>Setup in 5 minutes</span>
            <span className="w-1 h-1 rounded-full bg-primary/30" />
            <span>Works on mobile</span>
            <span className="w-1 h-1 rounded-full bg-primary/30" />
            <span>No training needed</span>
          </div>
        </div>

      </div>
    </section>
  );
}