"use client";

import React from "react";
import Image from "next/image";

export function MarqueeSection() {
  const vehicles = [
    { name: "Sedans & Hatchbacks", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=120&fit=crop&q=80" },
    { name: "Motorcycles & Scooters", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&h=120&fit=crop&q=80" },
    { name: "SUVs & 4x4s", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=120&fit=crop&q=80" },
    { name: "Auto Rickshaws", image: "https://images.unsplash.com/photo-1503376713637-25e227dd1669?w=200&h=120&fit=crop&q=80" },
    { name: "Trucks & LCVs", image: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=200&h=120&fit=crop&q=80" },
    { name: "Electric Vehicles", image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=200&h=120&fit=crop&q=80" },
    { name: "Buses & Minivans", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=120&fit=crop&q=80" },
    { name: "Heavy Machinery", image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=200&h=120&fit=crop&q=80" },
    { name: "Delivery Vehicles", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=120&fit=crop&q=80" },
    { name: "Luxury Cars", image: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&h=120&fit=crop&q=80" },
  ];

  // Quadruple for perfect loop safety on massive ultra-wide monitors
  const list = [...vehicles, ...vehicles, ...vehicles, ...vehicles];

  return (
    <div className="w-full relative py-12 md:py-16 overflow-hidden bg-background border-b border-primary/10 flex flex-col justify-center transition-colors duration-500">
      
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
     

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-ltr {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-ltr {
           display: flex;
           width: max-content;
           animation: marquee-ltr 50s linear infinite;
        }
        .animate-marquee-ltr:hover {
           animation-play-state: paused;
        }
      `}} />

      {/* Fade masks */}
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-64 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-64 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Marquee Wrapper */}
      <div className="animate-marquee-ltr items-center flex-nowrap pl-4">
        {list.map((v, i) => (
            <div 
              key={i} 
              className="group flex flex-col md:flex-row items-center gap-3 md:gap-5 flex-shrink-0 cursor-pointer pr-16 md:pr-24"
            >
              <div className="w-24 h-16 md:w-36 md:h-24 rounded-[12px] overflow-hidden relative shadow-sm transition-all duration-700 ease-out group-hover:scale-105 group-hover:shadow-lg filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 dark:border dark:border-primary/20">
                <Image 
                  src={v.image} 
                  alt={v.name} 
                  fill 
                  sizes="150px"
                  className="object-cover" 
                />
              </div>
              <span className="font-sans font-bold text-[13px] md:text-[15px] text-foreground opacity-40 group-hover:opacity-100 group-hover:text-primary tracking-tight transition-all duration-700">
                {v.name}
              </span>
            </div>
        ))}
      </div>
    </div>
  );
}
