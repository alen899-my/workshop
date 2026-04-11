"use client";

import React, { useState, useEffect } from "react";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { repairService } from "@/services/repair.service";
import { billService } from "@/services/bill.service";
import { userService, User } from "@/services/user.service";
import {
  Car, User as UserIcon, Calendar, Plus, X, ShieldCheck, Tag, Wrench,
  Search, ChevronRight, MoreHorizontal, Loader2, Trash2, ExternalLink,
} from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";
import { VEHICLE_CONFIG, MAIN_VEHICLES } from "@/constants/vehicles";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/lib/rbac";
import NextImage from "next/image";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repairId: string | null;
  initialRepair: any | null;
}

const SERVICE_TYPES = ["Repair", "Servicing", "Inspection", "Modification", "Other"];
const SERVICE_CONFIG_UI: Record<string, { label: string; placeholder: string; sub: string }> = {
  Repair:       { label: "What's wrong with the vehicle?",       placeholder: "e.g. Engine noise, brake failed…",   sub: "Reported Problems" },
  Servicing:    { label: "What needs to be serviced?",          placeholder: "e.g. Oil change, washing…",           sub: "Service Items" },
  Inspection:   { label: "What do we need to check?",           placeholder: "e.g. Tire life, computer scanning…", sub: "Inspection Checklist" },
  Modification: { label: "What are the modification details?",  placeholder: "e.g. Color wrap, exhaust change…",   sub: "Customization Plan" },
  Other:        { label: "Additional work details",             placeholder: "Explain the work needed…",            sub: "Other Requests" },
};

