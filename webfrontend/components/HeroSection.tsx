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
    <section className="relative w-full min-h-screen overflow-hidden bg-background">
      <style dangerouslySetInnerHTML={{ __html: animationCSS }} />

      {/* Mobile background */}
      <div className="absolute inset-0 block sm:hidden">
        <Image
          src="/images/landing%20page/workshopmobile-screen.jpg"
          alt="Vehicle repair workshop"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center dark:hidden"
        />
        <Image
          src="/images/landing%20page/workshopmobile-screen-dark.png"
          alt="Vehicle repair workshop dark"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center hidden dark:block"
        />
      </div>

      {/* Desktop background */}
      <div className="absolute inset-0 hidden sm:block bg-black">
        <Image
          src="/images/landing%20page/workshoplarger-screen.jpg"
          alt="Vehicle repair workshop"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center dark:hidden"
        />
        {/* Desktop-specific dark mode image - using contain to show full image */}
        <Image
          src="/images/landing%20page/dark.png"
          alt="Vehicle repair workshop dark"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-contain object-center hidden dark:block"
        />
      </div>

      {/* Overlays for depth and readability (deepened for cinematic effect) */}
      {/* 1. Base dark cinematic gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40 dark:from-black dark:via-black/85 dark:to-black/60" />
      
      {/* 2. Top fade for navbar grounding */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black via-black/60 to-transparent opacity-90" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 min-h-screen flex flex-col justify-center pt-32 pb-20">

        {/* Eyebrow */}
        <p className="h-a1 font-mono text-xs tracking-[0.25em] uppercase text-primary mb-5">
          Vehicle Repair Garage Management
        </p>

        {/* Main headline */}
        <h1 className="h-a2 font-mono font-bold text-white leading-[1.08] tracking-tight mb-6 text-4xl sm:text-5xl lg:text-6xl max-w-2xl">
          Keep Track of Every{" "}
          <span className="text-primary">Repair</span>{" "}
          Coming Into Your Garage.
        </h1>

        {/* Subtext */}
        <p className="h-a3 font-mono text-sm sm:text-base leading-relaxed text-white/70 max-w-lg mb-10">
          Know which vehicle is in, what work is being done, who is working on it,
          and when it will be ready — all in one place. No paperwork, no confusion.
        </p>

        {/* CTAs */}
        <div className="h-a4 flex flex-wrap items-center gap-4 mb-16">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 px-7 py-3 font-mono text-sm tracking-widest uppercase font-semibold bg-primary text-primary-foreground rounded-sm transition-all duration-300 hover:shadow-[0_0_20px_var(--primary)/0.45]"
          >
            Create for Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="tel:+919946652438"
            className="inline-flex items-center gap-2 px-7 py-3 font-mono text-sm tracking-widest uppercase font-semibold bg-white/5 backdrop-blur-md border border-white/20 hover:border-white/50 text-white rounded-sm transition-all duration-300 hover:bg-white/10"
          >
            <Phone className="w-4 h-4" />
            Call Support
          </Link>
        </div>

      </div>
    </section>
  );
}