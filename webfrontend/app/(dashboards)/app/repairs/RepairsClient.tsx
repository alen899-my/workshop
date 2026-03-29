"use client";

import React, { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef } from "@/components/common/Workshoptable";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { Hammer, Edit, Trash2, Eye, Wrench, Calendar, FileText, Receipt } from "lucide-react";
import { Repair, repairService } from "@/services/repair.service";
import { billService, Bill } from "@/services/bill.service";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import Image from "next/image";

interface RepairsClientProps {
  initialData: Repair[];
}

export default function RepairsClient({ initialData }: RepairsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useRBAC();

  const [repairs, setRepairs] = useState<Repair[]>(initialData);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    return repairs.filter((r) => {
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
      className: "font-semibold text-foreground tracking-tight",
      renderCell: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-foreground">
             {row.vehicle_number}
           </span>
           <span className="text-[10px] px-1.5 py-0.5 rounded-sm border inline-block w-fit mt-1 bg-muted/30 text-muted-foreground border-border">
             {row.owner_name || 'N/A'}
           </span>
        </div>
      )
    },
    {
      key: "date",
      header: "Repair Date",
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
        let colors = "bg-muted/30 text-muted-foreground border-border";
        if (row.status === "Pending") colors = "bg-orange-500/10 text-orange-500 border-orange-500/20";
        if (row.status === "Started") colors = "bg-blue-500/10 text-blue-500 border-blue-500/20";
        if (row.status === "In Progress") colors = "bg-purple-500/10 text-purple-500 border-purple-500/20";
        if (row.status === "Completed") colors = "bg-green-500/10 text-green-500 border-green-500/20";

        return (
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block border", colors)}>
            {row.status}
          </div>
        )
      }
    },
    {
      key: "worker",
      header: "Worker",
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
      setSelectedBill(null); // Reset until load
      setIsViewModalOpen(true); 

      // Attempt lazy fetch
      const billRes = await billService.getByRepairId(row.id);
      if (billRes.success && billRes.data) {
        setSelectedBill(billRes.data);
      }
    } else toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
  };

  const handleBill = (row: Repair) => {
    if (can("view:repairs")) router.push(`/app/repairs/bill/${row.id}`);
    else toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
  };

  const handleDelete = async (row: Repair) => {
    if (!can("delete:repair")) {
       toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
       return;
    }
    if (!confirm(`Are you sure you want to delete repair for vehicle: ${row.vehicle_number}?`)) return;
    const res = await repairService.delete(row.id);
    if (res.success) {
      setRepairs(prev => prev.filter(r => r.id !== row.id));
      toast({ type: "success", title: "Deleted", description: "Repair record deleted successfully." });
    }
  };

  const handleDownloadPdf = async (id: string) => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem("workshop_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repairs/${id}/pdf?action=download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ type: "error", title: "Download Failed", description: "Failed to create PDF receipt." });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareWhatsApp = async (id: string) => {
    setShareLoading(true);
    try {
      const token = localStorage.getItem("workshop_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repairs/${id}/pdf?action=store`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) throw new Error("Failed");
      const text = encodeURIComponent(`Here is the receipt for your vehicle repair: ${data.url}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } catch (e) {
      toast({ type: "error", title: "Share Failed", description: "Failed to generate public PDF link." });
    } finally {
      setShareLoading(false);
    }
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
          { label: "Bill", icon: Receipt, onClick: handleBill },
          { label: "View", icon: Eye, onClick: handleView },
          { label: "Edit", icon: Edit, onClick: handleEdit },
          { label: "Delete", icon: Trash2, variant: "danger", onClick: handleDelete }
        ]}
      />

      <WorkshopModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Repair Details"
        subtitle="Viewing detailed information for this repair job."
        footer={
           <div className="flex justify-between w-full gap-2">
              <div className="flex gap-2 flex-wrap">
                 <WorkshopButton variant="outline" size="sm" onClick={() => selectedRepair && handleDownloadPdf(selectedRepair.id.toString())} disabled={pdfLoading}>
                    {pdfLoading ? "Processing..." : "Download PDF"}
                 </WorkshopButton>
                 <WorkshopButton variant="outline" size="sm" onClick={() => selectedRepair && handleShareWhatsApp(selectedRepair.id.toString())} disabled={shareLoading}>
                    {shareLoading ? "Generating Link..." : "Share via WhatsApp"}
                 </WorkshopButton>
              </div>
              <WorkshopButton variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                 Close
              </WorkshopButton>
           </div>
        }
      >
        {selectedRepair && (
          <div className="flex flex-col gap-6">
            {selectedRepair.vehicle_image && (
              <div className="w-full h-48 relative rounded-xl overflow-hidden border">
                <Image src={selectedRepair.vehicle_image} alt="Vehicle Form" fill className="object-cover" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vehicle No</p>
                  <p className="text-sm font-bold text-foreground">{selectedRepair.vehicle_number}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Owner Name</p>
                  <p className="text-sm font-bold text-foreground">{selectedRepair.owner_name || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-foreground">{selectedRepair.phone_number || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Service Type</p>
                  <div className={"text-xs font-bold uppercase"}>
                    {selectedRepair.service_type || 'Repair'}
                  </div>
               </div>
            </div>

            <div className="bg-muted/30 p-4 border border-border rounded-xl">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center"><FileText size={12} className="mr-1" /> Complaints</p>
               <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-foreground">{selectedRepair.complaints || 'N/A'}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Repair Status</p>
                  <div className={"text-xs font-bold uppercase"}>
                    {selectedRepair.status}
                  </div>
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Repair Date</p>
                  <p className="text-sm font-medium">{selectedRepair.repair_date ? new Date(selectedRepair.repair_date).toLocaleDateString() : 'N/A'}</p>
               </div>
            </div>

            <div className="pt-4 border-t border-border">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Attending Worker</p>
               <div className="flex items-center gap-2 mt-1">
                  <Wrench size={14} className="text-muted-foreground/60" />
                  <p className="text-sm font-medium">{selectedRepair.attending_worker_name || "Unassigned"}</p>
               </div>
            </div>


            {selectedBill && (selectedBill.items?.length > 0 || selectedBill.service_charge > 0) && (
               <div className="mt-2 pt-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
                     <Receipt size={12} className="mr-1" /> Bill
                  </p>
                  
                  {selectedBill.items?.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                       {selectedBill.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs text-foreground bg-muted/10 p-2 rounded-md border border-border">
                             <span className="font-medium">{item.name} <span className="text-muted-foreground">x{item.qty}</span></span>
                             <span className="font-mono">₹{(item.cost * item.qty).toFixed(2)}</span>
                          </div>
                       ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-1">
                     <span>Service Charge</span>
                     <span className="font-mono">₹{Number(selectedBill.service_charge || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-bold text-primary pt-2 border-t border-border/50 mt-2">
                     <span>Total Amount</span>
                     <span className="font-mono">₹{Number(selectedBill.total_amount || 0).toFixed(2)}</span>
                  </div>
               </div>
            )}
            
          </div>
        )}
      </WorkshopModal>
    </ModuleLayout>
  );
}
