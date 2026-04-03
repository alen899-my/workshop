"use client";

import React, { useState, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Car, User, Phone, MapPin, Edit, Trash2, Eye, Save, Image as ImageIcon, Search, ExternalLink } from "lucide-react";
import { Vehicle, vehicleService } from "@/services/vehicle.service";
import { Customer, customerService } from "@/services/customer.service";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { useRBAC } from "@/lib/rbac";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function VehiclesClient({ initialVehicles = [], initialCustomers = [] }: { initialVehicles?: Vehicle[], initialCustomers?: Customer[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [recordStatus, setRecordStatus] = useState("Active");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<Vehicle | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch data when recordStatus changes
  React.useEffect(() => {
    fetchData();
  }, [recordStatus]);

  // Form State
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    customer_id: "" as string | number,
    vehicle_number: "",
    model_name: "",
    vehicle_type: "Car",
    vehicle_image: ""
  });
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();
  const { can } = useRBAC();
  const router = useRouter();

  const fetchData = async () => {
    const [vRes, cRes] = await Promise.all([
      vehicleService.getAll(recordStatus),
      customerService.getAll()
    ]);
    if (vRes.success) setVehicles(vRes.data);
    if (cRes.success) setCustomers(cRes.data);
  };

  const handleOpenForm = (vehicle?: Vehicle) => {
    if (vehicle) {
      if (!can("edit:vehicle")) {
        toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
        return;
      }
      setFormData({
        id: vehicle.id,
        customer_id: vehicle.customer_id,
        vehicle_number: vehicle.vehicle_number,
        model_name: vehicle.model_name,
        vehicle_type: vehicle.vehicle_type,
        vehicle_image: vehicle.vehicle_image || ""
      });
    } else {
      if (!can("create:vehicle")) {
        toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
        return;
      }
      setFormData({
        id: undefined,
        customer_id: "",
        vehicle_number: "",
        model_name: "",
        vehicle_type: "Car",
        vehicle_image: ""
      });
    }
    setFile(null);
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.vehicle_number || !formData.model_name) {
      toast({ type: "error", title: "Missing Data", description: "Customer, Number, and Model are required" });
      return;
    }

    setFormLoading(true);

    const submitData = new FormData();
    submitData.append("customer_id", String(formData.customer_id));
    submitData.append("vehicle_number", formData.vehicle_number);
    submitData.append("model_name", formData.model_name);
    submitData.append("vehicle_type", formData.vehicle_type);
    if (file) {
      submitData.append("vehicle_image", file);
    }

    const res = formData.id
      ? await vehicleService.update(formData.id, submitData)
      : await vehicleService.create(submitData);

    if (res.success) {
      toast({ type: "success", title: "Success", description: `Vehicle ${formData.id ? 'updated' : 'registered'} successfully` });
      setIsFormModalOpen(false);
      fetchData();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Operation failed" });
    }
    setFormLoading(false);
  };

  const handleView = (vehicle: Vehicle) => {
    if (!can("view:vehicles")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    router.push(`/app/vehicles/${vehicle.id}`);
  };

  const handleDelete = (vehicle: Vehicle) => {
    if (!can("delete:vehicle")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    pendingDeleteRef.current = vehicle;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Vehicle",
      message: `Are you sure you want to delete vehicle ${vehicle.vehicle_number}?`,
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const res = await vehicleService.delete(pendingDeleteRef.current.id);
        if (res.success) {
          toast({ type: "success", title: "Deleted", description: "Vehicle registration removed" });
          fetchData();
        } else {
          toast({ type: "error", title: "Error", description: res.error || "Failed to delete" });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        pendingDeleteRef.current = null;
      }
    });
  };

  const filtered = useMemo(() => {
    return vehicles.filter(v =>
      v.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
      v.model_name.toLowerCase().includes(search.toLowerCase()) ||
      v.owner_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  const columns: ColumnDef<Vehicle>[] = [
    {
      key: "vehicle_number",
      header: "Vehicle",
      sortable: true,
      renderCell: (vehicle) => {
        const config = VEHICLE_CONFIG.find(c => c.id === vehicle.vehicle_type) || VEHICLE_CONFIG[0];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-3">
            {vehicle.vehicle_image ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border shadow-sm group/thumb shrink-0">
                <Image
                  src={vehicle.vehicle_image as string}
                  alt={vehicle.model_name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
                {/* View button overlay on hover */}
                <a
                  href={vehicle.vehicle_image as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-black/55 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                  title="View full image"
                >
                  <ExternalLink size={13} className="text-white" />
                </a>
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors shrink-0"
                style={{ backgroundColor: config.color }}
              >
                <Icon size={20} strokeWidth={2.5} />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-mono font-bold text-primary uppercase leading-tight tracking-tight">{vehicle.vehicle_number}</span>
              <span className="font-bold text-foreground text-sm truncate">{vehicle.model_name}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: "owner_name",
      header: "Owner",
      renderCell: (vehicle) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <User size={12} className="text-primary/60" />
            {vehicle.owner_name}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
            <Phone size={10} />
            {vehicle.owner_phone}
          </div>
        </div>
      )
    },
    {
      key: "shop_name",
      header: "Workshop",
      className: "hidden md:table-cell",
      renderCell: (vehicle) => (
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/60">
          <MapPin size={12} />
          {vehicle.shop_name}
        </div>
      )
    }
  ];

  return (
    <ModuleLayout
      title="Vehicle Registry"
      description="Database of all registered vehicles across your fleet and their full repair history."
      buttonLabel="New Vehicle"
      onButtonClick={() => handleOpenForm()}
    >
      <div className="flex flex-col gap-6">
        <FilterBar
          searchPlaceholder="Search number, model, or owner..."
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

        <WorkshopTable
          columns={columns}
          data={filtered}
          actions={[
            { label: "View", icon: Eye, variant: "default", onClick: handleView },
            { label: "Edit", icon: Edit, variant: "warning", onClick: handleOpenForm },
            { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
          ]}
        />
      </div>

      {/* Form Modal */}
      <WorkshopModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formData.id ? "Edit Vehicle" : "New Vehicle Registration"}
        subtitle="Manage technical specifications and link vehicle to an owner profile."
        width="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <WorkshopButton variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </WorkshopButton>
            <WorkshopButton variant="primary" size="sm" onClick={handleSubmit} loading={formLoading} icon={<Save size={14} />}>
              {formData.id ? "Update Vehicle" : "Register Vehicle"}
            </WorkshopButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          {/* Owner Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Owner</label>
            <div className="relative group">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" />
              <select
                value={formData.customer_id}
                onChange={e => setFormData({ ...formData, customer_id: e.target.value ? Number(e.target.value) : "" })}
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all cursor-pointer appearance-none"
              >
                <option value="">Select Owner...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
          </div>

          {/* Type Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Category</label>
            <div className="relative group">
              <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" />
              <select
                value={formData.vehicle_type}
                onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all cursor-pointer appearance-none"
              >
                {VEHICLE_CONFIG.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
              </select>
            </div>
          </div>

          {/* Plate Number */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">License Plate No.</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-muted-foreground/40 group-focus-within:text-primary transition-colors tracking-tighter">ABC</span>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                placeholder="e.g. MH12AB1234"
                className="w-full bg-muted/40 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all uppercase"
              />
            </div>
          </div>

          {/* Model Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Model / Brand</label>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={formData.model_name}
                onChange={e => setFormData({ ...formData, model_name: e.target.value })}
                placeholder="e.g. Maruti Suzuki Swift"
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Photo</label>
            <div className="flex flex-col gap-3">

              {/* Existing / selected image — shown with a View button */}
              {(file || formData.vehicle_image) && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                    <Image
                      src={file ? URL.createObjectURL(file) : formData.vehicle_image}
                      alt="Selected"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {file ? file.name : "Current Photo"}
                    </p>
                    {file && (
                      <p className="text-[10px] text-muted-foreground/50">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    )}
                  </div>
                  {/* View in new tab */}
                  <a
                    href={file ? URL.createObjectURL(file) : formData.vehicle_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shrink-0"
                  >
                    <ExternalLink size={11} />
                    View
                  </a>
                </div>
              )}

              {/* File input */}
              <div className="relative group">
                <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                  className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:bg-background focus:border-primary/40 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </WorkshopModal>

      {/* Confirmation Modal */}
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
