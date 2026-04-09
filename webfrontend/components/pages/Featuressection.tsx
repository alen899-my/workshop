"use client";

import React from "react";
import Image from "next/image";

const features = [
  {
    num: "01",
    title: "Repair Management",
    desc: "Create job cards instantly. Track every repair from intake to delivery.",
    tags: "Job Cards · Milestones · Notes",
    image: "/images/landing page/repairmanagment.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
  {
    num: "02",
    title: "Vehicle Records",
    desc: "Full repair history per vehicle. Know what's due for next service.",
    tags: "History · Parts Log · Service Due",
    image: "/images/landing page/vehiclerecord.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
  {
    num: "03",
    title: "Customer Profiles",
    desc: "Store every customer's details, vehicle list, and contact info.",
    tags: "CRM · Search · Alerts",
    image: "/images/landing page/customermanagement.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
  {
    num: "04",
    title: "Worker Management",
    desc: "See who's working on what, right now. Balance workload and shifts.",
    tags: "Assignments · Workload",
    image: "/images/landing page/workersmangment.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
  {
    num: "05",
    title: "Bills & Invoices",
    desc: "Generate professional invoices in seconds. Add labour, and parts.",
    tags: "GST Bills · WhatsApp",
    image: "/images/landing page/invoice.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
  {
    num: "06",
    title: "Reports & Insights",
    desc: "Daily, weekly, monthly revenue. Top customers, busiest workers.",
    tags: "Revenue · Analytics",
    image: "/images/landing page/insights.jpg",
    className: "bg-card text-card-foreground border-border/50",
    textDescColor: "text-muted-foreground",
    numColor: "text-primary/40",
    tagColor: "text-primary",
    glowBg: "bg-primary/5 group-hover:bg-primary/10",
  },
];

export function FeaturesSection() {
  return (
    <section
      className="bg-background py-16 md:py-[100px] relative transition-colors duration-500"
    >
      {/* Top separator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-14">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary white-space-nowrap m-0 font-bold">
            Everything You Need to Run Your Garage
          </p>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/30 to-transparent" />
        </div>

        {/* Features grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
        >
          {features.map((f) => (
            <div
              key={f.num}
              className={`group relative pt-6 px-6 flex flex-col rounded-[12px] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${f.className} dark:bg-card/40 dark:backdrop-blur-sm`}
            >
              {/* Subtle inward glow */}
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${f.glowBg}`} />

              <div className="relative z-10 flex flex-col flex-1">
                <div
                  className={`font-mono text-[10px] tracking-[0.2em] mb-4 font-bold ${f.numColor}`}
                >
                  {f.num}
                </div>

                <div
                  className="font-sans text-[18px] md:text-[20px] font-bold mb-2 tracking-tight"
                >
                  {f.title}
                </div>

                <div
                  className={`font-sans text-[13px] md:text-[14px] leading-relaxed max-w-sm ${f.textDescColor}`}
                >
                  {f.desc}
                </div>

                <div
                  className={`inline-block mt-4 mb-6 font-sans text-[9px] tracking-[0.12em] uppercase opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300 font-black relative z-10 ${f.tagColor}`}
                >
                  <span className="opacity-50">→</span> {f.tags}
                </div>
              </div>

              {/* Bottom Image Section */}
              {f.image && (
                <div className="relative -mx-6 h-[140px] sm:h-[160px] lg:h-[180px] mt-auto">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-300 border-t border-primary/10 grayscale-[0.2] group-hover:grayscale-0"
                  />
                  {/* Dark overlay for images in dark mode */}
                  <div className="absolute inset-0 bg-background/10 dark:bg-background/20 pointer-events-none" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}