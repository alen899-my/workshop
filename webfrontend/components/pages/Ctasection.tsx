"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle2, Star, Quote } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { cn } from "@/lib/utils";

const metrics = [
  { val: "300+", label: "Garages on Platform" },
  { val: "12K+", label: "Repairs Tracked" },
  { val: "₹0", label: "To Get Started" },
  { val: "1min", label: "Setup Time" },
];

/**
 * A highly performant counter that animates from 0 to target
 * Handles prefixes (like ₹) and suffixes (like K+, min, +)
 */
function Counter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Parse the value: extract number, prefix, and suffix
  const numericMatch = value.match(/(\d+)/);
  const target = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const prefix = value.split(numericMatch ? numericMatch[0] : "")[0] || "";
  const suffix = value.split(numericMatch ? numericMatch[0] : "")[1] || "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easing * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return (
    <span ref={countRef}>
      {prefix}{count}{suffix}
    </span>
  );
}

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
    color: "#5bb0ae",
    bg: "rgba(91,176,174,0.12)",
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">

        {/* ── Ultra-Modern Metrics Strip ── */}
        <div className="relative mb-32 w-full py-16 md:py-24 border-y border-primary/10 dark:border-primary/25 overflow-hidden">
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
                    className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#5bb0ae] to-primary animate-sweep inline-block transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
                  >
                    <Counter value={m.val} />
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
             <h2 className="font-sans text-[clamp(24px,4vw,42px)] font-bold text-foreground tracking-tight max-w-3xl leading-[1.2]">
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
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] px-6 py-16 md:px-16 md:py-24 text-center border border-primary/20 bg-card/40 dark:bg-card/20 backdrop-blur-2xl transition-all duration-500 shadow-[0_32px_64px_-16px_rgba(0,128,128,0.15)]">
          
          {/* Decorative glow blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 font-mono text-[10px] tracking-[0.25em] uppercase text-primary mb-8 relative z-10 font-bold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Free to Start — No Credit Card
          </div>

          <h2 className="relative z-10 font-sans text-[clamp(28px,6vw,56px)] font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
            Ready to Accelerate Your <br className="hidden sm:block" />
            <span className="text-primary italic">Workshop Growth?</span>
          </h2>
          
          <p className="relative z-10 font-sans text-muted-foreground text-[15px] md:text-[18px] max-w-2xl mx-auto mb-12 leading-relaxed">
            Join 300+ workshops in Kerala who have already ditched the paperwork and embraced the digital future with WorkshopPro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <Link href="/signup" className="w-full sm:w-auto">
              <WorkshopButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto !font-sans !font-bold !text-[15px] !py-6 !px-12 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Start Your 1 Month Free Trial
              </WorkshopButton>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-10 border-t border-primary/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground/60 text-[11px] tracking-wide font-sans font-medium relative z-10">
            <div className="flex items-center gap-2">
               <CheckCircle2 size={14} className="text-primary/60" /> Setup in 5 minutes
            </div>
            <div className="flex items-center gap-2">
               <CheckCircle2 size={14} className="text-primary/60" /> Works on mobile
            </div>
            <div className="flex items-center gap-2">
               <CheckCircle2 size={14} className="text-primary/60" /> No training needed
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

