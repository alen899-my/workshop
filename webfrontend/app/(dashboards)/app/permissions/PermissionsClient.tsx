"use client";

import React, { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { Shield, Edit, Trash2, Eye } from "lucide-react";
import { Permission, permissionService } from "@/services/permission.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useRBAC } from "@/lib/rbac";

interface PermissionsClientProps {
  initialData: Permission[];
}

export default function PermissionsClient({ initialData }: PermissionsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [permissions, setPermissions] = useState<Permission[]>(initialData);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Page level guard
  React.useEffect(() => {
    if (!can("view:permission")) {
       router.push("/app/forbidden");
    }
  }, [can, router]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const uniqueModules = useMemo(() => {
    const seen = new Set<string>();
    return permissions
      .filter((p) => p.module_name && !seen.has(p.module_name) && seen.add(p.module_name))
      .map((p) => ({ value: p.module_name, label: p.module_name }));
  }, [permissions]);

  const filtered = useMemo(() => {
    return permissions.filter((p) => {
      const q = search.toLowerCase();
      if (search &&
        !p.permission_name?.toLowerCase().includes(q) &&
        !p.module_name?.toLowerCase().includes(q) &&
        !p.slug?.toLowerCase().includes(q)
      ) return false;
      if (filterModule && p.module_name !== filterModule) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [permissions, search, filterModule, filterStatus]);

  const activeFilterCount = [filterModule, filterStatus].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterModule("");
    setFilterStatus("");
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Permission>[] = [
    {
      key: "module_name",
      header: "Module",
      sortable: true,
      className: "font-semibold text-foreground",
      renderCell: (row) => (
        <div className="flex items-center gap-2">
           <Shield size={14} className="text-primary opacity-60" />
           <span className="capitalize">{row.module_name}</span>
        </div>
      )
    },
    {
      key: "permission_name",
      header: "Permission",
      sortable: true,
      className: "font-medium",
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
            ? "bg-green-500/10 text-green-500 border border-green-500/20"
            : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {row.status}
        </div>
      )
    }
  ];

  const handleCreate = () => {
    if (!can("create:new:permission")) return toast({ type: "error", title: "Forbidden", description: "Insufficient access." });
    router.push("/app/permissions/create");
  };

  const handleEdit = (row: Permission) => router.push(`/app/permissions/edit/${row.id}`);

  const handleDelete = async (row: Permission) => {
    if (!confirm(`Are you sure you want to delete permission: ${row.permission_name}?`)) return;
    setDeletingId(row.id);
    const res = await permissionService.delete(row.id);
    setDeletingId(null);
    if (res.success) {
      setPermissions(prev => prev.filter(p => p.id !== row.id));
      toast({ type: "success", title: "Deleted", description: "Permission deleted successfully." });
    } else {
      toast({ type: "error", title: "Error", description: "Failed to delete permission." });
    }
  };

  const handleView = (row: Permission) => {
    setSelectedPermission(row);
    setIsViewModalOpen(true);
  };

  return (
    <ModuleLayout
      title="Permissions"
      description="Manage fine-grained access levels and module permissions."
      buttonLabel="Add Permission"
      onButtonClick={handleCreate}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by permission or slug..."
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <FilterSelect
          label="Module"
          value={filterModule}
          onChange={setFilterModule}
          options={uniqueModules}
          placeholder="All Modules"
        />
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
        actions={([
          { label: "View", icon: Eye, onClick: handleView },
          { label: "Edit", icon: Edit, onClick: handleEdit, hidden: () => !can("edit:permissions") },
          { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete, hidden: () => !can("delete:permission") }
        ] as any[]).filter(Boolean)}
      />

      {/* View Modal */}
      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Permission Details"
        subtitle="Viewing system permission details."
        footer={
           <div className="flex justify-end">
              <WorkshopButton variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                 Close
              </WorkshopButton>
           </div>
        }
      >
        {selectedPermission && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Module</p>
                  <p className="text-sm font-bold text-foreground capitalize">{selectedPermission.module_name}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <p className={cn(
                    "text-sm font-bold uppercase",
                    selectedPermission.status === 'active' ? 'text-green-500' : 'text-red-500'
                  )}>{selectedPermission.status}</p>
               </div>
            </div>

            <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Permission Name</p>
               <p className="text-sm font-semibold text-foreground">{selectedPermission.permission_name}</p>
            </div>

            <div className="bg-muted/30 p-4 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Slug</p>
               <code className="text-[13px] text-primary font-bold">
                 {selectedPermission.slug}
               </code>
            </div>

            <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
               <p className="text-[12px] leading-relaxed text-foreground/70">
                 {selectedPermission.description || "No description provided."}
               </p>
            </div>

            <div className="pt-4 border-t border-border/50 text-[9px] text-muted-foreground/40 italic flex justify-end">
               <span>Created: {new Date(selectedPermission.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </WorkshopModal>
    </ModuleLayout>
  );
}
