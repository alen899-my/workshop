"use client";

import React, { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { Building2, Edit, Trash2, MapPin, User as UserIcon, Eye } from "lucide-react";
import { Shop, shopService } from "@/services/shop.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

interface ShopsClientProps {
  initialData: Shop[];
}

export default function ShopsClient({ initialData }: ShopsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [shops, setShops] = useState<Shop[]>(initialData);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const uniqueLocations = useMemo(() => {
    const seen = new Set<string>();
    return shops
      .filter((s) => s.location && !seen.has(s.location) && seen.add(s.location))
      .map((s) => ({ value: s.location, label: s.location }));
  }, [shops]);

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      const q = search.toLowerCase();
      if (search && !s.name?.toLowerCase().includes(q) && !(s as any).owner_name?.toLowerCase().includes(q)) return false;
      if (filterLocation && s.location !== filterLocation) return false;
      return true;
    });
  }, [shops, search, filterLocation]);

  const activeFilterCount = [filterLocation].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterLocation("");
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Shop>[] = [
    {
      key: "name",
      header: "Shop Name",
      sortable: true,
      className: "font-semibold text-foreground tracking-tight",
      renderCell: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-foreground">{row.name}</span>
        </div>
      )
    },
    {
      key: "owner_name",
      header: "Owner",
      renderCell: (row) => (
        <div className="flex items-center gap-2">
           <UserIcon size={12} className="text-primary/60" />
           <span className="text-sm font-medium text-foreground/70">{(row as any).owner_name}</span>
        </div>
      )
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-2">
           <MapPin size={12} className="text-muted-foreground/40" />
           <span className="text-sm text-muted-foreground">{row.location}</span>
        </div>
      )
    },
    {
      key: "created_at",
      header: "Joined Date",
      renderCell: (row) => (
        <span className="text-[11px] text-muted-foreground/60">
           {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )
    }
  ];

  const handleCreate = () => router.push("/app/shops/create");
  const handleEdit = (row: Shop) => router.push(`/app/shops/edit/${row.id}`);
  const handleView = (row: Shop) => { setSelectedShop(row); setIsViewModalOpen(true); };

  const handleDelete = async (row: Shop) => {
    if (!confirm(`Are you sure you want to delete shop: ${row.name}?`)) return;
    const res = await shopService.delete(row.id);
    if (res.success) {
      setShops(prev => prev.filter(s => s.id !== row.id));
      toast({ type: "success", title: "Deleted", description: "Shop deleted successfully." });
    }
  };

  return (
    <ModuleLayout
      title="Shops"
      description="Manage all workshop locations and owners in the system."
      buttonLabel="Add Shop"
      onButtonClick={handleCreate}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or owner..."
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <FilterSelect
          label="Location"
          value={filterLocation}
          onChange={setFilterLocation}
          options={uniqueLocations}
          placeholder="All Locations"
        />
      </FilterBar>

      <WorkshopTable
        data={filtered}
        columns={columns}
        actions={[
          { label: "View", icon: Eye, onClick: handleView },
          { label: "Edit", icon: Edit, onClick: handleEdit },
          { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
        ]}
      />

      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Shop Details"
        subtitle="Viewing full registration information for this shop."
        footer={
           <div className="flex justify-end">
              <WorkshopButton variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                 Close
              </WorkshopButton>
           </div>
        }
      >
        {selectedShop && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Shop Name</p>
                  <p className="text-sm font-bold text-foreground">{selectedShop.name}</p>
               </div>
            </div>

            <div className="bg-muted/30 p-4 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Owner</p>
               <div className="flex items-center gap-2 mt-1">
                  <UserIcon size={14} className="text-primary" />
                  <p className="text-sm font-semibold">{(selectedShop as any).owner_name}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-medium">{selectedShop.location}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Date Joined</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedShop.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
               </div>
            </div>
          </div>
        )}
      </WorkshopModal>
    </ModuleLayout>
  );
}