export function EditRepairModal({ isOpen, onClose, onSuccess, repairId, initialRepair }: Props) {
  const { toast } = useToast();
  const { user } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    vehicle_number: "", owner_name: "", phone_number: "", model_name: "",
    vehicle_type: "Car", repair_date: "", attending_worker_id: "",
    status: "Pending", payment_status: "Unpaid",
  });
  const [serviceBlocks, setServiceBlocks] = useState<{ type: string; tasks: { text: string; fixed: boolean }[] }[]>([
    { type: "Repair", tasks: [] },
  ]);

  // Populate form when repair data arrives
  useEffect(() => {
    if (!isOpen || !initialRepair) return;
    setForm({
      vehicle_number: initialRepair.vehicle_number || "",
      owner_name: initialRepair.owner_name || "",
      phone_number: initialRepair.phone_number || "",
      model_name: initialRepair.model_name || "",
      vehicle_type: initialRepair.vehicle_type || "Car",
      repair_date: initialRepair.repair_date ? new Date(initialRepair.repair_date).toISOString().substring(0, 10) : "",
      attending_worker_id: initialRepair.attending_worker_id ? String(initialRepair.attending_worker_id) : "",
      status: initialRepair.status || "Pending",
      payment_status: initialRepair.payment_status || "Unpaid",
    });
    setExistingImage(initialRepair.vehicle_image || null);
    setFile(null);
    // Parse complaints
    let parsed = initialRepair.complaints;
    if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { parsed = []; } }
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === "object" && "type" in parsed[0] && "tasks" in parsed[0]) setServiceBlocks(parsed);
      else setServiceBlocks([{ type: initialRepair.service_type || "Repair", tasks: parsed }]);
    } else {
      setServiceBlocks([{ type: initialRepair.service_type || "Repair", tasks: [] }]);
    }
    // Fetch workers
    userService.getAll().then((r) => { if (r.success) setWorkers(r.data); });
  }, [isOpen, initialRepair]);

  const addServiceBlock = () => setServiceBlocks([...serviceBlocks, { type: "Repair", tasks: [] }]);
  const removeServiceBlock = (i: number) => { if (serviceBlocks.length > 1) setServiceBlocks(serviceBlocks.filter((_, idx) => idx !== i)); };
  const updateBlockType = (i: number, type: string) => { const n = [...serviceBlocks]; n[i].type = type; setServiceBlocks(n); };
  const addTaskToBlock = (i: number, text: string) => { if (!text.trim()) return; const n = [...serviceBlocks]; n[i].tasks.push({ text: text.trim(), fixed: false }); setServiceBlocks(n); };
  const toggleTaskInBlock = (bi: number, ti: number) => { const n = [...serviceBlocks]; n[bi].tasks[ti].fixed = !n[bi].tasks[ti].fixed; setServiceBlocks(n); };
  const removeTaskFromBlock = (bi: number, ti: number) => { const n = [...serviceBlocks]; n[bi].tasks = n[bi].tasks.filter((_, i) => i !== ti); setServiceBlocks(n); };

  const compressImage = (f: File): Promise<File> =>
    new Promise((resolve) => {
      const reader = new FileReader(); reader.readAsDataURL(f);
      reader.onload = (e) => {
        const img = new Image(); img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas"); const MAX = 1200;
          let w = img.width, h = img.height; if (w > MAX) { h *= MAX / w; w = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(blob ? new File([blob], f.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }) : f), "image/jpeg", 0.82);
        };
      };
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0]; if (!raw) return;
    if (raw.size > 10 * 1024 * 1024) { toast({ type: "error", title: "File too large", description: "Max 10MB." }); return; }
    setLoading(true); try { setFile(await compressImage(raw)); } catch { setFile(raw); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairId || !form.vehicle_number) { toast({ type: "error", title: "Validation Error", description: "Vehicle Number is mandatory." }); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("vehicle_number", form.vehicle_number);
    if (form.owner_name) fd.append("owner_name", form.owner_name);
    if (form.phone_number) fd.append("phone_number", form.phone_number);
    if (form.model_name) fd.append("model_name", form.model_name);
    if (form.vehicle_type) fd.append("vehicle_type", form.vehicle_type);
    fd.append("complaints", JSON.stringify(serviceBlocks));
    fd.append("service_type", serviceBlocks.map((b) => b.type).join(", "));
    if (form.repair_date) fd.append("repair_date", form.repair_date);
    if (form.attending_worker_id) fd.append("attending_worker_id", form.attending_worker_id);
    fd.append("status", form.status);
    fd.append("payment_status", form.payment_status);
    if (file) fd.append("vehicle_image", file);
    const res = await repairService.update(repairId, fd);
    setLoading(false);
    if (res.success) {
      if (initialRepair?.bill_id && form.payment_status !== initialRepair.payment_status) {
        await billService.updatePaymentStatus(initialRepair.bill_id, form.payment_status);
      }
      toast({ type: "success", title: "Repair Updated", description: `Record for ${form.vehicle_number} updated.` });
      onSuccess(); onClose();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update repair." });
    }
  };

  const selectedVehicle = VEHICLE_CONFIG.find((v) => v.id === form.vehicle_type) || VEHICLE_CONFIG[0];
  const isMainVehicle = MAIN_VEHICLES.includes(form.vehicle_type);
  const filteredVehicles = VEHICLE_CONFIG.filter((v) =>
    v.label.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.category.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  if (!initialRepair) return null;

  return (
    <>
      <WorkshopModal isOpen={isOpen} onClose={onClose} title="Edit Repair" subtitle={`Updating repair job #${repairId}`} width="xl"
        footer={
          <div className="flex justify-end gap-3">
            <WorkshopButton type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</WorkshopButton>
            <WorkshopButton type="button" onClick={handleSubmit as any} disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Changes"}
            </WorkshopButton>
          </div>
        }
      >
        <form id="edit-repair-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Existing Image */}
          {(existingImage || file) && (
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold tracking-[2px] text-muted-foreground/60 block mb-2 uppercase">Vehicle Image</label>
              <div className="relative w-full max-w-[200px] aspect-square rounded-xl overflow-hidden border border-border bg-muted/10 mb-2">
                <NextImage src={file ? URL.createObjectURL(file) : existingImage!} alt="Vehicle" fill className="object-cover" unoptimized />
              </div>
              <a href={file ? URL.createObjectURL(file) : existingImage!} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                <ExternalLink size={11} /> View Full
              </a>
            </div>
          )}

          <div className="md:col-span-2"><AuthFormField label="Vehicle Number *" placeholder="e.g. KL 01 AB 1234" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} icon={<Car size={16} />} /></div>

          <AuthFormField label="Owner Name" placeholder="Owner name" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} icon={<UserIcon size={16} />} />
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Contact Phone</label>
            <PhoneInput country="in" value={form.phone_number} onChange={(phone) => setForm((f) => ({ ...f, phone_number: `+${phone}` }))}
              containerClass="!w-full" inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all"
              buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md hover:!bg-muted"
              dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md" />
          </div>
          <AuthFormField label="Model Name" placeholder="e.g. MT15, Pulsar" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} icon={<Tag size={16} />} />

          {/* Vehicle Type Picker */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="text-[10px] font-bold tracking-[2px] text-muted-foreground uppercase flex items-center gap-2"><Wrench size={12} strokeWidth={3} />Pick Vehicle Type</label>
            <div className="flex flex-wrap gap-3 pt-1">
              {MAIN_VEHICLES.map((id) => {
                const v = VEHICLE_CONFIG.find((vc) => vc.id === id); if (!v) return null;
                const isSelected = form.vehicle_type === id; const Icon = v.icon;
                return (
                  <button key={id} type="button" onClick={() => setForm({ ...form, vehicle_type: id })}
                    className={cn("relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border transition-all duration-300", isSelected ? "border-primary bg-primary/5 shadow-lg ring-4 ring-primary/5 scale-105 z-10" : "border-border bg-card hover:border-primary/40 hover:scale-105")}>
                    <div className={cn("w-10 h-10 rounded-xl mb-1.5 flex items-center justify-center transition-colors shadow-sm", isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground")} style={isSelected ? { backgroundColor: v.color } : {}}>
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className={cn("text-[9px] font-bold tracking-tight transition-colors", isSelected ? "text-primary uppercase" : "text-muted-foreground")} style={isSelected ? { color: v.color } : {}}>{v.label}</span>
                  </button>
                );
              })}
              {!isMainVehicle && form.vehicle_type !== "Other" && (
                <button type="button" onClick={() => setIsVehicleModalOpen(true)} className="relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border border-primary bg-primary/5 shadow-lg ring-4 ring-primary/5 scale-105 z-10">
                  <div className="w-10 h-10 rounded-xl mb-1.5 flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: selectedVehicle.color }}><selectedVehicle.icon size={20} strokeWidth={2} /></div>
                  <span className="text-[9px] font-bold tracking-tight uppercase" style={{ color: selectedVehicle.color }}>{selectedVehicle.label}</span>
                </button>
              )}
              <button type="button" onClick={() => setIsVehicleModalOpen(true)} className={cn("relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border border-dashed transition-all", form.vehicle_type === "Other" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                <div className="w-10 h-10 rounded-xl mb-1.5 flex items-center justify-center bg-muted text-muted-foreground"><MoreHorizontal size={20} /></div>
                <span className="text-[9px] font-bold tracking-tight text-muted-foreground">VIEW ALL</span>
              </button>
            </div>
          </div>

          {/* Service Blocks */}
          <div className="md:col-span-2 flex flex-col gap-6 py-2">
            {serviceBlocks.map((block, bIdx) => {
              const ui = SERVICE_CONFIG_UI[block.type] || SERVICE_CONFIG_UI.Other;
              return (
                <div key={bIdx} className="bg-muted/10 border border-border p-4 rounded-none relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{bIdx + 1}</div>
                      <span className="text-[10px] font-black uppercase tracking-[2px] text-primary">Service Category</span>
                    </div>
                    {serviceBlocks.length > 1 && <button type="button" onClick={() => removeServiceBlock(bIdx)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border/50"><Trash2 size={14} /></button>}
                  </div>
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Type</label>
                    <WorkshopInlineSelect value={block.type} onChange={(val) => updateBlockType(bIdx, val)} options={SERVICE_TYPES.map((s) => ({ value: s, label: s }))} wrapperClassName="w-full" className="w-full bg-background border border-border rounded-none text-sm px-4 h-[42px] font-bold" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div><label className="text-xs font-bold text-muted-foreground block">{ui.label}</label><p className="text-[10px] text-muted-foreground/50 font-mono uppercase">{ui.sub}</p></div>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 bg-background border border-border text-sm rounded-none px-4 py-2.5 focus:outline-none focus:border-primary transition-all h-[42px]" placeholder={ui.placeholder}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTaskToBlock(bIdx, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }}} />
                      <button type="button" onClick={(e) => { const inp = e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement; addTaskToBlock(bIdx, inp.value); inp.value = ""; }}
                        className="bg-primary text-primary-foreground h-[42px] w-10 rounded-none flex items-center justify-center hover:bg-primary/90 transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="space-y-1.5">
                      {block.tasks.length === 0 && <div className="p-4 border border-dashed border-border/60 text-center bg-muted/5"><p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[2px]">Empty Service List</p></div>}
                      {block.tasks.map((t, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-3 bg-card p-3 border border-border group/task">
                          <button type="button" onClick={() => toggleTaskInBlock(bIdx, tIdx)} className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors border-2 ${t.fixed ? "bg-green-500 border-green-500" : "border-muted-foreground/30"}`}>{t.fixed && <ShieldCheck size={12} className="text-white" />}</button>
                          <span className={`flex-1 text-sm font-medium leading-relaxed ${t.fixed ? "line-through text-muted-foreground/70" : "text-foreground"}`}>{t.text}</span>
                          <button type="button" onClick={() => removeTaskFromBlock(bIdx, tIdx)} className="opacity-0 group-hover/task:opacity-100 text-destructive hover:bg-destructive/10 p-1.5 transition-all"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={addServiceBlock} className="w-full py-5 border-2 border-dashed border-primary/20 bg-primary/[0.02] text-primary hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Plus size={18} /></div>
              <span className="text-[10px] font-black uppercase tracking-[3px]">Add Another Service Category</span>
            </button>
          </div>

          {/* Worker + Date */}
          <div className="flex flex-col gap-2">
            <WorkshopSearchableSelect label="Attending Worker" placeholder="Assign a worker…"
              options={workers.filter((w) => user?.role === "shop_owner" || user?.role === "admin" || user?.role === "super-admin" ? w.role !== "customer" : w.role === "worker")
                .map((w) => ({ value: w.id.toString(), label: w.name, subLabel: w.role === "shop_owner" ? "Owner" : w.role === "admin" ? "Admin" : "Worker" }))}
              value={form.attending_worker_id} onChange={(val) => setForm({ ...form, attending_worker_id: String(val) })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground block">Update Vehicle Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted/20 hover:file:bg-muted/40 transition-colors file:text-sm file:font-semibold" />
          </div>

          {/* Status + Payment */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground mb-1 block">Repair Status</label>
            <WorkshopInlineSelect value={form.status} onChange={(val) => setForm({ ...form, status: val })}
              options={[{ value: "Pending", label: "Pending" }, { value: "Started", label: "Started" }, { value: "In Progress", label: "In Progress" }, { value: "Completed", label: "Completed" }]}
              wrapperClassName="w-full" className="w-full bg-background border border-border rounded-xl text-sm px-4 h-[48px] font-bold" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground mb-1 block">Payment Status</label>
            <WorkshopInlineSelect value={form.payment_status} onChange={(val) => setForm({ ...form, payment_status: val })}
              options={[{ value: "Unpaid", label: "Unpaid" }, { value: "Paid", label: "Payment Received (Paid)" }]}
              wrapperClassName="w-full"
              className={cn("w-full h-[48px] px-4 rounded-xl text-sm font-bold border transition-all", form.payment_status === "Paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20")}
              activeClassName="bg-card text-foreground border-primary ring-4 ring-primary/5" />
          </div>
        </form>
      </WorkshopModal>

      {/* Vehicle Library Sub-Modal */}
      <WorkshopModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="Vehicle Type Library" subtitle="Update categorization for accuracy" width="lg">
        <div className="flex flex-col gap-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input type="text" placeholder="Search vehicles…" className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50" value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredVehicles.map((v) => (
              <button key={v.id} type="button" onClick={() => { setForm({ ...form, vehicle_type: v.id }); setIsVehicleModalOpen(false); }} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all text-left", form.vehicle_type === v.id ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/40")}>
                <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-muted/50" style={form.vehicle_type === v.id ? { backgroundColor: v.color + "20" } : {}}><v.icon size={16} style={{ color: v.color }} /></div>
                <div className="flex flex-col overflow-hidden"><span className="text-xs font-bold truncate">{v.label}</span><span className="text-[9px] text-muted-foreground uppercase">{v.category}</span></div>
              </button>
            ))}
          </div>
        </div>
      </WorkshopModal>
    </>
  );
}
