"use client";

import React, { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { ShieldHalf, Edit, Trash2, Eye } from "lucide-react";
import { Role, roleService } from "@/services/role.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

interface RolesClientProps {
  initialData: Role[];
}

export default function RolesClient({ initialData }: RolesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [roles, setRoles] = useState<Role[]>(initialData);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loadingView, setLoadingView] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const baseRoles = roles.filter(r => r.slug !== 'admin');

  const filtered = useMemo(() => {
    return baseRoles.filter((r) => {
      const q = search.toLowerCase();
      if (search && !r.name?.toLowerCase().includes(q) && !r.slug?.toLowerCase().includes(q)) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [roles, search, filterStatus]);

  const activeFilterCount = [filterStatus].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Role>[] = [
    {
      key: "name",
      header: "Role Name",
      sortable: true,
      className: "font-semibold text-foreground tracking-tight",
      renderCell: (row) => (
        <div className="flex items-center gap-2">
           <ShieldHalf size={14} className="text-primary opacity-60" />
           <span>{row.name}</span>
        </div>
      )
    },
    {
      key: "slug",
      header: "Slug",
      className: "text-muted-foreground",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      renderCell: (row) => (
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block",
          row.status === "active"
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {row.status}
        </div>
      )
    }
  ];

  const handleCreate = () => router.push("/app/roles/create");
  const handleEdit = (row: Role) => router.push(`/app/roles/edit/${row.id}`);

  const handleDelete = async (row: Role) => {
    if (!confirm(`Are you sure you want to delete role: ${row.name}?`)) return;
    const res = await roleService.delete(row.id);
    if (res.success) {
      setRoles(prev => prev.filter(r => r.id !== row.id));
      toast({ type: "success", title: "Deleted", description: "Role deleted successfully." });
    }
  };

  const handleView = async (row: Role) => {
    setLoadingView(true);
    const res = await roleService.getById(row.id);
    setLoadingView(false);
    if (res.success && res.data) {
      setSelectedRole(res.data);
      setIsViewModalOpen(true);
    }
  };

  return (
    <ModuleLayout
      title="Roles"
      description="Define and manage workshop roles and their permission levels."
      buttonLabel="Add Role"
      onButtonClick={handleCreate}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by role name or slug..."
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          placeholder="All Statuses"
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

      {/* Role View Modal */}
      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Role Details"
        subtitle={`Viewing details for role: ${selectedRole?.name}`}
        width="lg"
        footer={
           <div className="flex justify-end gap-3">
              <WorkshopButton variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                 Close
              </WorkshopButton>
           </div>
        }
      >
        {selectedRole && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Name</p>
                  <p className="text-sm font-bold text-foreground">{selectedRole.name}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-bold uppercase text-primary">{selectedRole.status}</p>
               </div>
            </div>

            <div className="bg-muted/30 p-4 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Slug</p>
               <code className="text-[13px] text-primary font-bold">{selectedRole.slug}</code>
            </div>

            <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Permissions</p>
               {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                 <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRole.permissions.map(p => (
                      <span key={p} className="px-2 py-1 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-primary font-bold uppercase">
                         {p}
                      </span>
                    ))}
                 </div>
               ) : (
                 <p className="text-xs text-muted-foreground">No permissions assigned.</p>
               )}
            </div>

            <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
               <p className="text-[12px] leading-relaxed text-foreground/70">
                 {selectedRole.description || "No description provided."}
               </p>
            </div>
          </div>
        )}
      </WorkshopModal>
    </ModuleLayout>
  );
}
