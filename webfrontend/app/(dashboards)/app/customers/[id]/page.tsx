"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone,Car, Calendar, Wrench, Eye, Trash2, Clock, AlertCircle, CheckCircle2, ShieldCheck, FileText, Receipt } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef, ActionButton } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Customer, customerService } from "@/services/customer.service";
import { Repair, repairService } from "@/services/repair.service";
import { billService, Bill } from "@/services/bill.service";
import { useRBAC } from "@/lib/rbac";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { WorkshopModal } from "@/components/common/WorkshopModal";
import { VEHICLE_CONFIG } from "@/constants/vehicles";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RepairDetailsModal } from "@/components/repair/RepairDetailsModal";

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
    const pendingDeleteRef = useRef<Repair | null>(null);

    const { toast } = useToast();
    const { can, user } = useRBAC();
    const { symbol } = useCurrency(user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch customer details
                const customerRes = await customerService.getById(parseInt(customerId));
                if (customerRes.success && customerRes.data) {
                    setCustomer(customerRes.data);
                } else {
                    toast({ type: "error", title: "Error", description: "Failed to load customer" });
                    router.push("/app/customers");
                    return;
                }

                // Fetch all repairs and filter by customer
                const repairsRes = await repairService.getAll();
                if (repairsRes.success) {
                    const customerRepairs = repairsRes.data.filter(r => r.owner_name === customerRes.data?.name);
                    setRepairs(customerRepairs);
                }
            } catch (error) {
                toast({ type: "error", title: "Error", description: "Failed to load data" });
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchData();
        }
    }, [customerId, toast, router]);

    const handleViewRepair = (repair: Repair) => {
        if (!can("view:repairs")) {
            toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
            return;
        }
        setSelectedRepair(repair);
        setSelectedBill(null);
        setIsRepairModalOpen(true);

        // Fetch bill if exists
        (async () => {
            const billRes = await billService.getByRepairId(repair.id);
            if (billRes.success && billRes.data) {
                setSelectedBill(billRes.data);
            }
        })();
    };

    const handleDeleteRepair = (repair: Repair) => {
        if (!can("delete:repairs")) {
            toast({ type: "error", title: "Access Denied", description: "You don't have permission" });
            return;
        }
        pendingDeleteRef.current = repair;
        setConfirmConfig({
            isOpen: true,
            title: "Delete Repair",
            message: "Are you sure you want to delete this repair record?",
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
            }
        });
    };

    const filtered = useMemo(() => {
        if (!search) return repairs;
        const q = search.toLowerCase();
        return repairs.filter(r =>
            (r.vehicle_number?.toLowerCase().includes(q) ?? false) ||
            (r.status?.toLowerCase().includes(q) ?? false) ||
            (r.service_type?.toLowerCase().includes(q) ?? false)
        );
    }, [repairs, search]);

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return <CheckCircle2 size={16} className="text-green-500" />;
            case "pending":
                return <Clock size={16} className="text-yellow-500" />;
            case "in-progress":
                return <AlertCircle size={16} className="text-blue-500" />;
            default:
                return <AlertCircle size={16} className="text-gray-500" />;
        }
    };

    const repairColumns: ColumnDef<Repair>[] = [
        {
            key: "vehicle_number",
            header: "Vehicle",
            sortable: true,
            renderCell: (repair) => (
                <div className="flex items-center gap-2">
                    <Car size={14} className="text-primary" />
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{repair.vehicle_number}</span>
                        <span className="text-xs text-muted-foreground">{repair.model_name}</span>
                    </div>
                </div>
            )
        },
        {
            key: "service_type",
            header: "Service Type",
            sortable: true,
            renderCell: (repair) => (
                <span className="text-sm font-medium text-foreground">{repair.service_type}</span>
            )
        },
        {
            key: "status",
            header: "Status / Payment",
            sortable: true,
            renderCell: (repair) => (
                <div className="flex flex-col gap-1.5 min-w-[100px]">
                    <div className="flex items-center gap-2">
                        {getStatusIcon(repair.status)}
                        <span className="text-sm font-medium capitalize text-foreground">{repair.status || 'Pending'}</span>
                    </div>
                    <WorkshopBadge
                        variant={(repair.payment_status || "Unpaid") === "Paid" ? "success" : "warning"}
                        size="xs"
                        dot
                    >
                        {repair.payment_status || "Unpaid"}
                    </WorkshopBadge>
                </div>
            )
        },
        {
            key: "repair_date",
            header: "Date",
            sortable: true,
            renderCell: (repair) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar size={12} />
                    {repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : "N/A"}
                </div>
            )
        },
        {
            key: "attending_worker_name",
            header: "Worker",
            renderCell: (repair) => (
                <span className="text-sm text-muted-foreground">{repair.attending_worker_name || "N/A"}</span>
            )
        }
    ];

    const repairActions: ActionButton<Repair>[] = [
        {
            label: "Details",
            icon: Eye,
            variant: "default",
            onClick: handleViewRepair
        },
        {
            label: "Delete",
            icon: Trash2,
            variant: "danger",
            onClick: handleDeleteRepair
        }
    ];

    if (loading) {
        return (
            <ModuleLayout
                title="Loading..."
                description="Fetching customer details"
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                        <p className="text-muted-foreground">Loading customer details...</p>
                    </div>
                </div>
            </ModuleLayout>
        );
    }

    if (!customer) {
        return (
            <ModuleLayout
                title="Customer Not Found"
                description="The requested customer does not exist"
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Unable to load customer details</p>
                        <WorkshopButton variant="primary" onClick={() => router.push("/app/customers")}>
                            Back to Customers
                        </WorkshopButton>
                    </div>
                </div>
            </ModuleLayout>
        );
    }

    return (
        <ModuleLayout
            title={customer.name || "Unknown Customer"}
            description={`Phone: ${customer.phone} • Vehicles: ${customer.vehicle_count || 0} • Member since ${new Date(customer.created_at).toLocaleDateString()}`}
        >
            <div className="flex flex-col gap-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Repairs Section */}
                <div>
                    <FilterBar
                        searchPlaceholder="Search by vehicle, service type or status..."
                        search={search}
                        onSearchChange={setSearch}
                        onReset={() => setSearch("")}
                    />

                    <WorkshopTable
                        columns={repairColumns}
                        data={filtered}
                        actions={repairActions}
                        emptyText="No repair records found for this customer"
                    />
                </div>
            </div>

            {/* Repair Details Modal */}
            <RepairDetailsModal
                isOpen={isRepairModalOpen}
                onClose={() => setIsRepairModalOpen(false)}
                repair={selectedRepair}
                currencyCode={user?.shopCurrency || 'INR'}
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
