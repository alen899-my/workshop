"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { Car, User, Phone, MapPin, Edit, Trash2, Eye, Calendar, Wrench, ShieldCheck, ChevronRight, FileText, Save, Image as ImageIcon, Search } from "lucide-react";
import { Vehicle, vehicleService } from "@/services/vehicle.service";
import { Customer, customerService } from "@/services/customer.service";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { useRBAC } from "@/lib/rbac";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export function VehiclesClient({ initialVehicles = [], initialCustomers = [] }: { initialVehicles?: Vehicle[], initialCustomers?: Customer[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
    id: undefined as number | undefined, 
    customer_id: "" as string | number,
    vehicle_number: "", 
    model_name: "", 
    vehicle_type: "Car",
    vehicle_image: ""
  });

  const { toast } = useToast();
  const { can } = useRBAC();

  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchData = async () => {
    const [vRes, cRes] = await Promise.all([
      vehicleService.getAll(),
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
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.vehicle_number || !formData.model_name) {
        toast({ type: "error", title: "Missing Data", description: "Customer, Number, and Model are required" });
        return;
    }
    
    setFormLoading(true);
    const { id, ...saveData } = formData;
    const finalData = {
        ...saveData,
        customer_id: Number(saveData.customer_id)
    };
    const res = id 
        ? await vehicleService.update(id, finalData)
        : await vehicleService.create(finalData);
    
    if (res.success) {
        toast({ type: "success", title: "Success", description: `Vehicle ${formData.id ? 'updated' : 'registered'} successfully` });
        setIsFormModalOpen(false);
        fetchData();
    } else {
        toast({ type: "error", title: "Error", description: res.error || "Operation failed" });
    }
    setFormLoading(false);
  };

  const handleView = async (vehicle: Vehicle) => {
    if (!can("view:vehicles")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    const res = await vehicleService.getById(vehicle.id);
    if (res.success && res.data) {
      setSelectedVehicle(res.data);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!can("delete:vehicle")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    if (!confirm(`Are you sure you want to delete vehicle ${vehicle.vehicle_number}?`)) return;
    const res = await vehicleService.delete(vehicle.id);
    if (res.success) {
      toast({ type: "success", title: "Deleted", description: "Vehicle registration removed" });
      fetchData();
    }
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
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors"
                style={{ backgroundColor: config.color }}
            >
                <Icon size={20} strokeWidth={2.5} />
            </div>
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

      {/* View Modal */}
      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Vehicle Profile"
        subtitle="Full diagnostic and repair history"
        width="lg"
      >
        {selectedVehicle && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-muted/30 border border-border text-center sm:text-left">
              <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-muted/50 border border-border relative">
                {selectedVehicle.vehicle_image ? (
                   <Image 
                     src={selectedVehicle.vehicle_image} 
                     alt={selectedVehicle.model_name}
                     fill
                     className="object-cover"
                   />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Car size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center sm:items-start">
                <span className="text-[12px] font-mono font-black text-primary p-1 bg-primary/5 rounded-md self-center sm:self-start border border-primary/20 tracking-widest leading-none">{selectedVehicle.vehicle_number}</span>
                <h3 className="text-2xl font-black text-foreground tracking-tight mt-1">{selectedVehicle.model_name}</h3>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-1.5">
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <User size={14} className="text-primary" />
                      {selectedVehicle.owner_name}
                   </div>
                   <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" />
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Phone size={14} className="text-primary" />
                      {selectedVehicle.owner_phone}
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
               <h4 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center gap-3">
                 <div className="h-[1px] flex-1 bg-border" />
                 Repair History
                 <div className="h-[1px] flex-1 bg-border" />
               </h4>

               <div className="grid grid-cols-1 gap-4">
                 {selectedVehicle.repairs?.length === 0 ? (
                    <div className="py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border border-2 flex flex-col items-center gap-3">
                        <Wrench size={32} className="text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground italic font-medium">No previous repairs recorded.</p>
                    </div>
                 ) : (
                    selectedVehicle.repairs?.map((r, i) => (
                        <div 
                            key={i} 
                            onClick={() => router.push(`/app/repairs?view=${r.id}`)}
                            className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-12">
                                     <Wrench size={18} strokeWidth={2.5} />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/40 leading-none mb-1">REP-{r.id}</span>
                                     <span className="font-bold text-sm text-foreground">{new Date(r.repair_date).toLocaleDateString()}</span>
                                  </div>
                               </div>
                               <div className={cn(
                                 "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                 r.status === 'Completed' ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-primary/10 border-primary/20 text-primary"
                               )}>
                                 {r.status}
                               </div>
                            </div>
                            <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    ))
                 )}
               </div>
            </div>
          </div>
        )}
      </WorkshopModal>

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
                    onChange={e => setFormData({...formData, customer_id: e.target.value ? Number(e.target.value) : ""})}
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
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
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
                    onChange={e => setFormData({...formData, vehicle_number: e.target.value})}
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
                    onChange={e => setFormData({...formData, model_name: e.target.value})}
                    placeholder="e.g. Maruti Suzuki Swift"
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all"
                  />
               </div>
            </div>

            {/* Image URL (Optional) */}
            <div className="flex flex-col gap-2 md:col-span-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Photo URL</label>
               <div className="relative group">
                  <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={formData.vehicle_image}
                    onChange={e => setFormData({...formData, vehicle_image: e.target.value})}
                    placeholder="Link to storage or R2 image..."
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all"
                  />
               </div>
            </div>
        </div>
      </WorkshopModal>
    </ModuleLayout>
  );
}
