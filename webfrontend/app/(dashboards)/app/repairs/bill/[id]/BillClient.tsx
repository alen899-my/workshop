"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { useToast } from "@/components/ui/WorkshopToast";
import { billService, BillItem } from "@/services/bill.service";
import { taxService, TaxSetting } from "@/services/tax.service";
import { Plus, Trash2, PenTool, Calculator, Receipt, Package, ToggleLeft, ToggleRight, Info, Percent } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { cn } from "@/lib/utils";

interface BillClientProps {
  id: string;
  initialRepair: any;
  initialBill: any;
}

export default function BillClient({ id, initialRepair, initialBill }: BillClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BillItem[]>(initialBill?.items || []);
  const [serviceCharge, setServiceCharge] = useState<number>(Number(initialBill?.service_charge) || 0);

  // Tax state
  const [availableTaxes, setAvailableTaxes] = useState<TaxSetting[]>([]);
  const [appliedTaxIds, setAppliedTaxIds] = useState<Set<number>>(new Set());
  const [taxesLoading, setTaxesLoading] = useState(true);

  useEffect(() => {
    // Load tax settings
    taxService.getAll().then(res => {
      if (res.success) {
        setAvailableTaxes(res.data);
        // By default, activate all active taxes (or restore from saved bill)
        if (initialBill?.tax_snapshot?.length > 0) {
          setAppliedTaxIds(new Set(initialBill.tax_snapshot.map((t: any) => t.id)));
        } else {
          setAppliedTaxIds(new Set(res.data.filter(t => t.is_active).map(t => t.id)));
        }
      }
      setTaxesLoading(false);
    });
  }, []);

  // Live calculations
  const itemsSubtotal = items.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const preServiceSubtotal = itemsSubtotal + Number(serviceCharge || 0);

  // Compute taxes using only the toggled-on taxes
  const activeTaxesToApply = availableTaxes.filter(t => appliedTaxIds.has(t.id));
  const { taxSnapshot, taxTotal } = taxService.computeTaxes(activeTaxesToApply, itemsSubtotal, Number(serviceCharge || 0));
  const grandTotal = preServiceSubtotal + taxTotal;

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", cost: 0, qty: 1 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleChangeItem = (itemId: string, field: keyof BillItem, value: any) => {
    setItems(items.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const toggleTax = (taxId: number) => {
    setAppliedTaxIds(prev => {
      const next = new Set(prev);
      if (next.has(taxId)) next.delete(taxId);
      else next.add(taxId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await billService.saveBill(id, {
      items,
      service_charge: serviceCharge,
      tax_snapshot: taxSnapshot,
      tax_total: taxTotal,
    } as any);

    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Bill Saved", description: "The job bill was successfully updated." });
      router.push(`/app/repairs/${id}`);
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to save the bill details." });
    }
  };

  return (
    <ModuleForm
      title={initialBill ? "Update Bill Details" : "Finalize Service Bill"}
      subtitle={`Detail final costs for vehicle ${initialRepair?.vehicle_number} — ${initialRepair?.model_name}.`}
      backUrl={`/app/repairs/${id}`}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="flex flex-col gap-8 md:col-span-2">

        {/* Parts Section */}
        <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                <Package size={16} className="text-primary" />
                Parts & Replacements
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Add all physical parts or products used</p>
            </div>
            <WorkshopButton type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-dashed">
              <Plus size={14} className="mr-1" /> Add Part
            </WorkshopButton>
          </div>

          <div className="flex flex-col border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_120px_120px_48px] bg-muted/50 border-b border-border p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground items-center">
               <div className="px-2">Part Description</div>
               <div className="text-center">Qty</div>
               <div className="text-right px-2">Unit Price</div>
               <div className="text-right px-2">Amount</div>
               <div className="text-center">Act</div>
            </div>
            
            <div className="flex flex-col divide-y divide-border/50">
               {items.length === 0 ? (
                 <div className="py-16 bg-muted/5 flex flex-col items-center justify-center gap-3 opacity-80">
                   <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-50">
                     <Package size={24} />
                   </div>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                     No parts yet. <span className="text-primary cursor-pointer hover:underline font-black" onClick={handleAddItem}>Add first item</span>
                   </p>
                 </div>
               ) : (
                 items.map((item) => (
                   <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_120px_48px] gap-3 sm:gap-0 p-3 sm:p-0 items-center bg-card hover:bg-muted/10 transition-colors group">
                     {/* Description */}
                     <div className="p-1 sm:p-2 sm:px-3">
                       <label className="sm:hidden text-[9px] uppercase font-black tracking-widest text-primary mb-1 block">Part Description</label>
                       <input
                         type="text"
                         value={item.name}
                         onChange={(e) => handleChangeItem(item.id, 'name', e.target.value)}
                         placeholder="e.g. Brake Pads (Front)"
                         className="w-full bg-transparent border-b border-dashed sm:border-none border-border sm:rounded-md px-1 sm:px-3 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all font-bold placeholder:font-normal"
                       />
                     </div>
                     
                     {/* Qty */}
                     <div className="p-1 sm:p-2">
                       <label className="sm:hidden text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Qty</label>
                       <input
                         type="number"
                         min="1"
                         value={item.qty}
                         onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                         className="w-full bg-transparent border-b border-dashed sm:border-none border-border sm:rounded-md px-1 sm:px-2 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all font-bold sm:text-center"
                       />
                     </div>
                     
                     {/* Unit Price */}
                     <div className="p-1 sm:p-2">
                       <label className="sm:hidden text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Unit Price</label>
                       <div className="relative">
                         <span className="absolute left-2 sm:left-1 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground sm:text-muted-foreground/50 group-focus-within:text-foreground">₹</span>
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={item.cost || ''}
                           onChange={(e) => handleChangeItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                           className="w-full bg-transparent border-b border-dashed sm:border-none border-border sm:rounded-md pl-6 sm:pl-5 pr-1 sm:pr-2 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all font-bold sm:text-right"
                         />
                       </div>
                     </div>

                     {/* Precalculated Amount */}
                     <div className="p-1 sm:p-2 flex sm:justify-end items-center px-1 sm:px-4">
                        <label className="sm:hidden text-[9px] uppercase font-black tracking-widest text-muted-foreground mr-auto block">Amount</label>
                        <span className="text-sm font-black text-foreground">₹{Number(item.cost * (item.qty || 1)).toLocaleString()}</span>
                     </div>
                     
                     {/* Action */}
                     <div className="p-1 sm:p-2 flex justify-end sm:justify-center items-center">
                       <button 
                         type="button" 
                         onClick={() => handleRemoveItem(item.id)} 
                         className="p-1.5 sm:p-2 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                         title="Remove Part"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* Tax Section */}
        {!taxesLoading && availableTaxes.length > 0 && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                  <Percent size={16} className="text-primary" />
                  Applicable Taxes
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Toggle taxes on or off for this specific bill</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {availableTaxes.map(tax => {
                const isOn = appliedTaxIds.has(tax.id);
                const previewAmount = (() => {
                  let base = 0;
                  if (tax.applies_to === 'all') base = preServiceSubtotal;
                  else if (tax.applies_to === 'parts') base = itemsSubtotal;
                  else base = Number(serviceCharge || 0);
                  return tax.is_inclusive
                    ? base - (base / (1 + tax.rate / 100))
                    : base * (tax.rate / 100);
                })();

                return (
                  <div key={tax.id} className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    isOn ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/10 border-border opacity-50"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-black shrink-0",
                        isOn ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                      )}>
                        <span className="text-sm">{tax.rate}</span>
                        <span className="text-[8px]">%</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-foreground">{tax.name}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                            {tax.is_inclusive ? "Incl." : "Excl."}
                          </span>
                        </div>
                        {tax.description && <p className="text-[10px] text-muted-foreground">{tax.description}</p>}
                        {isOn && previewAmount > 0.01 && (
                          <span className="text-[10px] font-black text-emerald-600">
                            Adds ₹{previewAmount.toFixed(2)} to this bill
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTax(tax.id)}
                      className={cn("transition-all", isOn ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-primary")}
                    >
                      {isOn ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Totals Section */}
        <div className="p-8 rounded-3xl border border-border bg-card shadow-sm">
          <div className="max-w-md ml-auto flex flex-col gap-5">
            {/* Parts subtotal */}
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parts Subtotal</span>
              </div>
              <span className="text-sm font-bold text-foreground">₹{itemsSubtotal.toLocaleString()}</span>
            </div>

            {/* Service Charge */}
            <div className="flex justify-between items-center gap-10 p-5 rounded-2xl bg-muted/20 border border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black uppercase tracking-tight text-foreground">Technician Service Fee</span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Charges for mechanical work</span>
              </div>
              <div className="relative w-40">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceCharge || ''}
                  onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border text-sm rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary/40 transition-all font-bold text-right"
                />
              </div>
            </div>

            {/* Tax Breakdown */}
            {taxSnapshot.length > 0 && (
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                    <Percent size={12} /> Tax Breakdown
                  </span>
                </div>
                {taxSnapshot.map((t, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-bold">{t.name} ({t.rate}%) {t.is_inclusive ? '[Inclusive]' : ''}</span>
                    <span className="font-black text-emerald-700">₹{t.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-emerald-500/20 flex justify-between font-black text-sm text-emerald-700">
                  <span>Total Tax</span>
                  <span>₹{taxTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between items-end pt-5 border-t-2 border-foreground/10">
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-xs text-foreground font-black uppercase tracking-[2px]">
                   <Calculator size={16} className="text-primary" /> Grand Bill Total
                </span>
                {taxTotal > 0 && (
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    Includes ₹{taxTotal.toFixed(2)} in taxes
                  </span>
                )}
              </div>
              <span className="text-4xl font-black tracking-tighter text-primary">
                 ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModuleForm>
  );
}
