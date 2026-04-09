"use client";

import React from "react";
import Image from "next/image";
import { Wrench, Shield, Zap, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Smart Repair Management",
    description: "Go 100% paperless and never worry about losing a jobcard. Digitally track every repair's progress, manage multiple active jobs, and keep your workshop organized without the clutter of paper books.",
    icon: Wrench,
    image: "/images/landing%20page/repair.jpg",
    accent: "from-[#3d7a78] to-[#5bb0ae]"
  },
  {
    title: "Advanced Service Tracking",
    description: "Effortlessly manage routine services like professional washing, oil changes, and detailing. Log every service event into the vehicle's permanent digital history for complete transparency and easier billing.",
    icon: Shield,
    image: "/images/landing%20page/service.jpg",
    accent: "from-[#008080] to-[#20c997]"
  },
  {
    title: "Modification & Upgrades",
    description: "The ultimate tool for custom shops. Track every specific modification part installed, manage bespoke project timelines, and document high-end vehicle transformations with ease.",
    icon: Settings,
    image: "/images/landing%20page/modification.jpg",
    accent: "from-[#c0272d] to-[#ef4444]"
  },
  {
    title: "Digital Vehicle Inspections",
    description: "Instantly check and log the condition of any vehicle. Create clear digital health lists so you and your customers know exactly what is 'OK', all securely listed and searchable within the software.",
    icon: Zap,
    image: "/images/landing%20page/inspection.jpg",
    accent: "from-[#d4a017] to-[#fbbf24]"
  }
];

export function ServicesCarousel() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <section className="bg-background py-24 relative overflow-hidden transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <h2 className="font-sans text-[clamp(28px,4vw,44px)] font-bold text-foreground leading-[1.1] mb-6">
              The Modern Solution for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent ">Your Garage.</span>
            </h2>
            <p className="font-sans text-[16px] text-muted-foreground leading-[1.7] max-w-lg">
              Stop managing paperwork and start growing your business. From automated jobcards to digital health reports, our platform handles the entire lifecycle of your garage’s operations.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-90"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-90"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-none no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div 
                key={s.title}
                className="flex-shrink-0 w-[85vw] md:w-[420px] snap-start group"
              >
                <div className="relative h-[500px] rounded-[32px] overflow-hidden border border-border/50 bg-muted/20">
                  {/* Image Background */}
                  <Image 
                    src={s.image}
                    alt={s.title}
                    fill
                    className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Solid Theme Card Overlay */}
                  <div className="absolute inset-x-4 bottom-4 p-8 rounded-[24px] bg-primary shadow-[0_20px_50px_rgba(0,128,128,0.3)] border border-primary/20 transition-all duration-500 group-hover:translate-y-[-8px]">
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      {s.title}
                    </h3>
                    
                    <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                      {s.description}
                    </p>

                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 hover:gap-4 transition-all">
                      Learn More <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Top Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
