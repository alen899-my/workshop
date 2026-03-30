"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { repairService } from "@/services/repair.service";
import { User } from "@/services/user.service";
import {
  Car, Phone, User as UserIcon, Calendar, Plus, X, ShieldCheck, Tag, Wrench,
  Search, ChevronRight, MoreHorizontal
} from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { VEHICLE_CONFIG, MAIN_VEHICLES } from "@/constants/vehicles";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EditRepairClientProps {
    id: string;
    initialRepair: any;
    workers: User[];
}

export default function EditRepairClient({ id, initialRepair, workers }: EditRepairClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  // Parse complaints from initialData
  let parsedComplaints = [];
  if (Array.isArray(initialRepair.complaints)) {
    parsedComplaints = initialRepair.complaints.map((c: any) => typeof c === 'string' ? { text: c, fixed: false } : c);
  } else if (typeof initialRepair.complaints === 'string' && initialRepair.complaints.trim().length > 0) {
    try {
      const parsed = JSON.parse(initialRepair.complaints);
      if (Array.isArray(parsed)) {
        parsedComplaints = parsed.map((c: any) => typeof c === 'string' ? { text: c, fixed: false } : c);
      }
    } catch (e) {
      parsedComplaints = [{ text: initialRepair.complaints, fixed: false }];
    }
  }

  const [form, setForm] = useState({
    vehicle_number: initialRepair.vehicle_number || "",
    owner_name: initialRepair.owner_name || "",
    phone_number: initialRepair.phone_number || "",
    model_name: initialRepair.model_name || "",
    vehicle_type: initialRepair.vehicle_type || "Car",
    complaints: parsedComplaints as { text: string; fixed: boolean }[],
    repair_date: initialRepair.repair_date ? new Date(initialRepair.repair_date).toISOString().substring(0, 10) : "",
    attending_worker_id: initialRepair.attending_worker_id ? initialRepair.attending_worker_id.toString() : "",
    status: initialRepair.status || "Pending",
    service_type: initialRepair.service_type || "Repair"
  });

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [currentComplaint, setCurrentComplaint] = useState("");
  const [existingImage, setExistingImage] = useState<string | null>(initialRepair.vehicle_image || null);
  const [file, setFile] = useState<File | null>(null);

  const filteredVehicles = VEHICLE_CONFIG.filter(v =>
    v.label.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const selectedVehicle = VEHICLE_CONFIG.find(v => v.id === form.vehicle_type) || VEHICLE_CONFIG[0];
  const isMainVehicle = MAIN_VEHICLES.includes(form.vehicle_type);

  const addComplaint = () => {
    if (currentComplaint.trim()) {
      setForm(f => ({
        ...f,
        complaints: [...f.complaints, { text: currentComplaint.trim(), fixed: false }]
      }));
      setCurrentComplaint("");
    }
  };

  const toggleComplaint = (index: number) => {
    setForm(f => ({
      ...f,
      complaints: f.complaints.map((c, i) => i === index ? { ...c, fixed: !c.fixed } : c)
    }));
  };

  const removeComplaint = (index: number) => {
    setForm(f => ({ ...f, complaints: f.complaints.filter((_, i) => i !== index) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_number) {
      toast({ type: "error", title: "Validation Error", description: "Vehicle Number is mandatory." });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("vehicle_number", form.vehicle_number);
    formData.append("owner_name", form.owner_name || "");
    formData.append("phone_number", form.phone_number || "");
    if (form.model_name) formData.append("model_name", form.model_name);
    if (form.vehicle_type) formData.append("vehicle_type", form.vehicle_type);
    if (form.complaints.length > 0) formData.append("complaints", JSON.stringify(form.complaints));
    formData.append("repair_date", form.repair_date || "");
    if (form.attending_worker_id) formData.append("attending_worker_id", form.attending_worker_id);
    formData.append("status", form.status);
    formData.append("service_type", form.service_type);

    if (file) {
      formData.append("vehicle_image", file);
    }

    const res = await repairService.update(id, formData);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Repair Updated", description: `Record for ${form.vehicle_number} updated successfully.` });
      router.push("/app/repairs");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update repair log." });
    }
  };

  return (
    <ModuleForm
      title="Edit Repair"
      subtitle="Update the status, details, or assignee of the repair job."
      backUrl="/app/repairs"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">

        {existingImage && !file && (
          <div className="md:col-span-2 mb-4">
            <label className="text-[10px] font-bold tracking-[2px] text-muted-foreground/60 block mb-2 uppercase">Current Vehicle Image</label>
            <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-border">
              <Image src={existingImage} alt="Vehicle Image" fill className="object-cover" />
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <AuthFormField
            label="Vehicle Number *"
            placeholder="e.g. KL 01 AB 1234"
            value={form.vehicle_number}
            onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
            icon={<Car size={16} />}
          />
        </div>

        <AuthFormField
          label="Owner Name"
          placeholder="Owner name"
          value={form.owner_name}
          onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          icon={<UserIcon size={16} />}
        />

        <AuthFormField
          label="Phone Number"
          placeholder="Contact number"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          icon={<Phone size={16} />}
        />

        <AuthFormField
          label="Model Name"
          placeholder="e.g. MT15, R15, Pulsar"
          value={form.model_name}
          onChange={(e) => setForm({ ...form, model_name: e.target.value })}
          icon={<Tag size={16} />}
        />

        <div className="md:col-span-2 flex flex-col gap-3">
          <label className="text-[10px] font-bold tracking-[2px] text-muted-foreground uppercase flex items-center gap-2">
            <Wrench size={12} strokeWidth={3} />
            Pick Vehicle Type
          </label>
          <div className="flex flex-wrap gap-3 pt-1">
            {MAIN_VEHICLES.map((vId) => {
              const vehicle = VEHICLE_CONFIG.find(v => v.id === vId);
              if (!vehicle) return null;
              const isSelected = form.vehicle_type === vId;
              const Icon = vehicle.icon;
              return (
                <button
                  key={vId}
                  type="button"
                  onClick={() => setForm({ ...form, vehicle_type: vId })}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border transition-all duration-300 group",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-4 ring-primary/5 scale-105 z-10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:scale-105"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-1.5 sm:mb-2 flex items-center justify-center transition-colors shadow-sm",
                      isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}
                    style={isSelected ? { backgroundColor: vehicle.color } : {}}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold tracking-tight transition-colors",
                    isSelected ? "text-primary uppercase" : "text-muted-foreground"
                  )}
                    style={isSelected ? { color: vehicle.color } : {}}
                  >
                    {vehicle.label}
                  </span>
                </button>
              );
            })}

            {!isMainVehicle && form.vehicle_type !== 'Other' && (
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-4 ring-primary/5 scale-105 z-10 transition-all"
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-1.5 sm:mb-2 flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: selectedVehicle.color }}
                >
                  <selectedVehicle.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase" style={{ color: selectedVehicle.color }}>
                  {selectedVehicle.label}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(true)}
              className={cn(
                "relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-dashed transition-all duration-300 group",
                form.vehicle_type === 'Other' ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-1.5 sm:mb-2 flex items-center justify-center bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <MoreHorizontal size={20} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-tight text-muted-foreground">VIEW ALL</span>
            </button>
          </div>
        </div>

        <WorkshopModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          title="Vehicle Type Library"
          subtitle="Update categorization for accuracy"
          width="lg"
        >
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search vehicles..."
                className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredVehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setForm({ ...form, vehicle_type: v.id });
                    setIsVehicleModalOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                    form.vehicle_type === v.id ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-primary/40"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 group-hover:bg-primary/10 transition-colors" style={form.vehicle_type === v.id ? { backgroundColor: v.color + '20' } : {}}>
                    <v.icon size={18} style={{ color: v.color }} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-foreground truncate">{v.label}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{v.category}</span>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-muted-foreground/30" />
                </button>
              ))}
            </div>
          </div>
        </WorkshopModal>

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground block">What's wrong? (Complaints)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all font-medium"
              placeholder="Type a complaint..."
              value={currentComplaint}
              onChange={(e) => setCurrentComplaint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addComplaint();
                }
              }}
            />
            <button
              type="button"
              onClick={addComplaint}
              className="bg-primary text-primary-foreground w-12 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2 mt-2">
            {form.complaints.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => toggleComplaint(i)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border-2 ${c.fixed ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}
                >
                  {c.fixed && <ShieldCheck size={12} className="text-white" />}
                </button>
                <span className={`flex-1 text-sm font-medium ${c.fixed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {c.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeComplaint(i)}
                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <AuthFormField
          label="Repair Date"
          type="date"
          value={form.repair_date}
          onChange={(e) => setForm({ ...form, repair_date: e.target.value })}
          icon={<Calendar size={16} />}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Service Type</label>
          <select
            value={form.service_type}
            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all font-bold text-foreground"
          >
            <option value="Repair">Repair</option>
            <option value="Servicing">Servicing</option>
            <option value="Inspection">Inspection</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <WorkshopSearchableSelect
            label="Attending Worker"
            placeholder="Assign a worker..."
            options={workers.map((w) => ({ value: w.id.toString(), label: w.name, subLabel: w.role }))}
            value={form.attending_worker_id}
            onChange={(val) => setForm({ ...form, attending_worker_id: String(val) })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground block">Update Vehicle Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted/20 hover:file:bg-muted/40 transition-colors file:text-sm file:font-semibold"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all font-bold text-foreground"
          >
            <option value="Pending">Pending</option>
            <option value="Started">Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    </ModuleForm>
  );
}
