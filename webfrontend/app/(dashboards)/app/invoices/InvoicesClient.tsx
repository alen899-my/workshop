"use client";

import React, { useState, useMemo, useRef } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { 
  Receipt, Eye, FileText, User as UserIcon, Calendar, 
  Search, ExternalLink, Printer, Edit, Trash2
} from "lucide-react";
import { Bill, billService } from "@/services/bill.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useCurrency } from "@/lib/currency";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useToast } from "@/components/ui/WorkshopToast";
import { RepairDetailsModal } from "@/components/repair/RepairDetailsModal";

interface InvoicesClientProps {
  initialData: Bill[];
  currencyCode?: string;
}

export default function InvoicesClient({ initialData, currencyCode = 'INR' }: InvoicesClientProps) {
  const router = useRouter();
  const { can } = useRBAC();
  const { toast } = useToast();
  const { format } = useCurrency({ shopCurrency: currencyCode });

  const [bills, setBills] = useState<Bill[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal states
  const [selectedBillForView, setSelectedBillForView] = useState<Bill | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  const pendingDeleteIdRef = useRef<number | null>(null);

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const q = search.toLowerCase();
      const inSearch = 
        !search || 
        b.vehicle_number?.toLowerCase().includes(q) || 
        b.owner_name?.toLowerCase().includes(q) || 
        b.id?.toString().includes(q);
      
      const inStatus = !filterStatus || b.status === filterStatus;
      
      return inSearch && inStatus;
    });
  }, [bills, search, filterStatus]);

  const activeFilterCount = [filterStatus].filter(Boolean).length;

  const handleReset = () => {
    setSearch("");
    setFilterStatus("");
  };

  const columns: ColumnDef<Bill>[] = [
  
    {
      key: "vehicle",
      header: "Vehicle & Owner",
      renderCell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm uppercase tracking-tight">
            {row.vehicle_number}
          </span>
          <div className="flex items-center gap-1 mt-0.5 opacity-70">
            <UserIcon size={10} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
              {row.owner_name || 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "date",
      header: "Issued Date",
      className: "hidden md:table-cell",
      renderCell: (row) => (
        <div className="flex flex-col">
           <span className="text-xs text-muted-foreground">
             {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
           </span>
           <span className="text-[10px] text-muted-foreground/50 font-mono">
             {row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
           </span>
        </div>
      )
    },
    
    {
      key: "total_amount",
      header: "Amount",
      sortable: true,
      className: "text-right",
      renderCell: (row) => (
        <span className="text-sm font-bold text-success-foreground bg-success/10 px-2 py-0.5 rounded border border-success/20">
          {format(row.total_amount)}
        </span>
      )
    }
  ];

  const handleOpenViewModal = (row: Bill) => {
    if (can("view:repairs")) {
       // Convert/Pass as a partial repair object since RepairDetailsModal expects that
       setSelectedBillForView({
          ...row,
          id: row.repair_id, // For handleDownloadPdf/handleShareWhatsApp in Modal which use repair.id
       } as any);
       setIsViewModalOpen(true);
    } else {
       toast({ type: "error", title: "Access Denied", description: "You don't have permission to view bills" });
    }
  };

  const handleEditBill = (row: Bill) => {
    if (can("edit:repair")) {
       router.push(`/app/repairs/bill/${row.repair_id}`);
    } else {
       toast({ type: "error", title: "Access Denied", description: "You don't have permission to edit bills" });
    }
  };

  const handlePrint = (row: Bill) => {
    router.push(`/app/repairs/bill/${row.repair_id}?action=print`);
  };

  const handleDeleteBill = (row: Bill) => {
    if (!can("edit:repair")) {
      toast({ type: "error", title: "Access Denied", description: "You don't have permission to delete bills" });
      return;
    }
    
    pendingDeleteIdRef.current = row.id!;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Invoice",
      message: `Are you sure you want to delete invoice #${row.id?.toString().padStart(5, '0')} for ${row.vehicle_number}? This will permanently remove the billing data.`,
      onConfirm: async () => {
        if (!pendingDeleteIdRef.current) return;
        const res = await billService.delete(pendingDeleteIdRef.current);
        if (res.success) {
          setBills(prev => prev.filter(b => b.id !== pendingDeleteIdRef.current));
          toast({ type: "success", title: "Deleted", description: "Invoice deleted successfully." });
        } else {
          toast({ type: "error", title: "Failed", description: res.error || "Delete failed" });
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        pendingDeleteIdRef.current = null;
      }
    });
  };

  return (
    <ModuleLayout
      title="Invoice Management"
      description="List of all generated bills and financial records."
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice #, vehicle, or owner..."
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <FilterSelect
          label="Repair Status"
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

      <div className="mt-2">
         <WorkshopTable
            data={filtered}
            columns={columns}
            actions={[
               { label: "View Bill", icon: Eye, variant: "default", onClick: handleOpenViewModal },
               { label: "Edit", icon: Edit, variant: "warning", onClick: handleEditBill },

               { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDeleteBill }
            ]}
         />
      </div>

      <RepairDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        repair={selectedBillForView}
        currencyCode={currencyCode}
        mode="bill"
      />


      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
        confirmText="Yes, Delete"
      />

      {filtered.length === 0 && (
         <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 bg-muted/20 border-2 border-dashed border-border/50 rounded-2xl mt-4">
            <Receipt size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-medium">No results matched your search</h3>
            <p className="text-[10px] mt-2 font-mono uppercase opacity-50">Try clearing filters or search terms</p>
         </div>
      )}

      {/* Info footer */}
      <div className="mt-8 flex items-center justify-between px-2 opacity-50">
         <p className="text-[10px] font-mono uppercase tracking-[0.1em]">
           Showing {filtered.length} of {bills.length} invoices
         </p>
         <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.1em]">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-success" />
               <span>Settled</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-warning" />
               <span>Pending Repair</span>
            </div>
         </div>
      </div>

    </ModuleLayout>
  );
}
