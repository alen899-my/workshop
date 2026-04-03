"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Calendar, Wrench, Eye, Trash2, Clock,
  AlertCircle, CheckCircle2, ShieldCheck, User as UserIcon,
  Building2, Mail, Shield, MapPin, Search
} from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef, ActionButton } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { User, userService } from "@/services/user.service";
import { Repair, repairService } from "@/services/repair.service";
import { useRBAC } from "@/lib/rbac";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { cn } from "@/lib/utils";
import { RepairDetailsModal } from "@/components/repair/RepairDetailsModal";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [staff, setStaff] = useState<User | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const pendingDeleteRef = useRef<Repair | null>(null);

  const { toast } = useToast();
  const { can, user } = useRBAC();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await userService.getById(userId);
        if (userRes.success && userRes.data) {
          setStaff(userRes.data);
        } else {
          toast({ type: "error", title: "Error", description: "Failed to load staff profile" });
          router.push("/app/users");
          return;
        }
        const repairsRes = await repairService.getAll("Active", userId);
        if (repairsRes.success) {
          setRepairs(repairsRes.data);
        }
      } catch {
        toast({ type: "error", title: "Error", description: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, toast, router]);

  const handleViewRepair = (repair: Repair) => {
    if (!can("view:repairs")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    setSelectedRepair(repair);
    setIsRepairModalOpen(true);
  };

  const handleDeleteRepair = (repair: Repair) => {
    if (!can("delete:repairs")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
      return;
    }
    pendingDeleteRef.current = repair;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Repair Record",
      message: "Are you sure you want to delete this repair record from history?",
      onConfirm: async () => {
        if (!pendingDeleteRef.current) return;
        const res = await repairService.delete(pendingDeleteRef.current.id);
        if (res.success) {
          toast({ type: "success", title: "Deleted", description: "Repair record removed" });
          setRepairs(repairs.filter(r => r.id !== pendingDeleteRef.current!.id));
        } else {
          toast({ type: "error", title: "Error", description: res.error || "Failed to delete" });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        pendingDeleteRef.current = null;
      },
    });
  };

  const filtered = useMemo(() => {
    if (!search) return repairs;
    const q = search.toLowerCase();
    return repairs.filter(r =>
      (r.vehicle_number?.toLowerCase().includes(q) ?? false) ||
      (r.status?.toLowerCase().includes(q) ?? false) ||
      (r.service_type?.toLowerCase().includes(q) ?? false) ||
      (r.owner_name?.toLowerCase().includes(q) ?? false)
    );
  }, [repairs, search]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":   return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "pending":     return <Clock size={14} className="text-amber-500" />;
      case "in progress": return <AlertCircle size={14} className="text-blue-500" />;
      default:            return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const repairColumns: ColumnDef<Repair>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      renderCell: (repair) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground uppercase tracking-tight truncate">
            {repair.vehicle_number}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            {repair.model_name || "Unknown Model"}
          </span>
        </div>
      ),
    },
    {
      key: "service_type",
      header: "Service",
      renderCell: (repair) => (
        <span className="text-sm font-medium text-foreground truncate max-w-[120px] block">
          {repair.service_type}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (repair) => (
        <div className="flex items-center gap-1.5 flex-nowrap">
          {getStatusIcon(repair.status)}
          <WorkshopBadge
            variant={
              repair.status === "Completed" ? "success"
              : repair.status === "Pending" ? "warning"
              : "info"
            }
            size="xs"
          >
            {repair.status}
          </WorkshopBadge>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      renderCell: (repair) => (
        <div className="flex flex-col">
          <span className="text-xs text-foreground font-medium whitespace-nowrap">
            {repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : "N/A"}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {repair.repair_date
              ? new Date(repair.repair_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      renderCell: (repair) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{repair.owner_name}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
            <Phone size={10} />
            {repair.phone_number}
          </span>
        </div>
      ),
    },
  ];

  /* ── Loading ── */
  if (loading) {
    return (
      <ModuleLayout title="Loading Profile…" description="Fetching staff details">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </ModuleLayout>
    );
  }

  if (!staff) return null;

  /* ── Stat tiles config ── */
  const stats = [
    {
      icon: <ShieldCheck size={22} className="text-indigo-500 opacity-60" />,
      label: "Lifetime Jobs",
      value: repairs.length,
      colorClass: "bg-indigo-500/5 border-indigo-500/10",
      labelColor: "text-indigo-500/80",
    },
    {
      icon: <CheckCircle2 size={22} className="text-emerald-500 opacity-60" />,
      label: "Completed",
      value: repairs.filter(r => r.status === "Completed").length,
      colorClass: "bg-emerald-500/5 border-emerald-500/10",
      labelColor: "text-emerald-500/80",
    },
    {
      icon: <Clock size={22} className="text-amber-500 opacity-60" />,
      label: "Active Jobs",
      value: repairs.filter(r => r.status !== "Completed").length,
      colorClass: "bg-amber-500/5 border-amber-500/10",
      labelColor: "text-amber-500/80",
    },
  ];

  return (
    <ModuleLayout
      title={staff.name}
      description={` ${(staff as any).role_name || staff.role} • Active since ${new Date(staff.created_at).toLocaleDateString()}`}
    >
      <div className="flex flex-col gap-6 sm:gap-8">

        {/* ── Header Actions ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Team
          </button>
          <WorkshopBadge variant={staff.status === "active" ? "success" : "muted"} size="sm">
            {staff.status}
          </WorkshopBadge>
        </div>

        {/* ── Profile Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Identity Card */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-border bg-card shadow-sm flex flex-col items-center text-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner flex-shrink-0">
              <UserIcon size={40} strokeWidth={1.5} className="sm:hidden" />
              <UserIcon size={48} strokeWidth={1.5} className="hidden sm:block" />
            </div>

            {/* Name / Role */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                {staff.name}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {(staff as any).role_name || staff.role}
              </p>
            </div>

            <div className="w-full h-px bg-border/50" />

            {/* Meta rows */}
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                <span className="text-muted-foreground uppercase tracking-widest text-[9px] whitespace-nowrap">
                  Contact
                </span>
                <span className="text-foreground flex items-center gap-1.5 truncate">
                  <Phone size={11} className="text-primary flex-shrink-0" />
                  <span className="truncate">{staff.phone}</span>
                </span>
              </div>
           
            </div>
          </div>

          {/* Stats + Location */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-5">

            {/* Stat tiles — 1 col on xs, 3 col on sm+ */}
            <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={cn(
                    "p-4 sm:p-6 rounded-2xl border flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 sm:gap-0",
                    s.colorClass
                  )}
                >
                  {/* On mobile: icon left, text+value right */}
                  <div className="sm:mb-4">{s.icon}</div>
                  <div className="flex flex-col items-end sm:items-start sm:mt-0 flex-1">
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.15em] leading-none mb-1", s.labelColor)}>
                      {s.label}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-foreground leading-none">
                      {s.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Location strip */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary flex-shrink-0">
                  <MapPin size={16} className="sm:hidden" />
                  <MapPin size={18} className="hidden sm:block" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 leading-none mb-1">
                    Current Shop
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {(staff as any).shop_location || "N/A"}
                  </span>
                </div>
              </div>
              <WorkshopBadge variant="info" size="xs" className="self-start xs:self-auto flex-shrink-0">
                WORKER PROFILE
              </WorkshopBadge>
            </div>
          </div>
        </div>

        {/* ── Service History Table ── */}
        <div className="flex flex-col gap-4 mt-2 sm:mt-4">

          {/* Section header */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">
                Assigned Repairs
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Full work history for this team member
              </p>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest self-start xs:self-auto">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <FilterBar
            searchPlaceholder="Search vehicle, status or service…"
            search={search}
            onSearchChange={setSearch}
            onReset={() => setSearch("")}
          />

          {/* Table wrapper with horizontal scroll on small screens */}
          <div className="w-full overflow-x-auto rounded-xl">
            <WorkshopTable
              columns={repairColumns}
              data={filtered}
              actions={[
                { label: "View Details", icon: Eye, variant: "default", onClick: handleViewRepair },
                { label: "Remove from History", icon: Trash2, variant: "danger", onClick: handleDeleteRepair },
              ]}
              emptyText="No repairs assigned to this user yet."
            />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <RepairDetailsModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        repair={selectedRepair}
        currencyCode={user?.shopCurrency || "INR"}
      />

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Archive Record"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </ModuleLayout>
  );
}