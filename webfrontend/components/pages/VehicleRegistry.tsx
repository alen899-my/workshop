"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

// Realistic / More Detailed SVG Icons for Vehicles
const VehicleIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Cycle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          <circle cx="18.5" cy="17.5" r="3.5" />
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="15" cy="5" r="1" />
          <path d="M15 11l-3-4V4m0 4l-4 4-2-2-4 4" />
          <path d="M5.5 17.5L8 12h7l2.5 5.5" />
          <path d="M12 12V7" />
        </svg>
      );
    case 'Motorbike':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <circle cx="6" cy="17" r="4" />
           <circle cx="18" cy="17" r="4" />
           <path d="M10 17h4" />
           <path d="M14 17l1-5h3" />
           <path d="M5 13l2-5h9l2 5" />
           <path d="M8 8V4h4" />
           <path d="M13 13l1-4" />
        </svg>
      );
    case 'Scooter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <circle cx="6" cy="18" r="3" />
           <circle cx="18" cy="18" r="3" />
           <path d="M6 15v-3h3l1-4h4" />
           <path d="M18 15v-7h-4" />
           <path d="M9 18h6" />
        </svg>
      );
    case 'Car':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 3c-.1.3-.2.6-.2.9v3c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'Jeep':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <rect x="2" y="10" width="20" height="8" rx="2" />
           <path d="M5 10l2-5h10l2 5" />
           <circle cx="7" cy="18" r="3" />
           <circle cx="17" cy="18" r="3" />
           <path d="M2 14h20" />
        </svg>
      );
    case 'Pickup':
       return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <path d="M2 17h3m14 0h3m-3-7v7m0-7H9l-2 5H2v2h5c0-1.7 1.3-3 3-3s3 1.3 3 3h4c0-1.7 1.3-3 3-3" />
           <circle cx="7" cy="17" r="2" />
           <circle cx="17" cy="17" r="2" />
           <path d="M13 10V5h6v5" />
        </svg>
       );
    case 'Auto':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <path d="M3 18l1-5h16l1 5" />
           <path d="M5 13V8h14v5" />
           <circle cx="6" cy="18" r="2" />
           <circle cx="18" cy="18" r="2" />
           <path d="M12 5V2h4" />
        </svg>
      );
    case 'Bus':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <rect x="2" y="5" width="20" height="12" rx="2" />
           <path d="M2 13h20" />
           <path d="M6 5v8" />
           <path d="M18 5v8" />
           <circle cx="6" cy="17" r="2" />
           <circle cx="18" cy="17" r="2" />
        </svg>
      );
    case 'Truck':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <path d="M2 17h3m11 0h3m-3-12h3v12H16V5z" />
           <rect x="2" y="8" width="14" height="9" />
           <circle cx="7" cy="17" r="2" />
           <circle cx="17" cy="17" r="2" />
           <path d="M16 13h6" />
        </svg>
      );
    case 'EV':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9" />
           <path d="M16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 3c-.1.3-.2.6-.2.9v3c0 .6.4 1 1 1h2" />
           <circle cx="7" cy="17" r="2" />
           <circle cx="17" cy="17" r="2" />
           <path d="M11 12l2-4h-3l2-4" className="stroke-primary" />
        </svg>
      );
    case 'Tractor':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <circle cx="7" cy="15" r="4" />
           <circle cx="18" cy="17" r="2" />
           <path d="M11 15h4v2" />
           <path d="M11 11h7v4" />
           <path d="M7 11V7h4" />
           <path d="M18 11l2-4h-4" />
        </svg>
      );
    default:
      return null;
  }
};

const vehicleLibrary = [
  { id: 'Cycle', label: 'Cycles', category: 'Two-Wheeler' },
  { id: 'Motorbike', label: 'Motorbikes', category: 'Two-Wheeler' },
  { id: 'Scooter', label: 'Scooters', category: 'Two-Wheeler' },
  { id: 'Car', label: 'Cars', category: 'Personal' },
  { id: 'Jeep', label: 'Jeeps / 4x4', category: 'Personal' },
  { id: 'Pickup', label: 'Pickups', category: 'Commercial' },
  { id: 'Auto', label: 'Auto Rickshaws', category: 'Commercial' },
  { id: 'Bus', label: 'Buses', category: 'Commercial' },
  { id: 'Truck', label: 'Trucks', category: 'Commercial' },
  { id: 'EV', label: 'EVs', category: 'Personal' },
  { id: 'Tractor', label: 'Tractors', category: 'Heavy' },
];

export function VehicleRegistry() {
  return (
    <section className="bg-background py-24 relative overflow-hidden transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="font-sans text-[clamp(32px,5vw,56px)] font-bold text-foreground leading-[1] tracking-tight mb-6">
            Two Wheeler, Four Wheeler, <br />
            <span className="text-primary ">Anything Managed.</span>
          </h2>
          <p className="font-sans text-[16px] text-muted-foreground leading-[1.7] max-w-2xl">
            From luxury sedans to heavy industrial excavators, our digital ecosystem is pre-configured to handle any machine in your shop.
          </p>
        </div>

        {/* Organized Grid System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: The Library (Grid) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-[3px] text-foreground">Vehicle Library</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {vehicleLibrary.map((v) => {
                 return (
                   <div 
                     key={v.id}
                     className="group flex flex-col items-center justify-center p-6 rounded-[24px] bg-primary border border-primary/20 shadow-[0_15px_35px_rgba(0,128,128,0.2)] hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                   >
                     <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                        <VehicleIcon type={v.id} />
                     </div>
                     <span className="text-white font-bold text-sm text-center mb-1">{v.label}</span>
                     <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">{v.category}</span>
                   </div>
                 );
               })}
               
               {/* Decorative "many more" Card */}
               <div className="flex flex-col items-center justify-center p-6 rounded-[24px] border border-dashed border-primary/20 bg-primary/[0.02] group hover:bg-primary/5 transition-all text-center">
                  <span className="text-primary font-black lowercase tracking-[1px] text-xs">and many more</span>
               </div>
            </div>
          </div>

          {/* Right: Feature Highlights (Details) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
             <div className="p-8 rounded-[32px] bg-muted/20 border border-border flex flex-col h-full justify-between group hover:bg-muted/30 transition-all">
                <div>
                   <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 font-bold text-xl">
                      ⚡
                   </div>
                   <h4 className="text-xl font-bold text-foreground mb-3 tracking-tight">Manage it with VehRep</h4>
                   <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                     If any of these vehicles are in your garage, you can manage them all with precision. Our system dynamically adapts to your workshop's unique requirements.
                   </p>
                </div>

                <button className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:gap-5 transition-all shadow-xl shadow-primary/20">
                   Start Managing Your Garage <ChevronRight size={18} />
                </button>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
