"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

const animationCSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .h-a1 { animation: fadeInUp 0.5s ease both; }
  .h-a2 { animation: fadeInUp 0.55s 0.12s ease both; }
  .h-a3 { animation: fadeInUp 0.55s 0.22s ease both; }
  .h-a4 { animation: fadeInUp 0.55s 0.32s ease both; }
  .h-a5 { animation: fadeInUp 0.55s 0.42s ease both; }
`;

const stats = [
  { value: "300+", label: "Shops Using VehRep" },
  { value: "Daily", label: "Repair Tracking" },
  { value: "Free", label: "To Get Started" },
];

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: animationCSS }} />

      {/* Mobile background */}
      <div className="absolute inset-0 block sm:hidden">
        <Image
          src="/images/landing page/workshopmobile-screen.jpg"
          alt="Vehicle repair workshop"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Desktop background */}
      <div className="absolute inset-0 hidden sm:block">
        <Image
          src="/images/landing page/workshoplarger-screen.jpg"
          alt="Vehicle repair workshop"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Dark overlay — heavier on left for text, lighter on right to show the shop */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 min-h-screen flex flex-col justify-center pt-28 pb-16">

        {/* Eyebrow */}
        <p className="h-a1 font-mono text-xs tracking-[0.25em] uppercase text-accent mb-5">
          Vehicle Repair Shop Management
        </p>

        {/* Main headline — plain, direct, no fluff */}
        <h1 className="h-a2 font-mono font-bold text-white leading-[1.08] tracking-tight mb-6 text-4xl sm:text-5xl lg:text-6xl max-w-2xl">
          Keep Track of Every{" "}
          <span className="text-accent">Repair</span>{" "}
          Coming Into Your Shop.
        </h1>

        {/* Subtext — speaks directly to the workshop owner */}
        <p className="h-a3 font-mono text-sm sm:text-base leading-relaxed text-white/70 max-w-lg mb-10">
          Know which vehicle is in, what work is being done, who is working on it,
          and when it will be ready — all in one place. No paperwork, no confusion.
        </p>

        {/* CTAs */}
        <div className="h-a4 flex flex-wrap items-center gap-4 mb-16">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3 font-mono text-sm tracking-widest uppercase font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm transition-all duration-200 hover:shadow-[0_0_20px_var(--primary)/0.45]"
          >
            Create for Free
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="tel:+91XXXXXXXXXX"
            className="inline-flex items-center gap-2 px-7 py-3 font-mono text-sm tracking-widest uppercase font-semibold bg-transparent border border-white/40 hover:border-white/70 text-white/80 hover:text-white rounded-sm transition-all duration-200"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </Link>
        </div>

        {/* Stats — simple, credible */}
        <div className="h-a5 flex flex-wrap gap-10 sm:gap-14 border-t border-white/10 pt-8">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono font-bold text-xl sm:text-2xl text-white">{s.value}</p>
              <p className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-white/45 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}