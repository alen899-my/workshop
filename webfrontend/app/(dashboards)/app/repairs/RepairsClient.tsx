"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import {
  Car, Phone, User as UserIcon, Calendar, Plus, X, ShieldCheck, Tag, Wrench,
  Search, ChevronRight, MoreHorizontal, Hammer, Edit, Trash2, Eye, FileText, Receipt
} from "lucide-react";
import { Repair, repairService } from "@/services/repair.service";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { RepairDetailsModal } from "@/components/repair/RepairDetailsModal";

interface RepairsClientProps {
  initialData: Repair[];
  currencyCode?: string;
}

export default function RepairsClient({ initialData, currencyCode = 'INR' }: RepairsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();
  const { symbol } = useCurrency({ shopCurrency: currencyCode });

  const [repairs, setRepairs] = useState<Repair[]>(initialData);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<Repair | null>(null);
  const searchParams = useSearchParams();

  // ── Auto-View Sync ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    const autoViewId = searchParams.get('view');
    if (autoViewId && repairs.length > 0) {
      const rep = repairs.find((r: Repair) => r.id.toString() === autoViewId);
      if (rep) handleView(rep);
    }
  }, [searchParams, repairs]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    return repairs.filter((r: Repair) => {
      const q = search.toLowerCase();
      if (search && !r.vehicle_number?.toLowerCase().includes(q) && !r.owner_name?.toLowerCase().includes(q)) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [repairs, search, filterStatus]);

  const activeFilterCount = [filterStatus].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Repair>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      sortable: true,
      className: "font-normal text-foreground tracking-tight",
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-normal text-foreground">
            {row.vehicle_number}
          </span>
          <WorkshopBadge variant="muted" size="xs" className="mt-1">
            {row.owner_name || 'N/A'}
          </WorkshopBadge>
        </div>
      )
    },
    {
      key: "date",
      header: "Repair Date",
      className: "hidden sm:table-cell",
      renderCell: (row) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={12} className="opacity-60" />
          <span className="text-sm">{row.repair_date ? new Date(row.repair_date).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      renderCell: (row) => {
        const statusMap: Record<string, any> = {
          "Pending": "warning",
          "Started": "info",
          "In Progress": "secondary",
          "Completed": "success"
        };
        return (
          <WorkshopBadge 
            variant={statusMap[row.status] || "muted"} 
            size="xs"
          >
            {row.status}
          </WorkshopBadge>
        );
      }
    },
    {
      key: "worker",
      header: "Worker",
      className: "hidden lg:table-cell",
      renderCell: (row) => (
        <div className="flex items-center gap-2">
          <Wrench size={12} className="text-muted-foreground/40" />
          <span className="text-sm text-muted-foreground">
            {row.attending_worker_name || "Unassigned"}
          </span>
        </div>
      )
    }
  ];

  const handleCreate = () => {
    if (can("create:repair")) router.push("/app/repairs/create");
    else toast({ type: "error", title: "Access Denied", description: "You don't have permission to create pairs" });
  }

  const handleEdit = (row: Repair) => {
    if (can("edit:repair")) router.push(`/app/repairs/edit/${row.id}`);
    else toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
  };

  const handleView = async (row: Repair) => {
    if (can("view:repairs")) {
      setSelectedRepair(row);
      setIsViewModalOpen(true);
    } else toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
  };

  const handleBill = (row: Repair) => {
    if (can("view:repairs")) router.push(`/app/repairs/bill/${row.id}`);
    else toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
  };

  const handleDelete = (row: Repair) => {
    if (!can("delete:repair")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    pendingDeleteRef.current = row;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Repair",
      message: `Are you sure you want to delete repair for vehicle: ${row.vehicle_number}?`,
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const res = await repairService.delete(pendingDeleteRef.current.id);
        if (res.success) {
          setRepairs((prev: Repair[]) => prev.filter((r: Repair) => r.id !== pendingDeleteRef.current!.id));
          toast({ type: "success", title: "Deleted", description: "Repair record deleted successfully." });
        } else {
          toast({ type: "error", title: "Error", description: res.error || "Failed to delete" });
        }
        setConfirmConfig((prev: any) => ({ ...prev, isOpen: false }));
        pendingDeleteRef.current = null;
      }
    });
  };

  return (
    <ModuleLayout
      title="Repairs"
      description="Manage all workshop repairs, history, and status."
      buttonLabel="New Repair"
      onButtonClick={handleCreate}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by vehicle number or owner..."
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "Pending", label: "Pending" },
            { value: "Started", label: "Started" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <WorkshopTable
        data={filtered}
        columns={columns}
        actions={[
          { label: "Bill", icon: Receipt, variant: "success", onClick: handleBill },
          { label: "View", icon: Eye, variant: "default", onClick: handleView },
          { label: "Edit", icon: Edit, variant: "warning", onClick: handleEdit },
          { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
        ]}
      />

      <RepairDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        repair={selectedRepair}
        currencyCode={currencyCode}
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
        onCancel={() => setConfirmConfig((prev: any) => ({ ...prev, isOpen: false }))}
      />
    </ModuleLayout>
  );
}
