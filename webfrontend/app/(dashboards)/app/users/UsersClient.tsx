"use client";

import React, { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { Building2, Edit, Trash2, Shield, Phone, Eye } from "lucide-react";
import { User, userService } from "@/services/user.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

interface UsersClientProps {
  initialData: User[];
  shopId?: number;
}

export default function UsersClient({ initialData, shopId }: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [users, setUsers] = useState<User[]>(initialData);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const uniqueRoles = useMemo(() => {
    const seen = new Set<string>();
    return users
      .map((u) => ({ value: u.role, label: (u as any).role_name || u.role?.replace("_", " ") || u.role }))
      .filter((r) => r.value && !seen.has(r.value) && seen.add(r.value));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      if (search && !u.name?.toLowerCase().includes(q) && !u.phone?.toLowerCase().includes(q)) return false;
      if (filterStatus && u.status !== filterStatus) return false;
      if (filterRole && u.role !== filterRole) return false;
      return true;
    });
  }, [users, search, filterStatus, filterRole]);

  const activeFilterCount = [filterStatus, filterRole].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
    setFilterRole("");
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      className: "font-semibold text-foreground tracking-tight",
      renderCell: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-foreground">
             {row.name || "Anonymous User"}
           </span>
           <span className={cn(
             "text-[10px] px-1.5 py-0.5 rounded-sm border inline-block w-fit mt-1",
             row.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
             row.role === 'shop_owner' ? 'bg-primary/10 text-primary border-primary/20' :
             'bg-muted/30 text-muted-foreground border-border'
           )}>
             {(row as any).role_name || (row.role ? row.role.replace('_', ' ') : 'Unassigned')}
           </span>
        </div>
      )
    },
    {
      key: "phone",
      header: "Contact",
      renderCell: (row) => (
        <div className="flex items-center gap-2 text-muted-foreground">
           <Phone size={12} className="opacity-60" />
           <span className="text-sm">{row.phone}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
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
    },
    {
      key: "shop_name",
      header: "Shop",
      renderCell: (row) => (
        <div className="flex items-center gap-2">
           <Building2 size={12} className="text-muted-foreground/40" />
           <span className="text-sm text-muted-foreground">
              {(row as any).shop_name || "Direct"}
           </span>
        </div>
      )
    }
  ];

  const handleCreate = () => router.push("/app/users/create");
  const handleEdit = (row: User) => router.push(`/app/users/edit/${row.id}`);
  const handleView = (row: User) => { setSelectedUser(row); setIsViewModalOpen(true); };

  const handleDelete = async (row: User) => {
    if (!confirm(`Are you sure you want to delete user: ${row.name}?`)) return;
    const res = await userService.delete(row.id);
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== row.id));
      toast({ type: "success", title: "Deleted", description: "User deleted successfully." });
    }
  };

  return (
    <ModuleLayout
      title="Users"
      description="Manage workshop team members and their access levels."
      buttonLabel="Add User"
      onButtonClick={handleCreate}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or phone..."
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
        <FilterSelect
          label="Role"
          value={filterRole}
          onChange={setFilterRole}
          options={uniqueRoles}
          placeholder="All Roles"
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
        title="User Details"
        subtitle="Viewing registration details for this team member."
        footer={
           <div className="flex justify-end">
              <WorkshopButton variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                 Close
              </WorkshopButton>
           </div>
        }
      >
        {selectedUser && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-sm font-bold text-foreground">{selectedUser.name}</p>
               </div>
            </div>

            <div className="bg-muted/30 p-4 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Role / Access Level</p>
               <div className="flex items-center gap-2 mt-1">
                  <Shield size={14} className="text-primary" />
                  <p className="text-sm font-semibold">{(selectedUser as any).role_name || selectedUser.role}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Contact Number</p>
                  <p className="text-sm font-medium">{selectedUser.phone}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Account Status</p>
                  <div className={cn(
                    "text-xs font-bold uppercase",
                    selectedUser.status === "active" ? "text-green-500" : "text-red-500"
                  )}>
                    {selectedUser.status}
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-border">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Assigned Workshop</p>
               <div className="flex items-center gap-2 mt-1">
                  <Building2 size={14} className="text-muted-foreground/60" />
                  <p className="text-sm font-medium">{(selectedUser as any).shop_name || "Direct / Unassigned"}</p>
               </div>
            </div>
          </div>
        )}
      </WorkshopModal>
    </ModuleLayout>
  );
}
