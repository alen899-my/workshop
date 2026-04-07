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
import { AuthFormField } from "@/components/ui/AuthFormField";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import {
  Percent, Plus, Trash2, Edit, ToggleLeft, ToggleRight, Globe, Info,
  CheckCircle2, XCircle, Package, Wrench, Layers, Power, Search, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { WorkshopTable } from "@/components/common/Workshoptable";
import { ColumnDef } from "@/components/common/Workshoptable";

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'Everything (Parts + Labor)', icon: Layers },
  { value: 'parts', label: 'Only Spare Parts', icon: Package },
  { value: 'service', label: 'Only Labor Charges', icon: Wrench },
];

const PRESET_TAXES = [
  { name: "GST", rate: 18, description: "Standard India GST (18%)", is_inclusive: false, applies_to: "all" },
  { name: "VAT", rate: 20, description: "Standard UK/EU VAT (20%)", is_inclusive: true, applies_to: "all" },
  { name: "Sales Tax", rate: 8, description: "US Style Sales Tax", is_inclusive: false, applies_to: "parts" },
  { name: "HST", rate: 13, description: "Canadian HST", is_inclusive: false, applies_to: "all" },
  { name: "PST", rate: 7, description: "Canadian PST (Parts Only)", is_inclusive: false, applies_to: "parts" },
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
  const [recordStatus, setRecordStatus] = useState("Active");
  const [shops, setShops] = useState<Shop[]>([]);
  const { toast } = useToast();
  const { can, user } = useRBAC();

  // Fetch when recordStatus changes
  useEffect(() => {
    refresh();
  }, [recordStatus]);
  
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
    const res = await taxService.getAll(recordStatus);
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
    const currentShopId = isSuperAdmin ? form.shop_id : (user?.shopId || user?.shop_id);
    const payload = { 
      ...form, 
      rate: Number(form.rate),
      shop_id: currentShopId === "" ? undefined : Number(currentShopId) 
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
      header: "Tax Rules",
      sortable: true,
      renderCell: (tax) => (
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0 shadow-sm",
            tax.is_active ? "bg-primary text-primary-foreground border-primary/20" : "bg-muted text-muted-foreground border-border"
          )}>
            <span className="text-sm font-normal">{tax.rate}%</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
             <span className="font-medium text-foreground text-sm tracking-tight truncate">{tax.name}</span>
             {isSuperAdmin && tax.shop_name && (
               <WorkshopBadge variant="primary" size="xs" className="mt-1 w-fit">
                 {tax.shop_name}
               </WorkshopBadge>
             )}
             {tax.description && <span className="text-[10px] text-muted-foreground truncate max-w-[200px] hidden sm:block">{tax.description}</span>}
          </div>
        </div>
      )
    },
    {
      key: "mode",
      header: "Application",
      className: "hidden md:table-cell",
      renderCell: (tax) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <WorkshopBadge 
               variant={tax.is_inclusive ? "info" : "warning"} 
               size="xs"
            >
               {tax.is_inclusive ? "Included" : "Extra"}
            </WorkshopBadge>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1.5">
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
      className: "hidden sm:table-cell",
      renderCell: (tax) => (
        <WorkshopBadge 
          variant={tax.is_active ? "success" : "muted"} 
          size="xs"
        >
          {tax.is_active ? "Live" : "Off"}
        </WorkshopBadge>
      )
    }
  ];

  return (
    <ModuleLayout
      title="Tax Settings"
      description="Manage how taxes are applied to your bills. You can set up GST, VAT, or Sales Tax rules here."
      buttonLabel={canManage ? "Add Tax Rule" : undefined}
      onButtonClick={canManage ? openCreate : undefined}
      backUrl="/app/settings"
    >
      <div className="flex flex-col gap-10">

        {/* Info Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Globe size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Understanding Tax Rules</h3>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                We support both <strong>Extra Tax</strong> (added on top) and <strong>Included Tax</strong> (built-in). 
                Apply to spare parts, labor, or the entire bill. Multiple active taxes combine on final invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <span className="text-[10px] font-medium uppercase tracking-[2px] text-emerald-600">Active Taxes</span>
            <span className="text-3xl sm:text-4xl font-normal text-emerald-600">{activeTaxes.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Applied to every new bill</span>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-muted/30 border border-border flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <span className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">Inactive Taxes</span>
            <span className="text-3xl sm:text-4xl font-normal text-foreground">{inactiveTaxes.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Saved but not applied</span>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <span className="text-[10px] font-medium uppercase tracking-[2px] text-primary">Combined Rate</span>
            <span className="text-3xl sm:text-4xl font-normal text-primary">
              {activeTaxes.reduce((acc, t) => acc + Number(t.rate), 0).toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Total active tax load</span>
          </div>
        </div>

        {/* Tax List using WorkshopTable */}
        <div className="flex flex-col gap-6">
          <FilterBar
            searchPlaceholder="Search taxes..."
            search={search}
            onSearchChange={setSearch}
            onReset={() => {
              setSearch("");
              setRecordStatus("Active");
            }}
          >
            <FilterSelect
              label="Record Status"
              value={recordStatus}
              onChange={setRecordStatus}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Archived" },
              ]}
            />
          </FilterBar>

          {taxes.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center gap-5 bg-muted/5">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/20">
                <Percent size={40} />
              </div>
              <div className="flex flex-col items-center gap-2 text-center px-8">
                <h3 className="text-sm font-bold uppercase tracking-[3px] text-foreground">No Tax Rules Configured</h3>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed max-w-sm">
                  Your bills currently show no taxes. Add a tax rule (like GST, VAT, or Sales Tax) to have it automatically applied on every new bill.
                </p>
                {canManage && (
                  <button onClick={openCreate} className="mt-4 px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-[2px] hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20">
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
                { 
                  label: "Disable", 
                  icon: Power, 
                  variant: "danger", 
                  onClick: handleToggle,
                  hidden: (row) => !row.is_active 
                },
                { 
                  label: "Enable", 
                  icon: CheckCircle2, 
                  variant: "success", 
                  onClick: handleToggle,
                  hidden: (row) => row.is_active 
                },
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
          <div className="flex items-center justify-end gap-3 w-full border-t pt-4">
            <WorkshopButton variant="outline" size="sm" onClick={() => setFormOpen(false)}>Close</WorkshopButton>
            <WorkshopButton variant="primary" size="sm" loading={formLoading} onClick={handleSubmit} icon={<CheckCircle2 size={14} />}>
              {editing ? "Save Changes" : "Add Tax Rule"}
            </WorkshopButton>
          </div>
        }
      >
        <div className="flex flex-col gap-7 py-2">

          {/* Quick Presets */}
          {!editing && (
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground ml-1">Quick Presets (click to fill)</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAXES.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-4 py-2 rounded-xl bg-muted/40 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium flex items-center gap-2"
                  >
                    <span className="text-primary font-bold">{preset.rate}%</span>
                    {preset.name}
                    <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{preset.is_inclusive ? "Incl." : "Excl."}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Super Admin Shop Selector */}
          {isSuperAdmin && (
            <WorkshopSearchableSelect
              label="Assigned Shop"
              options={shops.map(s => ({ value: s.id, label: s.name }))}
              value={form.shop_id}
              onChange={val => setForm({ ...form, shop_id: Number(val) })}
              placeholder="Select a shop to link this tax rule"
            />
          )}

          {/* Name + Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AuthFormField
              label="Tax Label (Name)"
              placeholder="e.g. GST, VAT, Service Tax"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground ml-1">Tax Percentage (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.rate}
                  onChange={e => setForm({ ...form, rate: e.target.value })}
                  placeholder="e.g. 18"
                  className="w-full bg-background border border-border rounded-md pl-4 pr-10 h-[42px] text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-normal text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <AuthFormField
            label="Brief Explanation (Optional)"
            placeholder="e.g. Applied on all labor services"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          {/* Applies To */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground ml-1">What Should This Tax Apply To?</label>
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
                      "p-4 rounded-xl border flex flex-col items-center sm:items-start gap-2 transition-all text-center sm:text-left",
                      active ? "border-primary/40 bg-primary/5 text-primary ring-2 ring-primary/10" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax Mode */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground ml-1">Tax Calculation Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_inclusive: false })}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-2 transition-all text-left group/btn",
                  !form.is_inclusive ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-border bg-muted/10 hover:border-primary/20"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", !form.is_inclusive ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover/btn:bg-primary/10 group-hover/btn:text-primary")}>
                  <Plus size={16} />
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-tight", !form.is_inclusive ? "text-primary" : "text-foreground")}>
                  Add on Top (Extra)
                </span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Tax is calculated and added to total. Standard for GST/Sales Tax.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_inclusive: true })}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-2 transition-all text-left group/btn",
                  form.is_inclusive ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/5" : "border-border bg-muted/10 hover:border-blue-500/20"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", form.is_inclusive ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground group-hover/btn:bg-blue-500/10 group-hover/btn:text-blue-500")}>
                  <Layers size={16} />
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-tight", form.is_inclusive ? "text-blue-600" : "text-foreground")}>
                  Built-in (Inclusive)
                </span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Price already has tax in it. Simple VAT model.
                </p>
              </button>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">Auto-Apply to New Bills</span>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                Automatically added to every new generation
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={cn("transition-all", form.is_active ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-primary")}
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
