"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { User, Phone, Car, Edit, Trash2, Eye, Calendar, MapPin, ChevronRight, Save, X, Plus, Link as LinkIcon } from "lucide-react";
import { Customer, customerService } from "@/services/customer.service";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { useRBAC } from "@/lib/rbac";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { vehicleService } from "@/services/vehicle.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CustomersClient({ initialData = [] }: { initialData?: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
    id: undefined as number | undefined, 
    name: "", 
    phone: "",
    vehicles: [] as { id?: number; vehicle_number: string; model_name: string; vehicle_type: string; mode: 'new' | 'existing' }[]
  });
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<Customer | null>(null);

  const { toast } = useToast();
  const { can } = useRBAC();
  const router = useRouter();

  // We use initialData from server, but keep this for manual refreshes
  const fetchCustomers = async () => {
    setLoading(true);
    const [cRes] = await Promise.all([
      customerService.getAll()
    ]);
    if (cRes.success) setCustomers(cRes.data);
    
    // We can also just fetch ALL vehicles using vehicleService if preferred
    const vehRes = await vehicleService.getAll();
    if (vehRes.success) setAllVehicles(vehRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
      if (!can("edit:customers")) {
        toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
        return;
      }
      setFormData({ id: customer.id, name: customer.name, phone: customer.phone, vehicles: (customer as any).vehicles || [] });
    } else {
      if (!can("create:customers")) {
        toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
        return;
      }
      setFormData({ id: undefined, name: "", phone: "", vehicles: [] });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({ type: "error", title: "Missing Data", description: "Name and Phone are required" });
      return;
    }

    setFormLoading(true);
    const { id, ...saveData } = formData;
    const res = id
      ? await customerService.update(id, saveData)
      : await customerService.create(saveData);

    if (res.success) {
      toast({ type: "success", title: "Success", description: `Customer ${formData.id ? 'updated' : 'created'} successfully` });
      setIsFormModalOpen(false);
      fetchCustomers();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Operation failed" });
    }
    setFormLoading(false);
  };

  const handleView = (customer: Customer) => {
    if (!can("view:customers")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    router.push(`/app/customers/${customer.id}`);
  };

  const handleDelete = (customer: Customer) => {
    if (!can("delete:customers")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    pendingDeleteRef.current = customer;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Customer",
      message: `Are you sure you want to delete ${customer.name}?`,
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const res = await customerService.delete(pendingDeleteRef.current.id);
        if (res.success) {
          toast({ type: "success", title: "Deleted", description: "Customer removed successfully" });
          fetchCustomers();
        } else {
          toast({ type: "error", title: "Error", description: res.error || "Failed to delete" });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        pendingDeleteRef.current = null;
      }
    });
  };

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      (c.name?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.includes(search) ?? false)
    );
  }, [customers, search]);

  const columns: ColumnDef<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      renderCell: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {(customer.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{customer.name || "Unknown"}</span>

          </div>
        </div>
      )
    },
    {
      key: "phone",
      header: "Contact",
      renderCell: (customer) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Phone size={12} className="text-primary/60" />
          {customer.phone}
        </div>
      )
    },
    {
      key: "vehicle_count",
      header: "Vehicles",
      sortable: true,
      renderCell: (customer) => (
        <div className="flex flex-wrap gap-2 max-w-[200px]">
          {customer.vehicles && customer.vehicles.length > 0 ? (
            customer.vehicles.slice(0, 2).map((v, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/20 text-[10px] font-bold text-primary">
                <Car size={10} strokeWidth={2.5} />
                <span className="font-mono tracking-tight">{v.vehicle_number}</span>
              </div>
            ))
          ) : (
            <div className="inline-flex items-center gap-2 px-1.5 py-0.5 rounded-sm bg-accent text-[10px] font-bold text-foreground uppercase border border-border">
              <Car size={11} />
              {customer.vehicle_count || 0} Vehicles
            </div>
          )}
          {customer.vehicles && customer.vehicles.length > 2 && (
            <span className="text-[10px] text-muted-foreground font-bold self-center">+{customer.vehicles.length - 2} more</span>
          )}
        </div>
      )
    },
    {
      key: "shop_name",
      header: "Workshop",
      className: "hidden md:table-cell",
      renderCell: (customer) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} />
          {customer.shop_name || 'Direct'}
        </div>
      )
    }
  ];

  return (
    <ModuleLayout
      title="Customer Network"
      description="Manage and track your loyal customer base and their associated vehicles."
      buttonLabel="New Customer"
      onButtonClick={() => handleOpenForm()}
    >
      <div className="flex flex-col gap-6">
        <FilterBar
          searchPlaceholder="Search by name or phone..."
          search={search}
          onSearchChange={setSearch}
          onReset={() => setSearch("")}
        />

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
        title={formData.id ? "Edit Customer" : "New Customer"}
        subtitle="Maintain accurate customer records for communications and billing."
        width="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <WorkshopButton variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </WorkshopButton>
            <WorkshopButton variant="primary" size="sm" onClick={handleSubmit} loading={formLoading} icon={<Save size={14} />}>
              {formData.id ? "Update Profile" : "Create Customer"}
            </WorkshopButton>
          </div>
        }
      >
        <div className="flex flex-col gap-8 py-2">
          
          {/* Section: Customer Profile */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black tracking-tight uppercase">Basic Information</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Primary owner details for the account</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <div className="relative group">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:bg-background focus:border-primary/40 transition-all font-semibold placeholder:font-normal"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact Number</label>
                <div className="relative group">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:bg-background focus:border-primary/40 transition-all font-semibold placeholder:font-normal"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Section: Vehicle Fleet */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Car size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black tracking-tight uppercase">Managed Vehicles</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Vehicles associated with this customer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    vehicles: [...prev.vehicles, { vehicle_number: "", model_name: "", vehicle_type: "Car", mode: 'new' }] 
                  }))}
                  className="px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Plus size={12} /> Add New
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    vehicles: [...prev.vehicles, { id: 0, vehicle_number: "", model_name: "", vehicle_type: "", mode: 'existing' }] 
                  }))}
                  className="px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <LinkIcon size={12} /> Link Existing
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {formData.vehicles.map((vh, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-muted/20 border border-border flex flex-col gap-4 relative group/vh hover:border-primary/20 transition-colors">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      vehicles: prev.vehicles.filter((_, i) => i !== idx)
                    }))}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 group-hover/vh:opacity-100 transition-all shadow-lg z-20 hover:scale-110 active:scale-95"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[2px] px-2 py-0.5 rounded-md border",
                      vh.mode === 'existing' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    )}>
                      {vh.mode === 'existing' ? "Registered in System" : "New Registration"}
                    </span>
                  </div>

                  {vh.mode === 'existing' ? (
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 text-primary">Search & Select Vehicle</label>
                       <select
                         value={vh.id}
                         onChange={e => {
                           const vId = Number(e.target.value);
                           const found = allVehicles.find(v => v.id === vId);
                           const newVehicles = [...formData.vehicles];
                           newVehicles[idx] = { ...newVehicles[idx], id: vId, vehicle_number: found?.vehicle_number || "" };
                           setFormData({ ...formData, vehicles: newVehicles });
                         }}
                         className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 appearance-none font-bold tracking-tight cursor-pointer shadow-sm"
                       >
                          <option value={0}>Choose a vehicle from shop database...</option>
                          {allVehicles
                            .filter(v => !formData.vehicles.some(fv => fv.id === v.id && fv !== vh)) 
                            .map(v => (
                              <option key={v.id} value={v.id}>{v.vehicle_number} — {v.model_name}</option>
                            ))
                          }
                       </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">License Plate</label>
                          <input
                            type="text"
                            value={vh.vehicle_number}
                            onChange={e => {
                              const newVehicles = [...formData.vehicles];
                              newVehicles[idx].vehicle_number = e.target.value;
                              setFormData({ ...formData, vehicles: newVehicles });
                            }}
                            placeholder="ABC 1234"
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 uppercase font-bold tracking-widest placeholder:normal-case placeholder:font-normal"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Vehicle Type</label>
                          <select
                            value={vh.vehicle_type}
                            onChange={e => {
                              const newVehicles = [...formData.vehicles];
                              newVehicles[idx].vehicle_type = e.target.value;
                              setFormData({ ...formData, vehicles: newVehicles });
                            }}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 cursor-pointer font-bold"
                          >
                            {VEHICLE_CONFIG.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Make & Model</label>
                        <input
                          type="text"
                          value={vh.model_name}
                          onChange={e => {
                            const newVehicles = [...formData.vehicles];
                            newVehicles[idx].model_name = e.target.value;
                            setFormData({ ...formData, vehicles: newVehicles });
                          }}
                          placeholder="e.g. Maruti Suzuki Swift VXI"
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {formData.vehicles.length === 0 && (
                <div className="py-12 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center gap-4 opacity-50 group hover:opacity-100 hover:border-primary/30 transition-all cursor-pointer bg-muted/10 hover:bg-primary/[0.02]"
                     onClick={() => setFormData(prev => ({ 
                       ...prev, 
                       vehicles: [...prev.vehicles, { vehicle_number: "", model_name: "", vehicle_type: "Car", mode: 'new' }] 
                     }))}
                >
                  <div className="w-16 h-16 rounded-3xl bg-muted border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 flex items-center justify-center">
                    <Car size={32} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center px-6">
                    <span className="text-xs font-black uppercase tracking-[3px] text-foreground">No Vehicles Connected</span>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                      Every customer needs at least one vehicle.<br/>
                      <span className="text-primary group-hover:underline cursor-pointer">Click here to start their fleet portfolio.</span>
                    </p>
                  </div>
                </div>
              )}
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
