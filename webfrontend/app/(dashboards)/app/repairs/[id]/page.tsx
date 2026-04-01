"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { repairService, Repair } from "@/services/repair.service";
import { billService } from "@/services/bill.service";
import Loading from "../../loading";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { 
  Wrench, 
  User, 
  Car, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Building2,
  ChevronLeft,
  ImageIcon,
  ClipboardList,
  Receipt,
  Calculator,
  Tag
} from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function RepairDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [repair, setRepair] = useState<Repair | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      setLoading(true);
      const [rRes, bRes] = await Promise.all([
        repairService.getById(id),
        billService.getByRepairId(id)
      ]);
      if (rRes.success) setRepair(rRes.data || null);
      if (bRes.success) setBill(bRes.data || null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Loading />;
  if (!repair) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
       <AlertCircle size={48} className="text-red-500 opacity-20" />
       <h2 className="text-xl font-bold tracking-tight">Repair Job Not Found</h2>
       <p className="text-muted-foreground text-sm">The job record you are looking for might have been moved or removed.</p>
       <WorkshopButton variant="outline" onClick={() => router.back()}>Go Back</WorkshopButton>
    </div>
  );

  return (
    <ModuleLayout
      title={`Job Card #${repair.id}`}
      description="Detailed technical report and repair status overview."
      backUrl="/app/repairs"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Hero Section: Vehicle Image */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl bg-muted/20 group">
             {repair.vehicle_image ? (
                <Image 
                  src={repair.vehicle_image} 
                  alt="Vehicle Profile" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
             ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/30">
                   <Car size={64} strokeWidth={1} />
                   <span className="text-xs font-bold uppercase tracking-widest">No visual record available</span>
                </div>
             )}
             
             {/* Dynamic Status Pin */}
             <div className={cn(
                "absolute top-6 right-6 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-2",
                repair.status === 'Completed' ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-orange-500/80 text-white border-orange-400"
             )}>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{repair.status}</span>
             </div>
          </div>

          {/* Complains & Notes */}
          <div className="flex flex-col gap-6 p-8 rounded-3xl border border-border bg-card shadow-sm">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                   <ClipboardList size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Reported Complaints</h3>
             </div>
             
             <div className="flex flex-col gap-3">
                {Array.isArray(repair.complaints) ? repair.complaints.map((c: any, i: number) => (
                   <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border group">
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border",
                        c.status === 'fixed' ? "bg-emerald-500 text-white border-emerald-600" : "bg-muted border-border"
                      )}>
                         {c.status === 'fixed' ? <CheckCircle2 size={12} /> : <Clock size={12} className="text-muted-foreground" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                         <span className={cn("text-sm font-bold text-foreground", c.status === 'fixed' && "line-through opacity-50")}>
                            {c.text || c.complaint || "Technical Issue"}
                         </span>
                         <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {c.status === 'fixed' ? "Resolved" : "Pending Inspection"}
                         </span>
                      </div>
                   </div>
                )) : (
                   <div className="p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground opacity-40">
                      <p className="text-sm font-medium italic">No specific complaints recorded for this job.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Billing Summary */}
          <div className="flex flex-col gap-6 p-8 rounded-3xl border border-border bg-card shadow-sm">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Receipt size={20} />
                   </div>
                   <h3 className="text-lg font-black tracking-tight uppercase">Cost Summary</h3>
                </div>
                {bill && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      Invoice Generated
                   </span>
                )}
             </div>

             {bill && bill.items?.length > 0 ? (
                <div className="flex flex-col gap-5">
                   <div className="flex flex-col border border-border rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-4 bg-muted/50 border-b border-border p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                         <div className="col-span-2 px-2">Description</div>
                         <div className="text-center">Qty</div>
                         <div className="text-right px-2">Amount</div>
                      </div>
                      <div className="flex flex-col divide-y divide-border/50">
                         {bill.items.map((item: any, i: number) => (
                            <div key={i} className="grid grid-cols-4 p-4 text-xs group hover:bg-muted/30 transition-colors">
                               <div className="col-span-2 px-1 font-bold text-foreground">{item.name}</div>
                               <div className="text-center font-medium text-muted-foreground">x{item.qty}</div>
                               <div className="text-right px-1 font-black text-foreground">₹{Number(item.cost * item.qty).toLocaleString()}</div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="flex flex-col gap-3 p-6 rounded-2xl bg-muted/20 border border-border">
                      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                         <span className="uppercase tracking-widest">Parts Subtotal</span>
                         <span>₹{bill.items.reduce((acc: number, item: any) => acc + (item.cost * item.qty), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                         <span className="uppercase tracking-widest">Technician Fee</span>
                         <span>₹{Number(bill.service_charge || 0).toLocaleString()}</span>
                      </div>

                      {/* Tax Breakdown */}
                      {bill.tax_snapshot && Array.isArray(bill.tax_snapshot) && bill.tax_snapshot.length > 0 && (
                        <>
                          <div className="h-px bg-border/30 my-0.5" />
                          {bill.tax_snapshot.map((t: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs font-bold text-emerald-700">
                              <span className="uppercase tracking-widest flex items-center gap-2">
                                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-black">TAX</span>
                                {t.name} ({t.rate}%){t.is_inclusive ? ' [Incl.]' : ''}
                              </span>
                              <span>₹{Number(t.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      )}

                      <div className="h-px bg-border/50 my-1" />
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <Calculator size={16} className="text-primary" />
                            <span className="text-sm font-black uppercase tracking-tighter text-foreground">Grand Total</span>
                         </div>
                         <span className="text-xl font-black text-primary">₹{Number(bill.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {bill.tax_total > 0 && (
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-right">
                          Includes ₹{Number(bill.tax_total).toFixed(2)} in taxes
                        </p>
                      )}
                   </div>
                </div>
             ) : (
                <div className="p-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-4 bg-muted/5 group">
                   <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500">
                      <Tag size={32} />
                   </div>
                   <div className="flex flex-col items-center gap-1.5 text-center px-6">
                      <span className="text-xs font-black uppercase tracking-[3px] text-foreground">No Billing Data</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                        Parts and labor costs haven't been recorded yet.<br/>
                        <span className="text-primary hover:underline cursor-pointer" onClick={() => router.push(`/app/repairs/bill/${repair.id}`)}>Click to generate invoice</span>
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Registry Details & Stakeholders */}
        <div className="flex flex-col gap-6">
           
           {/* Summary Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-1">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Job Date</span>
                 <span className="text-sm font-black text-foreground">{repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-1">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Service</span>
                 <span className="text-sm font-black text-foreground">{repair.service_type || 'General'}</span>
              </div>
           </div>

           {/* Vehicle Block */}
           <div className="p-6 rounded-3xl bg-muted/40 border border-border flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                 <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary border border-border shadow-sm">
                    <Car size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-foreground tracking-tighter">{repair.vehicle_number}</span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{repair.model_name} • {repair.vehicle_type}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-muted-foreground" />
                       <span className="text-xs font-bold text-muted-foreground">Owner</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{repair.owner_name}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Phone size={14} className="text-muted-foreground" />
                       <span className="text-xs font-bold text-muted-foreground">Phone</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{repair.phone_number}</span>
                 </div>
              </div>
           </div>

           {/* Assignment Block */}
           <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tech Assignment</span>
              
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                    <Wrench size={24} strokeWidth={1.5} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Attending Worker</span>
                    <span className="text-sm font-black text-foreground">{repair.attending_worker_name || "Self Managed"}</span>
                 </div>
              </div>

              <div className="mt-2 pt-4 border-t border-border flex items-center gap-3">
                 <Building2 size={16} className="text-muted-foreground opacity-40" />
                 <span className="text-xs font-bold text-muted-foreground">{repair.shop_name || "Main Workshop"}</span>
              </div>
           </div>

           {/* Actions */}
           <div className="flex flex-col gap-3 pt-4">
              <WorkshopButton 
                 variant="primary" 
                 className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                 onClick={() => router.push(`/app/repairs/bill/${repair.id}`)}
              >
                  {bill ? "Edit Bill Details" : "Create Final Bill"}
              </WorkshopButton>
              <WorkshopButton 
                 variant="outline" 
                 className="w-full h-12 text-sm font-bold uppercase tracking-widest"
                 onClick={() => router.push(`/app/repairs/edit/${repair.id}`)}
              >
                  Edit Service Info
              </WorkshopButton>
           </div>

        </div>

      </div>
    </ModuleLayout>
  );
}
