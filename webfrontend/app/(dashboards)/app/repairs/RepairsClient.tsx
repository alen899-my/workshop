"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function RepairsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { can, user } = useRBAC();
  const currencyCode = user?.shopCurrency || 'INR';
  const { symbol } = useCurrency({ shopCurrency: currencyCode });

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteRef = useRef<Repair | null>(null);
  const searchParams = useSearchParams();

  // ── Auto-View Sync ─────────────────────────────────────────────────────────
  // Guard: only auto-open once — don't re-open when filter refetches update `repairs`
  const autoViewHandled = React.useRef(false);
  React.useEffect(() => {
    const autoViewId = searchParams.get('view');
    if (autoViewId && repairs.length > 0 && !autoViewHandled.current) {
      const rep = repairs.find((r: Repair) => r && r.id.toString() === autoViewId);
      if (rep) {
        autoViewHandled.current = true;
        handleView(rep);
      }
    }
  }, [searchParams, repairs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Hardcoded service type options (matches create/edit form)
  const SERVICE_TYPE_OPTIONS = [
    { value: "Repair",       label: "Repair" },
    { value: "Servicing",    label: "Servicing" },
    { value: "Inspection",   label: "Inspection" },
    { value: "Modification", label: "Modification" },
    { value: "Other",        label: "Other" },
  ];

  // Fetch data when filters change (debounced for search/dates)
  useEffect(() => {
    const fetchFiltered = async () => {
      const res = await repairService.getAll({
        status: filterStatus,
        serviceType: filterServiceType,
        vehicleType: filterVehicleType,
        worker: filterWorker,
        dateFrom,
        dateTo,
        search
      });
      if (res.success) setRepairs(res.data);
      else toast({ type: "error", title: "Fetch Error", description: res.error || "Failed to load repairs" });
    };

    const timeoutId = setTimeout(fetchFiltered, 300);
    return () => clearTimeout(timeoutId);
  }, [filterStatus, filterServiceType, filterVehicleType, filterWorker, dateFrom, dateTo, search]);

  const filtered = repairs; // Already filtered server-side

  const activeFilterCount = [
    filterStatus,
    filterServiceType,
    filterVehicleType,
    filterWorker,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const uniqueWorkers = React.useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map(r => r.attending_worker_name)
      .filter((w): w is string => !!w && !seen.has(w) && !!seen.add(w))
      .map(w => ({ value: w, label: w }));
  }, [repairs]);

  const uniqueVehicleTypes = React.useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map(r => r.vehicle_type)
      .filter((v): v is string => !!v && !seen.has(v) && !!seen.add(v))
      .map(v => ({ value: v, label: v }));
  }, [repairs]);

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
    setFilterServiceType("");
    setFilterVehicleType("");
    setFilterWorker("");
    setDateFrom("");
    setDateTo("");
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
          <span className="text-sm">
            {row.repair_date
              ? (() => { const d = new Date(row.repair_date); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; })()
              : 'N/A'}
          </span>
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
    else toast({ type: "error", title: "Access Denied", description: "You don't have permission to create repairs" });
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
          label="Repair Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "Pending",     label: "Pending" },
            { value: "Started",     label: "Started" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed",   label: "Completed" },
          ]}
          placeholder="All Statuses"
        />
        <FilterSelect
          label="Service Type"
          value={filterServiceType}
          onChange={setFilterServiceType}
          options={SERVICE_TYPE_OPTIONS}
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
        {/* Date Range */}
        <div className="flex flex-col gap-2 min-w-[150px]">
          <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 ml-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] font-bold text-foreground outline-none cursor-pointer transition-all duration-300 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-2 min-w-[150px]">
          <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 ml-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] font-bold text-foreground outline-none cursor-pointer transition-all duration-300 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm"
          />
        </div>
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
