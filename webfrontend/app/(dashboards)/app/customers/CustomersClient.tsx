"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ id: undefined as number | undefined, name: "", phone: "" });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<Customer | null>(null);

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
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary" />
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40"
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
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-background focus:border-primary/40"
              />
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
