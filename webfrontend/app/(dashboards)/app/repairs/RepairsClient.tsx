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
      const rep = repairs.find((r: Repair) => r && r.id.toString() === autoViewId);
      if (rep) handleView(rep);
    }
  }, [searchParams, repairs]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [recordStatus, setRecordStatus] = useState("Active");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterWorker, setFilterWorker] = useState("");

  // Fetch data when filters change (with slight debounce for search)
  useEffect(() => {
    const fetchFiltered = async () => {
      const res = await repairService.getAll({
        recordStatus,
        status: filterStatus,
        serviceType: filterServiceType,
        vehicleType: filterVehicleType,
        worker: filterWorker,
        search
      });
      if (res.success) setRepairs(res.data);
    };

    const timeoutId = setTimeout(fetchFiltered, 300);
    return () => clearTimeout(timeoutId);
  }, [recordStatus, filterStatus, filterServiceType, filterVehicleType, filterWorker, search]);

  const filtered = repairs; // Data is already filtered by backend

  const activeFilterCount = [
    filterStatus, 
    recordStatus === 'Active' ? '' : 'Archived',
    filterServiceType,
    filterVehicleType,
    filterWorker
  ].filter(Boolean).length;

  const uniqueWorkers = useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map(r => r.attending_worker_name)
      .filter((w): w is string => !!w && !seen.has(w) && !!seen.add(w))
      .map(w => ({ value: w, label: w }));
  }, [repairs]);

  const uniqueServiceTypes = useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map(r => r.service_type)
      .filter((s): s is string => !!s && !seen.has(s) && !!seen.add(s))
      .map(s => ({ value: s, label: s }));
  }, [repairs]);

  const uniqueVehicleTypes = useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map(r => r.vehicle_type)
      .filter((v): v is string => !!v && !seen.has(v) && !!seen.add(v))
      .map(v => ({ value: v, label: v }));
  }, [repairs]);

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
    setRecordStatus("Active");
    setFilterServiceType("");
    setFilterVehicleType("");
    setFilterWorker("");
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
      header: "Repair Status",
      sortable: true,
      renderCell: (row) => {
        const statusMap: Record<string, any> = {
          "Pending": "warning",
          "Started": "info",
          "In Progress": "secondary",
          "Completed": "success"
        };
        return (
          <div className="flex flex-col gap-1.5 items-start">
            <WorkshopBadge 
              variant={statusMap[row.status] || "muted"} 
              size="xs"
            >
              {row.status}
            </WorkshopBadge>

            {row.bill_id ? (
              <WorkshopBadge 
                variant={(row.payment_status || 'Unpaid') === 'Paid' ? "success" : "warning"}
                size="xs"
                dot
              >
                {row.payment_status || 'Unpaid'}
              </WorkshopBadge>
            ) : (
              <WorkshopBadge variant="muted" size="xs">
                No Bill
              </WorkshopBadge>
            )}
          </div>
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
      title: "Delete Repair Record",
      message: `Delete repair record for ${row.vehicle_number}? This will NOT delete the vehicle or customer from your registry.`,
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const targetId = pendingDeleteRef.current.id; // Capture id before nullifying
        const res = await repairService.delete(targetId);
        if (res.success) {
          setRepairs((prev: Repair[]) => prev.filter((r: Repair) => r && r.id !== targetId));
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
        <FilterSelect
          label="Service Type"
          value={filterServiceType}
          onChange={setFilterServiceType}
          options={uniqueServiceTypes}
          placeholder="All Services"
        />
        <FilterSelect
          label="Vehicle Type"
          value={filterVehicleType}
          onChange={setFilterVehicleType}
          options={uniqueVehicleTypes}
          placeholder="All Types"
        />
        <FilterSelect
          label="Worker Assigned"
          value={filterWorker}
          onChange={setFilterWorker}
          options={uniqueWorkers}
          placeholder="Any Worker"
        />
        <FilterSelect
          label="Record Status"
          value={recordStatus}
          onChange={setRecordStatus}
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Archived" },
          ]}
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
