"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { User, Phone, Car, Edit, Trash2, Eye, Calendar, MapPin, ChevronRight, Save, X } from "lucide-react";
import { Customer, customerService } from "@/services/customer.service";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { useRBAC } from "@/lib/rbac";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CustomersClient({ initialData = [] }: { initialData?: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ id: undefined as number | undefined, name: "", phone: "" });

  const { toast } = useToast();
  const { can } = useRBAC();
  const router = useRouter();

  // We use initialData from server, but keep this for manual refreshes
  const fetchCustomers = async () => {
    const res = await customerService.getAll();
    if (res.success) setCustomers(res.data);
  };

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
        if (!can("edit:customers")) {
            toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
            return;
        }
        setFormData({ id: customer.id, name: customer.name, phone: customer.phone });
    } else {
        if (!can("create:customers")) {
            toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
            return;
        }
        setFormData({ id: undefined, name: "", phone: "" });
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

  const handleView = async (customer: Customer) => {
    if (!can("view:customers")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    const res = await customerService.getById(customer.id);
    if (res.success && res.data) {
      setSelectedCustomer(res.data);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!can("delete:customers")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return;
    const res = await customerService.delete(customer.id);
    if (res.success) {
      toast({ type: "success", title: "Deleted", description: "Customer removed successfully" });
      fetchCustomers();
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
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
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{customer.name}</span>
           
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
          <div className="inline-flex items-center gap-2 px-1.5 py-0.5 rounded-sm bg-accent text-[10px] font-bold text-foreground uppercase border border-border">
            <Car size={11} />
            {customer.vehicle_count || 0} Vehicles
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
            { label: "View", icon: Eye, onClick: handleView },
            { label: "Edit", icon: Edit, onClick: handleOpenForm },
            { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
          ]}
        />
      </div>

      {/* View Modal */}
      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Customer Profile"
        subtitle="Full diagnostic and vehicle history"
        width="lg"
      >
        {selectedCustomer && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-muted/30 border border-border text-center sm:text-left">
              <div className="w-20 h-20 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center sm:items-start">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{selectedCustomer.name}</h3>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><Phone size={14} className="text-primary" /> {selectedCustomer.phone}</span>
                  <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" />
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> Since {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <h4 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center gap-3">
                 <div className="h-[1px] flex-1 bg-border" />
                 Owned Vehicles
                 <div className="h-[1px] flex-1 bg-border" />
               </h4>

               <div className="grid grid-cols-1 gap-3">
                 {selectedCustomer.vehicles?.length === 0 ? (
                    <div className="py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                        <p className="text-sm text-muted-foreground italic">No vehicles registered yet.</p>
                    </div>
                 ) : (
                    selectedCustomer.vehicles?.map((v, i) => {
                       const config = VEHICLE_CONFIG.find(vc => vc.id === v.vehicle_type) || VEHICLE_CONFIG[0];
                       const Icon = config.icon;
                       return (
                        <div 
                            key={i} 
                            onClick={() => router.push(`/app/vehicles?view=${v.id}`)}
                            className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors" style={{ color: config.color }}>
                                <Icon size={24} />
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/60">{v.vehicle_type}</span>
                                <span className="font-bold text-foreground text-sm truncate">{v.model_name}</span>
                                <span className="text-[11px] font-mono font-bold text-primary">{v.vehicle_number}</span>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-all" />
                        </div>
                       );
                    })
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
        title={formData.id ? "Edit Customer" : "New Customer"}
        subtitle="Maintain accurate customer records for communications and billing."
        width="sm"
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
        <div className="flex flex-col gap-5 py-2">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
               <div className="relative group">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all"
                  />
               </div>
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
               <div className="relative group">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all"
                  />
               </div>
            </div>
        </div>
      </WorkshopModal>
    </ModuleLayout>
  );
}
