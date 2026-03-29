"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { billService, BillItem } from "@/services/bill.service";
import { repairService } from "@/services/repair.service";
import { Plus, Trash2, Receipt, PenTool, Hash, Calculator } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

export default function RepairBillPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [repairContext, setRepairContext] = useState<any>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const [rRes, bRes] = await Promise.all([
        repairService.getById(id),
        billService.getByRepairId(id)
      ]);

      if (rRes.success && rRes.data) {
        setRepairContext(rRes.data);
      } else {
        toast({ type: "error", title: "Error", description: "Repair not found." });
        router.push("/app/repairs");
        return;
      }

      if (bRes.success && bRes.data) {
        setItems(bRes.data.items || []);
        setServiceCharge(Number(bRes.data.service_charge) || 0);
      }
      setFetching(false);
    };
    fetchData();
  }, [id, router, toast]);

  const subtotal = items.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const total = subtotal + Number(serviceCharge || 0);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: "", cost: 0, qty: 1 }
    ]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleChangeItem = (itemId: string, field: keyof BillItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === itemId) return { ...i, [field]: value };
      return i;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await billService.saveBill(id, {
      items,
      service_charge: serviceCharge
    });
    
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Bill Saved", description: "The repair bill was saved successfully." });
      router.push("/app/repairs");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to save the bill." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse font-mono tracking-widest uppercase text-[10px]">Loading bill details...</div>;

  return (
    <ModuleForm
      title="Repair Billing"
      subtitle={`Manage parts, replacements, and service charges for vehicle ${repairContext?.vehicle_number}.`}
      backUrl="/app/repairs"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="flex flex-col gap-8 md:col-span-2">
        
        {/* Items Section */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <PenTool size={16} className="text-muted-foreground" />
                Products & Replacements
              </h3>
              <WorkshopButton type="button" variant="outline" size="sm" onClick={handleAddItem}>
                 <Plus size={14} className="mr-1" /> Add Item
              </WorkshopButton>
           </div>
           
           <div className="flex flex-col gap-3">
             {items.length === 0 ? (
               <div className="p-6 text-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-xs uppercase tracking-widest">
                 No items added yet
               </div>
             ) : (
               items.map((item, index) => (
                 <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end p-4 border rounded-xl bg-muted/10">
                    <div className="flex-1 w-full">
                       <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Item Name / Part</label>
                       <input 
                         type="text" 
                         value={item.name}
                         onChange={(e) => handleChangeItem(item.id, 'name', e.target.value)}
                         placeholder="e.g. Brake Pads"
                         className="w-full bg-card border text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 transition-all font-medium"
                       />
                    </div>
                    <div className="w-full sm:w-24">
                       <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Qty</label>
                       <input 
                         type="number" 
                         min="1"
                         value={item.qty}
                         onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                         className="w-full bg-card border text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 transition-all font-medium"
                       />
                    </div>
                    <div className="w-full sm:w-32">
                       <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Unit Cost</label>
                       <input 
                         type="number" 
                         min="0"
                         step="0.01"
                         value={item.cost || ''}
                         onChange={(e) => handleChangeItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                         className="w-full bg-card border text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 transition-all font-medium text-right"
                       />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 mb-0.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Global Costs */}
        <div className="p-5 border-t border-border mt-4">
           <div className="max-w-xs ml-auto flex flex-col gap-4">
              
              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                 <span>Items Subtotal:</span>
                 <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center gap-4">
                 <span className="text-sm font-bold text-foreground">Service Charge:</span>
                 <input 
                   type="number" 
                   min="0"
                   step="0.01"
                   value={serviceCharge || ''}
                   onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                   className="w-32 bg-card border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-primary/50 transition-all font-bold text-right"
                 />
              </div>

              <div className="h-px bg-border my-1" />

              <div className="flex justify-between items-center text-lg font-bold text-primary">
                 <span className="flex items-center gap-2"><Calculator size={18} /> Total Cost:</span>
                 <span>₹{total.toFixed(2)}</span>
              </div>

           </div>
        </div>
      </div>
    </ModuleForm>
  );
}
