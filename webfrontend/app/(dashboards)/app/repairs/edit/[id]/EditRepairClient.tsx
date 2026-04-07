"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { repairService } from "@/services/repair.service";
import { billService } from "@/services/bill.service";
import { User } from "@/services/user.service";
import {
  Car, Phone, User as UserIcon, Calendar, Plus, X, ShieldCheck, Tag, Wrench,
  Search, ChevronRight, MoreHorizontal, Loader2, Trash2, ExternalLink
} from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { VEHICLE_CONFIG, MAIN_VEHICLES } from "@/constants/vehicles";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/lib/rbac";
import NextImage from "next/image";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface EditRepairClientProps {
    id: string;
    initialRepair: any;
    workers: User[];
}

export default function EditRepairClient({ id, initialRepair, workers }: EditRepairClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useRBAC();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    vehicle_number: initialRepair.vehicle_number || "",
    owner_name: initialRepair.owner_name || "",
    phone_number: initialRepair.phone_number || "",
    model_name: initialRepair.model_name || "",
    vehicle_type: initialRepair.vehicle_type || "Car",
    repair_date: initialRepair.repair_date ? new Date(initialRepair.repair_date).toISOString().substring(0, 10) : "",
    attending_worker_id: initialRepair.attending_worker_id ? initialRepair.attending_worker_id.toString() : "",
    status: initialRepair.status || "Pending",
    payment_status: initialRepair.payment_status || "Unpaid"
  });

  const [serviceBlocks, setServiceBlocks] = useState<{ type: string, tasks: { text: string, fixed: boolean }[] }[]>(() => {
    let parsed = initialRepair.complaints;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    
    // Check if it's the new block format or old flat format
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'object' && 'type' in parsed[0] && 'tasks' in parsed[0]) {
        return parsed;
      }
      // Migrate old flat format to a single 'Repair' block
      return [{ type: initialRepair.service_type || "Repair", tasks: parsed }];
    }
    
    return [{ type: initialRepair.service_type || "Repair", tasks: [] }];
  });

  const SERVICE_TYPES = ["Repair", "Servicing", "Inspection", "Modification", "Other"];

  const SERVICE_CONFIG_UI: Record<string, { label: string; placeholder: string; sub: string }> = {
    "Repair": { label: "What's wrong with the vehicle?", placeholder: "e.g. Engine noise, brake failed...", sub: "Reported Problems" },
    "Servicing": { label: "What needs to be serviced?", placeholder: "e.g. Oil change, washing, general check...", sub: "Service Items" },
    "Inspection": { label: "What do we need to check?", placeholder: "e.g. Tire life, computer scanning...", sub: "Inspection Checklist" },
    "Modification": { label: "What are the modification details?", placeholder: "e.g. Color wrap, exhaust change...", sub: "Customization Plan" },
    "Other": { label: "Additional work details", placeholder: "Explain the work needed...", sub: "Other Requests" }
  };

  const addServiceBlock = () => {
    setServiceBlocks([...serviceBlocks, { type: "Repair", tasks: [] }]);
  };

  const removeServiceBlock = (index: number) => {
    if (serviceBlocks.length > 1) {
       setServiceBlocks(serviceBlocks.filter((_, i) => i !== index));
    }
  };

  const updateBlockType = (index: number, type: string) => {
    const next = [...serviceBlocks];
    next[index].type = type;
    setServiceBlocks(next);
  };

  const addTaskToBlock = (index: number, text: string) => {
    if (!text.trim()) return;
    const next = [...serviceBlocks];
    next[index].tasks.push({ text: text.trim(), fixed: false });
    setServiceBlocks(next);
  };

  const toggleTaskInBlock = (blockIdx: number, taskIdx: number) => {
    const next = [...serviceBlocks];
    next[blockIdx].tasks[taskIdx].fixed = !next[blockIdx].tasks[taskIdx].fixed;
    setServiceBlocks(next);
  };

  const removeTaskFromBlock = (blockIdx: number, taskIdx: number) => {
    const next = [...serviceBlocks];
    next[blockIdx].tasks = next[blockIdx].tasks.filter((_, i) => i !== taskIdx);
    setServiceBlocks(next);
  };

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [existingImage, setExistingImage] = useState<string | null>(initialRepair.vehicle_image || null);
  const [file, setFile] = useState<File | null>(null);

  const filteredVehicles = VEHICLE_CONFIG.filter(v =>
    v.label.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const selectedVehicle = VEHICLE_CONFIG.find(v => v.id === form.vehicle_type) || VEHICLE_CONFIG[0];
  const isMainVehicle = MAIN_VEHICLES.includes(form.vehicle_type);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // Fallback
            }
          }, 'image/jpeg', 0.82);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      
      // 10MB limit
      if (rawFile.size > 10 * 1024 * 1024) {
        toast({ type: "error", title: "File too large", description: "Maximum image size is 10MB." });
        e.target.value = "";
        return;
      }

      setLoading(true);
      try {
        const optimized = await compressImage(rawFile);
        setFile(optimized);

      } catch (err) {
        setFile(rawFile);
      } finally {
        setLoading(false);
      }
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
    if (form.owner_name) formData.append("owner_name", form.owner_name);
    if (form.phone_number) formData.append("phone_number", form.phone_number);
    if (form.model_name) formData.append("model_name", form.model_name);
    if (form.vehicle_type) formData.append("vehicle_type", form.vehicle_type);

    // Multi-block serialization
    formData.append("complaints", JSON.stringify(serviceBlocks));
    formData.append("service_type", serviceBlocks.map(b => b.type).join(", "));

    if (form.repair_date) formData.append("repair_date", form.repair_date);
    if (form.attending_worker_id) formData.append("attending_worker_id", form.attending_worker_id);
    formData.append("status", form.status);

    if (file) {
      formData.append("vehicle_image", file);
    }

    const res = await repairService.update(id, formData);
    setLoading(false);

    if (res.success) {
      if (initialRepair.bill_id && form.payment_status !== initialRepair.payment_status) {
        await billService.updatePaymentStatus(initialRepair.bill_id, form.payment_status);
      }
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

        {(existingImage || file) && (
          <div className="md:col-span-2 mb-4">
            <label className="text-[10px] font-bold tracking-[2px] text-muted-foreground/60 block mb-2 uppercase">Vehicle Image</label>
            {/* Full image display */}
            <div className="relative w-full h-48 sm:h-60 rounded-xl overflow-hidden border border-border bg-muted/10 mb-2">
              <NextImage
                src={file ? URL.createObjectURL(file) : (existingImage || "")}
                alt="Vehicle"
                fill
                className="object-cover"
              />
            </div>
            {/* View in new tab button */}
            <a
              href={file ? URL.createObjectURL(file) : (existingImage || "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <ExternalLink size={12} />
              View 
            </a>
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

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Contact Phone Number</label>
          <PhoneInput
            country="in"
            value={form.phone_number}
            onChange={(phone) => setForm(f => ({ ...f, phone_number: `+${phone}` }))}
            containerClass="!w-full"
            inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all duration-200"
            buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md hover:!bg-muted"
            dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md"
            searchClass="!bg-muted !border !border-border !text-foreground"
          />
        </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-muted/50 group-hover:bg-primary/10 transition-colors" style={form.vehicle_type === v.id ? { backgroundColor: v.color + '20' } : {}}>
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

        {/* MULTI-SERVICE BLOCK SYSTEM */}
        <div className="md:col-span-2 flex flex-col gap-6 sm:gap-8 py-2 sm:py-4">
           {serviceBlocks.map((block, bIdx) => {
             const ui = SERVICE_CONFIG_UI[block.type] || SERVICE_CONFIG_UI["Other"];
             return (
               <div key={bIdx} className="bg-muted/10 border border-border p-4 sm:p-6 rounded-none relative group/block">
                  {/* Block Header Toolbar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-primary/10 text-primary flex items-center justify-center text-xs font-black font-mono">
                         {bIdx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[2px] text-primary">Service Category</span>
                      </div>
                    </div>
                    
                    {serviceBlocks.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeServiceBlock(bIdx)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border/50 sm:border-transparent sm:hover:border-destructive/20"
                      >
                         <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Type</label>
                      <WorkshopInlineSelect
                        value={block.type}
                        onChange={(val) => updateBlockType(bIdx, val)}
                        options={SERVICE_TYPES.map(st => ({ value: st, label: st }))}
                        wrapperClassName="w-full min-w-0"
                        className="w-full bg-background border border-border rounded-none text-sm px-4 h-[48px] font-bold text-foreground normal-case tracking-normal"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-muted-foreground block">{ui.label}</label>
                      <p className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-tight">{ui.sub}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-background border border-border text-sm rounded-none px-4 py-3 focus:outline-none focus:border-primary transition-all font-medium h-[48px]"
                        placeholder={ui.placeholder}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTaskToBlock(bIdx, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                           const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                           addTaskToBlock(bIdx, input.value);
                           input.value = "";
                        }}
                        className="bg-primary text-primary-foreground h-[48px] sm:w-12 rounded-none flex items-center justify-center hover:bg-primary/90 transition-colors gap-2 sm:gap-0 px-4 sm:px-0"
                      >
                        <Plus size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Add Task</span>
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {block.tasks.length === 0 && (
                        <div className="p-6 border border-dashed border-border/60 text-center bg-muted/5">
                           <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[2px]">Empty Service List</p>
                        </div>
                      )}
                      {block.tasks.map((t, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-3 bg-card p-3 sm:p-4 border border-border group/task">
                          <button
                            type="button"
                            onClick={() => toggleTaskInBlock(bIdx, tIdx)}
                            className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors border-2 ${t.fixed ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}
                          >
                            {t.fixed && <ShieldCheck size={12} className="text-white" />}
                          </button>
                          <span className={`flex-1 text-sm font-medium leading-relaxed ${t.fixed ? 'line-through text-muted-foreground/70' : 'text-foreground'}`}>
                            {t.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTaskFromBlock(bIdx, tIdx)}
                            className="sm:opacity-0 group-hover/task:opacity-100 text-destructive hover:bg-destructive/10 p-2 sm:p-1.5 transition-all -mr-1 -mt-1 sm:m-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
             );
           })}

           <button
             type="button"
             onClick={addServiceBlock}
             className="w-full py-6 sm:py-8 border-2 border-dashed border-primary/20 bg-primary/[0.02] text-primary hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-3 sm:gap-2 px-6"
           >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <Plus size={24} />
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[3px]">Add Another Service Category</span>
                <p className="text-[9px] text-muted-foreground/60 max-w-[280px] leading-tight mt-1">Use this to keep different things like washing and repairs separate</p>
              </div>
           </button>
        </div>

        <div className="flex flex-col gap-2">
          <WorkshopSearchableSelect
            label="Attending Worker"
            placeholder="Assign a worker..."
            options={workers
              .filter(w => {
                // Owners/Admins see everyone except customers
                if (user?.role === "shop_owner" || user?.role === "admin" || user?.role === "super-admin") {
                  return w.role !== "customer";
                }
                // Workers see only fellow workers
                return w.role === "worker";
              })
              .map((w) => ({ 
                value: w.id.toString(), 
                label: w.name, 
                subLabel: w.role === "shop_owner" ? "Owner" : w.role === "admin" ? "Admin" : "Worker"
              }))
            }
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
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Repair Status</label>
          <WorkshopInlineSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={[
              { value: "Pending", label: "Pending" },
              { value: "Started", label: "Started" },
              { value: "In Progress", label: "In Progress" },
              { value: "Completed", label: "Completed" },
            ]}
            wrapperClassName="w-full min-w-0"
            className="w-full bg-background border border-border rounded-md text-sm px-4 h-[42px] font-semibold text-foreground normal-case tracking-normal"
          />
        </div>
      </div>
    </ModuleForm>
  );
}
