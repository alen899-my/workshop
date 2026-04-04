"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Building2, Edit, Trash2, Shield, Phone, Eye, Wrench } from "lucide-react";
import { User, userService } from "@/services/user.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRBAC } from "@/lib/rbac";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";

interface UsersClientProps {
  initialData: User[];
  shopId?: number;
}

export default function UsersClient({ initialData, shopId }: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [users, setUsers] = useState<User[]>(initialData);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<User | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [recordStatus, setRecordStatus] = useState("Active");
  const [filterRole, setFilterRole] = useState("");
  const [filterAccountStatus, setFilterAccountStatus] = useState("");

  // Fetch data when recordStatus changes
  useEffect(() => {
    const fetchFiltered = async () => {
      const res = await userService.getAll(recordStatus, shopId);
      if (res.success) setUsers(res.data);
    };
    fetchFiltered();
  }, [recordStatus, shopId]);

  const uniqueRoles = useMemo(() => {
    const seen = new Set<string>();
    return users
      .map((u) => ({ value: u.role, label: (u as any).role_name || u.role?.replace("_", " ") || u.role }))
      .filter((r) => r.value && r.value !== 'admin' && !seen.has(r.value) && seen.add(r.value));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      if (search && !u.name?.toLowerCase().includes(q) && !u.phone?.toLowerCase().includes(q)) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (filterAccountStatus && u.status !== filterAccountStatus) return false;
      return true;
    });
  }, [users, search, filterRole, filterAccountStatus]);

  const activeFilterCount = [
    recordStatus === 'Active' ? '' : 'Archived', 
    filterRole,
    filterAccountStatus
  ].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setRecordStatus("Active");
    setFilterRole("");
    setFilterAccountStatus("");
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
          <span className="font-medium text-foreground text-sm uppercase tracking-tight">
            {row.name || "Anonymous User"}
          </span>
          <WorkshopBadge 
            variant={row.role === 'admin' ? 'danger' : row.role === 'shop_owner' ? 'primary' : 'muted'} 
            size="xs"
            className="mt-1"
          >
            {(row as any).role_name || (row.role ? row.role.replace('_', ' ') : 'Unassigned')}
          </WorkshopBadge>
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
        <WorkshopBadge 
          variant={row.status === "active" ? "success" : "danger"} 
          size="xs"
        >
          {row.status}
        </WorkshopBadge>
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
  const handleView = (row: User) => router.push(`/app/users/${row.id}`);

  const handleDelete = (row: User) => {
    pendingDeleteRef.current = row;
    setConfirmConfig({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete user: ${row.name}?`,
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const targetId = pendingDeleteRef.current.id;
        const res = await userService.delete(targetId);
        if (res.success) {
          setUsers(prev => prev.filter(u => u.id !== targetId));
          toast({ type: "success", title: "Deleted", description: "User deleted successfully." });
        } else {
          toast({ type: "error", title: "Error", description: res.error || "Failed to delete" });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        pendingDeleteRef.current = null;
      }
    });
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
          label="Record Status"
          value={recordStatus}
          onChange={setRecordStatus}
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Archived" },
          ]}
        />
        <FilterSelect
          label="Account Status"
          value={filterAccountStatus}
          onChange={setFilterAccountStatus}
          options={[
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
          placeholder="All Accounts"
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
          { label: "View", icon: Eye, variant: "default", onClick: handleView },
          { label: "Edit", icon: Edit, variant: "warning", onClick: handleEdit },
          { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
        ]}
      />
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
