"use client";

import React, { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useRBAC } from "@/lib/rbac";
import { shopService, Shop } from "@/services/shop.service";
import { useToast } from "@/components/ui/WorkshopToast";
import { Coins, Save, Store, AlertTriangle } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";

// @ts-ignore
import currencyCodes from "currency-codes";

export default function CurrencyClient() {
  const { user, can } = useRBAC();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const { toast } = useToast();

  const canManage = can("manage:settings");
  
  const codesData = React.useMemo(() => {
    try {
      // Support different library import structures
      const data = currencyCodes.data || (currencyCodes as any).codes || [];
      return data.map((c: any) => ({ 
        value: c.code, 
        label: `${c.code} — ${c.currency || c.name}` 
      })).sort((a: any, b: any) => a.label.localeCompare(b.label));
    } catch (e) {
      return [{ value: "INR", label: "INR — Indian Rupee" }];
    }
  }, []);

  useEffect(() => {
    const sId = user?.shopId || user?.shop_id;
    if (sId) {
      shopService.getById(Number(sId)).then(res => {
        if (res.success && res.data) {
          setShop(res.data);
          setCurrency(res.data.currency || "INR");
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    const sId = (user as any)?.shopId || (user as any)?.shop_id;
    if (!shop || !canManage || !sId) return;
    setSaving(true);
    const res = await shopService.update(Number(sId), { currency });
    setSaving(false);
    
    if (res.success) {
       toast({ type: "success", title: "Currency Saved", description: `Your Shops's currency is now ${currency}.` });
       // Update local state gracefully so UI updates
       const ls = localStorage.getItem("workshop_user");
       if (ls) {
         try {
           const u = JSON.parse(ls);
           u.shopCurrency = currency;
           localStorage.setItem("workshop_user", JSON.stringify(u));
           // Reload to propagate context instantly
           window.location.reload();
         } catch(e){}
       }
    } else {
       toast({ type: "error", title: "Error", description: "Failed to update currency." });
    }
  };

  if (loading) return (
    <ModuleLayout title="Loading Settings..." description="Please wait while we fetch your Shop configuration.">
      <div className="p-10 text-center font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Fetching Shop configuration...</div>
    </ModuleLayout>
  );

  if (!shop) {
    return (
       <ModuleLayout title="Status Error" description="This setting requires an associated workshop Shop.">
         <div className="p-8 bg-card rounded-none border border-destructive bg-destructive/5 text-destructive font-medium uppercase tracking-tight text-sm">
            No workshop Shop found for your account.
         </div>
       </ModuleLayout>
    );
  }

  const previewAmount = 4500.50;

  return (
    <ModuleLayout title="Currency Settings" description="Set the default currency for your workshop." backUrl="/app/settings">
      <div className="flex flex-col gap-6 sm:gap-10 max-w-3xl">
        <div className="p-4 sm:p-6 md:p-8 bg-card border border-border shadow-sm rounded-2xl flex flex-col gap-6 sm:gap-8">
           
           {/* Shop Info */}
           <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-5 sm:p-6 bg-muted/40 border border-border rounded-xl">
             <div className="w-12 h-12 bg-primary/15 text-primary rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
               <Store size={24} strokeWidth={1.5} />
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[10px] font-medium uppercase tracking-[3px] text-muted-foreground">Active Shop</span>
               <span className="text-lg sm:text-xl font-medium text-foreground uppercase tracking-tight">{shop.name}</span>
             </div>
           </div>

           {/* BIG WARNING BANNER */}
           <div className="p-5 sm:p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
             <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
               <AlertTriangle size={24} strokeWidth={2} />
             </div>
             <div className="flex flex-col gap-1.5">
               <h3 className="text-sm font-medium uppercase tracking-tight text-amber-700">Critical: Shop Price Consistency</h3>
               <p className="text-xs sm:text-[13px] text-amber-800/80 leading-relaxed font-normal">
                 Changing the currency will apply <strong>instantly to all prices</strong> across this Shop. 
                 Existing inventory prices, labor rates, and pending bills will remain as numbers but will be displayed with this new currency symbol.
               </p>
             </div>
           </div>

           <div className="flex flex-col gap-4">
             <WorkshopSearchableSelect
               label="Workshop Base Currency"
               options={codesData}
               value={currency}
               onChange={(val) => setCurrency(String(val))}
               placeholder="Search and select currency..."
               className="w-full"
             />
           </div>

            {/* LIVE PREVIEW CARD */}
            <div className="flex flex-col gap-2 p-6 sm:p-10 rounded-xl bg-primary/[0.03] border border-primary/20 items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -mr-16 -mt-16 blur-3xl" />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[3px] text-primary/60 flex items-center gap-2 relative z-10 mb-2">
                <Coins size={14} className="animate-pulse" /> Live Display Preview
              </span>
              <span className="text-4xl sm:text-5xl md:text-6xl font-normal text-primary tracking-tighter relative z-10 drop-shadow-sm font-mono text-center break-all w-full px-2">
                {new Intl.NumberFormat(undefined, { 
                  style: 'currency', 
                  currency, 
                  minimumFractionDigits: 2 
                }).format(previewAmount)}
              </span>
              <div className="mt-4 px-4 py-1.5 rounded-md border border-primary/20 bg-primary/5 text-[10px] text-primary relative z-10 font-bold uppercase tracking-widest">
                 Currency Code: {currency}
              </div>
            </div>

           {canManage && (
             <div className="flex justify-end pt-4 sm:pt-6 border-t border-border mt-2 sm:mt-4">
               <WorkshopButton loading={saving} onClick={handleSave} variant="primary" icon={<Save size={16} />} className="w-full sm:w-auto px-8 shadow-md">
                 Save Currency Settings
               </WorkshopButton>
             </div>
           )}

        </div>
      </div>
    </ModuleLayout>
  );
}
