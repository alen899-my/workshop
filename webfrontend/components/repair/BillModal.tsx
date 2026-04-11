"use client";

import React, { useState, useEffect } from "react";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";
import { useToast } from "@/components/ui/WorkshopToast";
import { billService, BillItem } from "@/services/bill.service";
import { taxService, TaxSetting } from "@/services/tax.service";
import { repairService } from "@/services/repair.service";
import { useCurrency } from "@/lib/currency";
import { useRBAC } from "@/lib/rbac";
import {
  Plus, Trash2, Calculator, Receipt, Package,
  ToggleLeft, ToggleRight, Percent, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repairId: string | null;
}

export function BillModal({ isOpen, onClose, onSuccess, repairId }: Props) {
  const { toast } = useToast();
  const { user } = useRBAC();
  const { symbol, format } = useCurrency(user);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [repair, setRepair] = useState<any>(null);

  const [items, setItems] = useState<BillItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>("Unpaid");
  const [availableTaxes, setAvailableTaxes] = useState<TaxSetting[]>([]);
  const [appliedTaxIds, setAppliedTaxIds] = useState<Set<number>>(new Set());
  const [taxesLoading, setTaxesLoading] = useState(true);
  const [existingBillId, setExistingBillId] = useState<string | null>(null);

  // Fetch repair + bill when modal opens
  useEffect(() => {
    if (!isOpen || !repairId) return;
    setDataLoading(true);
    Promise.all([repairService.getById(repairId), billService.getByRepairId(repairId)]).then(([rRes, bRes]) => {
      if (rRes.success) setRepair(rRes.data);
      const bill = bRes.success ? bRes.data : null;
      setItems(bill?.items || []);
      setServiceCharge(Number(bill?.service_charge) || 0);
      setPaymentStatus(bill?.payment_status || "Unpaid");
      setExistingBillId(bill?.id ? String(bill.id) : null);
      setDataLoading(false);

      // Taxes
      taxService.getAll(undefined, rRes.data?.shop_id).then((tRes) => {
        if (tRes.success) {
          setAvailableTaxes(tRes.data);
          if (bill?.tax_snapshot && bill.tax_snapshot.length > 0) setAppliedTaxIds(new Set(bill.tax_snapshot.map((t: any) => t.id)));
          else setAppliedTaxIds(new Set(tRes.data.filter((t) => t.is_active).map((t) => t.id)));
        }
        setTaxesLoading(false);
      });
    });
  }, [isOpen, repairId]);

  const itemsSubtotal = items.reduce((acc, i) => acc + i.cost * i.qty, 0);
  const preServiceSubtotal = itemsSubtotal + Number(serviceCharge || 0);
  // Override is_active based on user toggles so computeTaxes' internal filter works correctly
  const taxesForCompute = availableTaxes.map((t) => ({ ...t, is_active: appliedTaxIds.has(t.id) }));
  const { taxSnapshot, taxTotal } = taxService.computeTaxes(taxesForCompute, itemsSubtotal, Number(serviceCharge || 0));
  const exclusiveTaxTotal = taxSnapshot.reduce((acc, t) => acc + (t.is_inclusive ? 0 : t.amount), 0);
  const grandTotal = preServiceSubtotal + exclusiveTaxTotal;

  const handleAddItem = () => setItems([...items, { id: Date.now().toString(), name: "", cost: 0, qty: 1 }]);
  const handleRemoveItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const handleChangeItem = (id: string, field: keyof BillItem, value: any) =>
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const toggleTax = (taxId: number) =>
    setAppliedTaxIds((prev) => { const n = new Set(prev); n.has(taxId) ? n.delete(taxId) : n.add(taxId); return n; });

  const handleSubmit = async () => {
    if (!repairId) return;
    setLoading(true);
    const payload = {
      items,
      service_charge: serviceCharge,
      tax_snapshot: taxSnapshot,
      tax_total: taxTotal,
      payment_status: paymentStatus,
    };
    const res = await billService.saveBill(repairId, payload as any);
    setLoading(false);
    if (res.success) {
      toast({ type: "success", title: "Bill Saved", description: `Bill for repair #${repairId} saved.` });
      onSuccess();
      onClose();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to save the bill." });
    }
  };

  return (
    <WorkshopModal
      isOpen={isOpen} onClose={onClose}
      title={existingBillId ? "Update Bill" : "Finalize Service Bill"}
      subtitle={repair ? `Vehicle: ${repair.vehicle_number} — ${repair.model_name || ""}` : "Loading…"}
      width="xl"
      footer={
        <div className="flex justify-end gap-3">
          <WorkshopButton type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</WorkshopButton>
          <WorkshopButton type="button" onClick={handleSubmit} disabled={loading || dataLoading}>
            {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : existingBillId ? "Update Bill" : "Save Bill"}
          </WorkshopButton>
        </div>
      }
    >
      {dataLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Loading bill data…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Parts & Items ── */}
          <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase"><Package size={14} className="text-primary" />Services &amp; Expenses</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Add all parts, products, or manual services</p>
              </div>
              <WorkshopButton type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-dashed shrink-0"><Plus size={13} className="mr-1" />Add Item</WorkshopButton>
            </div>

            <div className="flex flex-col border border-border rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_72px_112px_112px_44px] bg-muted/50 border-b border-border px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="px-2">Item / Service</div><div className="text-center">Qty</div><div className="text-right px-2">Unit Price</div><div className="text-right px-4">Amount</div><div className="text-center">Del</div>
              </div>
              <div className="flex flex-col divide-y divide-border/50">
                {items.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-60">
                    <Package size={24} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No items yet. <span className="text-primary cursor-pointer hover:underline font-black" onClick={handleAddItem}>Add first item</span></p>
                  </div>
                ) : items.map((item) => (
                  <div key={item.id} className="group bg-card hover:bg-muted/10 transition-colors">
                    {/* Mobile */}
                    <div className="md:hidden flex flex-col gap-3 p-3">
                      <div className="flex items-start gap-2">
                        <input type="text" value={item.name} onChange={(e) => handleChangeItem(item.id, "name", e.target.value)} placeholder="e.g. Engine Oil, Brake Pads" className="flex-1 bg-transparent border-b border-dashed border-border px-1 py-1.5 text-sm focus:outline-none focus:border-primary font-bold placeholder:font-normal placeholder:text-muted-foreground/60" />
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="mt-5 p-1.5 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Qty</label><input type="number" min="1" value={item.qty} onChange={(e) => handleChangeItem(item.id, "qty", parseInt(e.target.value) || 1)} className="w-full bg-transparent border-b border-dashed border-border px-1 py-1.5 text-sm focus:outline-none focus:border-primary font-bold text-center" /></div>
                        <div><label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Unit Price</label><div className="relative"><span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/70">{symbol}</span><input type="number" min="0" step="0.01" value={item.cost || ""} onChange={(e) => handleChangeItem(item.id, "cost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-b border-dashed border-border pl-4 pr-1 py-1.5 text-sm focus:outline-none focus:border-primary font-bold text-right" /></div></div>
                        <div><label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Amount</label><div className="py-1.5 text-sm font-black text-right pr-1 break-all">{format(item.cost * item.qty)}</div></div>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-[1fr_72px_112px_112px_44px] items-center">
                      <div className="px-4 py-2"><input type="text" value={item.name} onChange={(e) => handleChangeItem(item.id, "name", e.target.value)} placeholder="e.g. Brake Pads (Front)" className="w-full bg-transparent rounded-md px-2 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 font-bold placeholder:font-normal placeholder:text-muted-foreground/60" /></div>
                      <div className="px-2 py-2"><input type="number" min="1" value={item.qty} onChange={(e) => handleChangeItem(item.id, "qty", parseInt(e.target.value) || 1)} className="w-full bg-transparent rounded-md px-2 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 font-bold text-center" /></div>
                      <div className="px-2 py-2"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/50">{symbol}</span><input type="number" min="0" step="0.01" value={item.cost || ""} onChange={(e) => handleChangeItem(item.id, "cost", parseFloat(e.target.value) || 0)} className="w-full bg-transparent rounded-md pl-5 pr-2 py-2 text-sm focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 font-bold text-right" /></div></div>
                      <div className="flex justify-end items-center px-4 py-2"><span className="text-sm font-black break-all text-right">{format(item.cost * item.qty)}</span></div>
                      <div className="flex justify-center items-center px-1 py-2"><button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Taxes ── */}
          {!taxesLoading && availableTaxes.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-4">
              <div><h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase"><Percent size={14} className="text-primary" />Applicable Taxes</h3><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Toggle taxes on or off for this bill</p></div>
              <div className="flex flex-col gap-3">
                {availableTaxes.map((tax) => {
                  const isOn = appliedTaxIds.has(tax.id);
                  let base = 0;
                  if (tax.applies_to === "all") base = preServiceSubtotal;
                  else if (tax.applies_to === "parts") base = itemsSubtotal;
                  else base = Number(serviceCharge || 0);
                  const preview = tax.is_inclusive ? base - base / (1 + tax.rate / 100) : base * (tax.rate / 100);
                  return (
                    <div key={tax.id} className={cn("flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all", isOn ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/10 border-border opacity-50")}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex flex-col items-center justify-center border font-black shrink-0", isOn ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                          <span className="text-sm leading-tight">{tax.rate}</span><span className="text-[8px]">%</span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-black">{tax.name}</span><span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">{tax.is_inclusive ? "Incl." : "Excl."}</span></div>
                          {isOn && preview > 0.01 && <span className="text-[10px] font-black text-emerald-600 break-all">Adds {format(preview)} to this bill</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleTax(tax.id)} className={cn("transition-all shrink-0", isOn ? "text-emerald-500" : "text-muted-foreground hover:text-primary")}>
                        {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Totals ── */}
          <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="w-full max-w-md ml-auto flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2"><Receipt size={13} className="text-muted-foreground" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items Subtotal</span></div>
                <span className="text-sm font-bold break-all text-right max-w-[50%]">{format(itemsSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/20 border border-border">
                <div><span className="text-xs font-black uppercase tracking-tight">Technician Service Fee</span><p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Charges for mechanical work</p></div>
                <div className="relative w-36 shrink-0"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">{symbol}</span>
                  <input type="number" min="0" step="0.01" value={serviceCharge || ""} onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)} className="w-full bg-background border border-border text-sm rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:border-primary/40 font-bold text-right" /></div>
              </div>
              {taxSnapshot.length > 0 && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 mb-1"><Percent size={11} />Tax Breakdown</span>
                  {taxSnapshot.map((t, i) => (<div key={i} className="flex gap-4 justify-between text-xs text-muted-foreground"><span className="font-bold shrink-0">{t.name} ({t.rate}%) {t.is_inclusive ? "[Inclusive]" : ""}</span><span className="font-black text-emerald-700 break-all text-right">{format(t.amount)}</span></div>))}
                  <div className="pt-1 border-t border-emerald-500/20 flex gap-4 justify-between font-black text-sm text-emerald-700"><span className="shrink-0">Total Tax</span><span className="break-all text-right">{format(taxTotal)}</span></div>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Payment Status</label>
                <WorkshopInlineSelect value={paymentStatus} onChange={setPaymentStatus}
                  options={[{ value: "Unpaid", label: "Unpaid" }, { value: "Paid", label: "Payment Received (Paid)" }]}
                  className={cn("w-full h-[48px] px-4 rounded-xl text-sm font-bold border transition-all", paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20")}
                  activeClassName="bg-card text-foreground border-primary ring-4 ring-primary/5" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pt-4 border-t-2 border-foreground/10">
                <div className="shrink-0"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-[2px]"><Calculator size={14} className="text-primary" />Grand Bill Total</span>{taxTotal > 0 && <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Includes {format(taxTotal)} in taxes</span>}</div>
                <span className="text-3xl sm:text-4xl font-black tracking-tighter text-primary break-all text-left sm:text-right">{format(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkshopModal>
  );
}
