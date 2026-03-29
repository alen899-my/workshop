"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { repairService } from "@/services/repair.service";
import { userService, User } from "@/services/user.service";
import { Car, Phone, User as UserIcon, Calendar, ClipboardList } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";

/** Add Repair Page */
export default function CreateRepairPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [workers, setWorkers] = useState<User[]>([]);

  const [form, setForm] = useState({
    vehicle_number: "",
    owner_name: "",
    phone_number: "",
    complaints: "",
    repair_date: new Date().toISOString().substring(0, 10),
    attending_worker_id: "",
    status: "Pending",
    service_type: "Repair"
  });
  
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      // Get all users in shop to populate worker list
      const res = await userService.getAll();
      if (res.success && res.data) {
        setWorkers(res.data);
      }
    };
    fetchWorkers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_number) {
      toast({ type: "error", title: "Missing Fields", description: "Vehicle Number is required." });
      return;
    }

    setLoading(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("vehicle_number", form.vehicle_number);
    if (form.owner_name) formData.append("owner_name", form.owner_name);
    if (form.phone_number) formData.append("phone_number", form.phone_number);
    if (form.complaints) formData.append("complaints", form.complaints);
    if (form.repair_date) formData.append("repair_date", form.repair_date);
    if (form.attending_worker_id) formData.append("attending_worker_id", form.attending_worker_id);
    formData.append("status", form.status);
    formData.append("service_type", form.service_type);
    
    if (file) {
      formData.append("vehicle_image", file);
    }
    
    const res = await repairService.create(formData);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Repair Created", description: `Repair job for ${form.vehicle_number} added.` });
      router.push("/app/repairs");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to create repair row." });
    }
  };

  return (
    <ModuleForm
      title="New Repair"
      subtitle="Log a new repair job and assign a worker."
      backUrl="/app/repairs"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
        
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

        <div className="md:col-span-2">
           <label className="text-xs font-semibold text-muted-foreground mb-1 block">Complaints</label>
           <textarea
             className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all min-h-[100px]"
             placeholder="List the vehicle complaints here..."
             value={form.complaints}
             onChange={(e) => setForm({...form, complaints: e.target.value})}
           />
        </div>

        <AuthFormField
          label="Repair Date"
          type="date"
          value={form.repair_date}
          onChange={(e) => setForm({ ...form, repair_date: e.target.value })}
          icon={<Calendar size={16} />}
        />

        {/* Service Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Service Type
          </label>
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
          <label className="text-xs font-semibold text-muted-foreground block">
            Vehicle Image
          </label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted/20 hover:file:bg-muted/40 transition-colors file:text-sm file:font-semibold"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all"
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
