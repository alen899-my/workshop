"use client";

import React, { useState, useEffect } from "react";
import { taxService, TaxSetting } from "@/services/tax.service";
import { shopService, Shop } from "@/services/shop.service";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { useRBAC } from "@/lib/rbac";
import {
  Percent, Plus, Trash2, Edit, ToggleLeft, ToggleRight, Globe, Info,
  CheckCircle2, XCircle, Package, Wrench, Layers, Power, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/common/FilterBar";
import { WorkshopTable } from "@/components/common/Workshoptable";
import { ColumnDef } from "@/components/common/Workshoptable";

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'Everything (Parts + Service)', icon: Layers },
  { value: 'parts', label: 'Parts & Materials Only', icon: Package },
  { value: 'service', label: 'Labor & Service Only', icon: Wrench },
];

const PRESET_TAXES = [
  { name: "GST", rate: 18, description: "Goods and Services Tax (India)", is_inclusive: false, applies_to: "all" },
  { name: "VAT", rate: 20, description: "Value Added Tax (UK/EU)", is_inclusive: true, applies_to: "all" },
  { name: "Sales Tax", rate: 8, description: "Sales Tax (USA)", is_inclusive: false, applies_to: "parts" },
  { name: "HST", rate: 13, description: "Harmonized Sales Tax (Canada)", is_inclusive: false, applies_to: "all" },
  { name: "PST", rate: 7, description: "Provincial Sales Tax (Canada)", is_inclusive: false, applies_to: "parts" },
];

const emptyForm = {
  name: "",
  rate: "",
  description: "",
  is_active: true,
  is_inclusive: false,
  applies_to: "all" as TaxSetting["applies_to"],
  shop_id: "" as number | "",
};

