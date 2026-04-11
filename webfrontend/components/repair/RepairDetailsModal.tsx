"use client";

import React, { useState } from "react";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { billService } from "@/services/bill.service";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { useCurrency } from "@/lib/currency";
import {
  Calendar, FileText, Receipt, ShieldCheck, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface RepairDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repair: any;
  currencyCode?: string;
  mode?: 'full' | 'bill';
}

export function RepairDetailsModal({ 
  isOpen, 
  onClose, 
  repair, 
  currencyCode = 'INR',
  mode = 'full'
}: RepairDetailsModalProps) {
  const { symbol } = useCurrency({ shopCurrency: currencyCode });
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && repair?.id) {
      // If we are in bill mode and the repair object already has bill details (like from InvoicesClient)
      // we might not need to fetch again, but it's safer to fetch or use provided data.
      // In InvoicesClient, the 'repair' passed is actually a Bill object.
      if (mode === 'bill' && repair.items) {
        setSelectedBill(repair);
      } else {
        billService.getByRepairId(repair.id).then((res) => {
          if (res.success && res.data) {
            setSelectedBill(res.data);
          }
        });
      }
    }
  }, [isOpen, repair?.id, mode, repair]);

  /** Download PDF via Puppeteer-rendered backend route — streams blob directly */
  const handleDownloadPdf = async () => {
    if (!repair?.id) return;
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('workshop_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/repairs/${repair.id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `invoice_${repair.vehicle_number || 'repair'}_${repair.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!repair?.id) return;
    setShareLoading(true);
    try {
      const token = localStorage.getItem("workshop_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repairs/${repair.id}/pdf?action=store`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) throw new Error("Failed");

      let shopName = "our workshop";
      const sessionStr = localStorage.getItem("workshop_user");
      if (sessionStr) {
        try {
          const user = JSON.parse(sessionStr);
          if (user.shop_name) shopName = user.shop_name;
        } catch (e) {}
      }

      let phoneStr = repair.phone_number || repair.owner_phone || "";
      let phoneClean = phoneStr.replace(/\D/g, '');

      let amountStr = "";
      if (selectedBill && selectedBill.total_amount) {
        amountStr = `The total amount is ${symbol}${Number(selectedBill.total_amount).toFixed(2)}. `;
      }

      const text = encodeURIComponent(`Hello! Your repair at ${shopName} is completed. ${amountStr}The detailed bill is attached to the link below:\n\n${data.url}\n\nPlease come to pick up your vehicle as soon as possible. Thank you!`);
      const whatsappUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setShareLoading(false);
    }
  };

  if (!repair) return null;

  const isBillOnly = mode === 'bill';

  return (
    <WorkshopModal
      isOpen={isOpen}
      onClose={onClose}
      title={isBillOnly ? "Invoice Details" : "Repair Details"}
      subtitle={isBillOnly 
        ? `Viewing billing information for ${repair.vehicle_number}.` 
        : `Viewing detailed information for ${repair.vehicle_number || 'repair job'}.`}
      footer={
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <WorkshopButton variant="outline" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading} className="w-full sm:w-auto">
              {pdfLoading ? "Processing..." : "Download PDF"}
            </WorkshopButton>
            <WorkshopButton variant="outline" size="sm" onClick={handleShareWhatsApp} disabled={shareLoading} className="w-full sm:w-auto">
              {shareLoading ? "Generating..." : "Share via WhatsApp"}
            </WorkshopButton>
          </div>
          <WorkshopButton variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Close
          </WorkshopButton>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {!isBillOnly && repair.vehicle_image && (
          <button 
            type="button" 
            className="w-full h-48 relative rounded-xl overflow-hidden border group/img"
          >
            <Image src={repair.vehicle_image} alt="Vehicle" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center">
              <p className="text-[10px] text-white font-black uppercase tracking-[3px]">View Full Image</p>
            </div>
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vehicle No</p>
            <p className="text-sm font-bold text-foreground">{repair.vehicle_number}</p>
          </div>
          {!isBillOnly && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vehicle Type / Model</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const v = VEHICLE_CONFIG.find(vc => vc.id === repair.vehicle_type);
                  if (v) {
                    const Icon = v.icon;
                    return <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: v.color }}><Icon size={14} /></div>;
                  }
                  return null;
                })()}
                <p className="text-sm font-bold text-foreground">
                  {repair.vehicle_type || 'Car'} {repair.model_name ? `- ${repair.model_name}` : ''}
                </p>
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Owner Name</p>
            <p className="text-sm font-bold text-foreground">{repair.owner_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Payment Status</p>
            <WorkshopBadge 
              variant={(repair.payment_status || 'Unpaid') === 'Paid' ? 'success' : 'warning'} 
              size="xs"
              dot
            >
              {repair.payment_status || 'Unpaid'}
            </WorkshopBadge>
          </div>
          {!isBillOnly && (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
                <p className="text-sm font-bold text-foreground">{repair.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Service Type</p>
                <WorkshopBadge variant="primary" size="xs">
                  {repair.service_type || 'Repair'}
                </WorkshopBadge>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <WorkshopBadge 
                  variant={
                    repair.status === 'Completed' ? 'success' : 
                    repair.status === 'In Progress' ? 'warning' :
                    repair.status === 'Started' ? 'info' : 'secondary'
                  } 
                  size="xs"
                >
                  {repair.status || 'Pending'}
                </WorkshopBadge>
              </div>
            </>
          )}
        </div>

        {!isBillOnly && (
          <>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
                <Calendar size={12} className="mr-1" /> Schedule
              </p>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm font-medium text-foreground">
                  {repair.repair_date
                    ? (() => { const d = new Date(repair.repair_date); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; })()
                    : 'Not scheduled'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
                <User size={12} className="mr-1" /> Assigned Worker
              </p>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm font-medium text-foreground">{repair.attending_worker_name || 'Unassigned'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
                <FileText size={12} className="mr-1" /> Job Card Details
              </p>
              {(() => {
                let parsed: any = repair.complaints;
                if (typeof parsed === 'string') {
                  try { parsed = JSON.parse(parsed); } catch (e) { /* ignore */ }
                }

                const labelMap: Record<string, string> = {
                  "Repair": "Repair Details",
                  "Servicing": "Service List",
                  "Inspection": "Inspection Checklist",
                  "Modification": "Modification Plan",
                  "Other": "Other Requests"
                };

                const isBlockFormat = Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'type' in parsed[0];

                if (isBlockFormat) {
                  return (
                    <div className="space-y-6">
                      {parsed.map((block: any, bIdx: number) => (
                        <div key={bIdx} className="border-l-4 border-primary pl-4 py-1">
                          <p className="text-[10px] font-black uppercase tracking-[2px] text-primary mb-3">
                            {labelMap[block.type] || block.type + " Details"}
                          </p>
                          <div className="flex flex-col gap-2">
                            {block.tasks.length === 0 && <p className="text-xs text-muted-foreground italic">No specific tasks added.</p>}
                            {block.tasks.map((t: any, tIdx: number) => (
                              <div key={tIdx} className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-all",
                                t.fixed ? "bg-green-500/5 border-green-500/10" : "bg-muted/30 border-border"
                              )}>
                                {t.fixed ? (
                                  <ShieldCheck size={12} className="text-green-500" strokeWidth={3} />
                                ) : (
                                  <div className="w-3 h-3 rounded-none border border-muted-foreground/30" />
                                )}
                                <span className={cn(
                                  "text-sm font-medium",
                                  t.fixed ? "line-through text-muted-foreground/60" : "text-foreground"
                                )}>
                                  {t.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (Array.isArray(parsed) && parsed.length > 0) {
                  return (
                    <div className="flex flex-col gap-2">
                      {parsed.map((c: any, i: number) => {
                        const isFixed = typeof c === 'object' ? c.fixed : false;
                        const text = typeof c === 'object' ? c.text : c;
                        return (
                          <div key={i} className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border transition-all",
                            isFixed ? "bg-green-500/5 border-green-500/10" : "bg-muted/30 border-border"
                          )}>
                            {isFixed ? (
                              <ShieldCheck size={12} className="text-green-500" strokeWidth={3} />
                            ) : (
                              <div className="w-3 h-3 rounded-none border border-muted-foreground/30" />
                            )}
                            <span className={cn(
                              "text-sm font-medium",
                              isFixed ? "line-through text-muted-foreground/60" : "text-foreground"
                            )}>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return <p className="text-xs text-muted-foreground italic">No job details recorded.</p>;
              })()}
            </div>
          </>
        )}

        {selectedBill && (selectedBill.items?.length > 0 || selectedBill.service_charge > 0) && (
          <div className={cn("mt-2", !isBillOnly && "pt-4 border-t border-border")}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
              <Receipt size={12} className="mr-1" /> Bill Details
            </p>

            {selectedBill.items?.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {selectedBill.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs text-foreground bg-muted/10 p-2 rounded-md border border-border">
                    <span className="font-medium">{item.name} <span className="text-muted-foreground">x{item.qty}</span></span>
                    <span className="font-mono">{symbol}{(item.cost * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-1">
              <span>Service Charge</span>
              <span className="font-mono">{symbol}{Number(selectedBill.service_charge || 0).toFixed(2)}</span>
            </div>

            {selectedBill.tax_snapshot && Array.isArray(selectedBill.tax_snapshot) && selectedBill.tax_snapshot.length > 0 && (
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-border/50">
                {selectedBill.tax_snapshot.map((t: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-bold text-emerald-600">
                    <span className="uppercase tracking-widest">{t.name} ({t.rate}%){t.is_inclusive ? ' [Incl.]' : ''}</span>
                    <span className="font-mono">{symbol}{Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold text-primary pt-2 border-t border-border mt-2">
              <div className="flex flex-col">
                <span>Total Amount</span>
                {(selectedBill.tax_total || 0) > 0 && (
                  <span className="text-[9px] font-medium text-emerald-600/80">Incl. {symbol}{Number(selectedBill.tax_total).toFixed(2)} tax</span>
                )}
              </div>
              <span className="font-mono">{symbol}{Number(selectedBill.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </WorkshopModal>
  );
}