export default function TaxSettingsClient({ initialData }: { initialData: TaxSetting[] }) {
  const [taxes, setTaxes] = useState<TaxSetting[]>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSetting | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: 0, title: "", message: "", onConfirm: () => {} });
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const { toast } = useToast();
  const { can, user } = useRBAC();
  
  const isSuperAdmin = user?.role === "super-admin";
  const canManage = can("manage:settings");

  useEffect(() => {
    if (isSuperAdmin) {
      shopService.getAll().then(res => {
        if (res.success && res.data) setShops(res.data);
      });
    }
  }, [isSuperAdmin]);

  const refresh = async () => {
    const res = await taxService.getAll();
    if (res.success) setTaxes(res.data);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (tax: TaxSetting) => {
    setEditing(tax);
    setForm({
      name: tax.name,
      rate: String(tax.rate),
      description: tax.description || "",
      is_active: tax.is_active,
      is_inclusive: tax.is_inclusive,
      applies_to: tax.applies_to,
      shop_id: tax.shop_id || "",
    });
    setFormOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_TAXES[0]) => {
    setForm({ ...form, name: preset.name, rate: String(preset.rate), description: preset.description, is_inclusive: preset.is_inclusive, applies_to: preset.applies_to as any });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.rate || (isSuperAdmin && !form.shop_id)) {
      toast({ type: "error", title: "Missing fields", description: isSuperAdmin ? "Tax name, rate, and assigned shop are required." : "Tax name and rate are required." });
      return;
    }
    setFormLoading(true);
    const payload = { 
      ...form, 
      rate: Number(form.rate),
      shop_id: form.shop_id === "" ? undefined : form.shop_id 
    };
    const res = editing
      ? await taxService.update(editing.id, payload)
      : await taxService.create(payload);
    setFormLoading(false);

    if (res.success) {
      toast({ type: "success", title: editing ? "Tax Updated" : "Tax Created", description: `"${form.name}" has been saved.` });
      setFormOpen(false);
      refresh();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Could not save tax." });
    }
  };

  const handleToggle = async (tax: TaxSetting) => {
    const res = await taxService.update(tax.id, { is_active: !tax.is_active });
    if (res.success) {
      setTaxes(prev => prev.map(t => t.id === tax.id ? { ...t, is_active: !t.is_active } : t));
      toast({ type: "success", title: tax.is_active ? "Tax Disabled" : "Tax Enabled", description: `"${tax.name}" is now ${tax.is_active ? "inactive" : "active"}.` });
    }
  };

  const handleDelete = (tax: TaxSetting) => {
    setConfirmConfig({
      isOpen: true,
      id: tax.id,
      title: `Delete ${tax.name}?`,
      message: `This will remove "${tax.name}" from your tax settings. Existing bills with this tax won't be affected.`,
      onConfirm: async () => {
        const res = await taxService.delete(tax.id);
        if (res.success) {
          setTaxes(prev => prev.filter(t => t.id !== tax.id));
          toast({ type: "success", title: "Tax Removed", description: "The tax has been deleted." });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const activeTaxes = taxes.filter(t => t.is_active);
  const inactiveTaxes = taxes.filter(t => !t.is_active);

  const filtered = React.useMemo(() => {
    if (!search) return taxes;
    const q = search.toLowerCase();
    return taxes.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [taxes, search]);

  const columns: ColumnDef<TaxSetting>[] = [
    {
      key: "name",
      header: "Tax Rule",
      sortable: true,
      renderCell: (tax) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex flex-col items-center justify-center border font-black shrink-0",
            tax.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
          )}>
            <span className="text-sm">{tax.rate}</span>
          </div>
          <div className="flex flex-col gap-0.5">
             <span className="font-bold text-foreground text-sm tracking-tight">{tax.name}</span>
             {isSuperAdmin && tax.shop_name && (
               <span className="text-[9px] font-black text-primary uppercase tracking-[2px]">{tax.shop_name}</span>
             )}
             {tax.description && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{tax.description}</span>}
          </div>
        </div>
      )
    },
    {
      key: "mode",
      header: "Mode & Scope",
      renderCell: (tax) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={cn(
               "text-[9px] font-black uppercase tracking-[2px] px-2 py-0.5 rounded-md border inline-block w-fit",
               tax.is_inclusive ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}>
               {tax.is_inclusive ? "Inclusive" : "Exclusive"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
             {tax.applies_to === 'all' && <Layers size={10} />}
             {tax.applies_to === 'parts' && <Package size={10} />}
             {tax.applies_to === 'service' && <Wrench size={10} />}
             {APPLIES_TO_OPTIONS.find(a => a.value === tax.applies_to)?.label || tax.applies_to}
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      renderCell: (tax) => (
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-[2px] border",
          tax.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted/50 text-muted-foreground border-border/50"
        )}>
          {tax.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {tax.is_active ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  return (
    <ModuleLayout
      title="Tax Configuration"
      description="Configure tax rules for your workshop. Taxes are automatically calculated on every bill based on your settings."
      buttonLabel={canManage ? "Add Tax Rule" : undefined}
      onButtonClick={canManage ? openCreate : undefined}
      backUrl="/app/settings"
    >
      <div className="flex flex-col gap-10">

        {/* Info Banner */}
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Globe size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Global Tax Support</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This system supports <strong>exclusive taxes</strong> (added on top — used in India GST, US Sales Tax) and <strong>inclusive taxes</strong> (already inside the price — used in UK/EU VAT).
              Each tax can be scoped to apply on <em>Parts Only</em>, <em>Labor Only</em>, or <em>Everything</em>.
              You can have multiple taxes active at the same time — they all stack and appear on the final bill.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-emerald-600">Active Taxes</span>
            <span className="text-4xl font-black text-emerald-600">{activeTaxes.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Applied to every new bill</span>
          </div>
          <div className="p-6 rounded-3xl bg-muted/30 border border-border flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">Inactive Taxes</span>
            <span className="text-4xl font-black text-foreground">{inactiveTaxes.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Saved but not applied</span>
          </div>
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-primary">Combined Rate</span>
            <span className="text-4xl font-black text-primary">
              {activeTaxes.reduce((acc, t) => acc + Number(t.rate), 0).toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total from all active taxes</span>
          </div>
        </div>

        {/* Tax List using WorkshopTable */}
        <div className="flex flex-col gap-6">
          <FilterBar
            searchPlaceholder="Search taxes..."
            search={search}
            onSearchChange={setSearch}
            onReset={() => setSearch("")}
          />

          {taxes.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center gap-5 bg-muted/5">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/20">
                <Percent size={40} />
              </div>
              <div className="flex flex-col items-center gap-2 text-center px-8">
                <h3 className="text-sm font-black uppercase tracking-[3px] text-foreground">No Tax Rules Configured</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                  Your bills currently show no taxes. Add a tax rule (like GST, VAT, or Sales Tax) to have it automatically applied on every new bill.
                </p>
                {canManage && (
                  <button onClick={openCreate} className="mt-4 px-5 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[2px] hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Plus size={14} /> Create First Tax Rule
                  </button>
                )}
              </div>
            </div>
          ) : (
            <WorkshopTable
              columns={columns}
              data={filtered}
              actions={canManage ? [
                { label: "Toggle Active", icon: Power, variant: "success", onClick: handleToggle },
                { label: "Edit", icon: Edit, variant: "warning", onClick: openEdit },
                { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
              ] : undefined}
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <WorkshopModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add Tax Rule"}
        subtitle="Configure a tax to be automatically applied when generating bills."
        width="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <WorkshopButton variant="outline" size="sm" onClick={() => setFormOpen(false)}>Cancel</WorkshopButton>
            <WorkshopButton variant="primary" size="sm" loading={formLoading} onClick={handleSubmit} icon={<Plus size={14} />}>
              {editing ? "Save Changes" : "Create Tax Rule"}
            </WorkshopButton>
          </div>
        }
      >
        <div className="flex flex-col gap-7 py-2">

          {/* Quick Presets */}
          {!editing && (
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Quick Presets (click to fill)</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAXES.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <span className="text-primary font-black">{preset.rate}%</span>
                    {preset.name}
                    <span className="text-[9px] text-muted-foreground">{preset.is_inclusive ? "Incl." : "Excl."}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Super Admin Shop Selector */}
          {isSuperAdmin && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Assign to Shop <span className="text-red-500">*</span></label>
              <select
                value={form.shop_id}
                onChange={e => setForm({ ...form, shop_id: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:bg-background transition-all font-bold"
              >
                <option value="">-- Select a Shop --</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name + Rate */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Tax Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. GST, VAT, Sales Tax"
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:bg-background transition-all font-bold placeholder:font-normal"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.rate}
                  onChange={e => setForm({ ...form, rate: e.target.value })}
                  placeholder="e.g. 18"
                  className="w-full bg-muted/40 border border-border rounded-xl pl-4 pr-9 py-3 text-sm outline-none focus:border-primary/40 focus:bg-background transition-all font-bold text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Goods and Services Tax — Government of India"
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:bg-background transition-all placeholder:font-normal"
            />
          </div>

          {/* Applies To */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">What Should This Tax Apply To?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {APPLIES_TO_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = form.applies_to === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, applies_to: opt.value as any })}
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all text-left",
                      active ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax Mode */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">How Is This Tax Applied?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_inclusive: false })}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-2 transition-all text-left",
                  !form.is_inclusive ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10 hover:border-primary/20"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", !form.is_inclusive ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Percent size={16} />
                </div>
                <span className={cn("text-xs font-black uppercase tracking-tight", !form.is_inclusive ? "text-primary" : "text-foreground")}>
                  Added on Top (Exclusive)
                </span>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                  Customer pays the listed price + tax.<br/>Used for: India GST, US Sales Tax
                </p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_inclusive: true })}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-2 transition-all text-left",
                  form.is_inclusive ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-muted/10 hover:border-blue-500/20"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", form.is_inclusive ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground")}>
                  <Percent size={16} />
                </div>
                <span className={cn("text-xs font-black uppercase tracking-tight", form.is_inclusive ? "text-blue-600" : "text-foreground")}>
                  Already Included (Inclusive)
                </span>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                  Tax is inside the shown price already.<br/>Used for: UK/Europe VAT
                </p>
              </button>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-black text-foreground">Apply to All New Bills</span>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                When active, this tax is automatically added every time a bill is created
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={cn("transition-all", form.is_active ? "text-emerald-500" : "text-muted-foreground")}
            >
              {form.is_active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>
        </div>
      </WorkshopModal>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </ModuleLayout>
  );
}
