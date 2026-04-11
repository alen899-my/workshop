"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Calendar, Wrench, Eye, Trash2, Clock, AlertCircle, CheckCircle2, ShieldCheck, FileText, Receipt, Plus } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { WorkshopTable, ColumnDef, ActionButton } from "@/components/common/Workshoptable";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Vehicle, vehicleService } from "@/services/vehicle.service";
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

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
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

                // Fetch vehicle details
                const vehicleRes = await vehicleService.getById(parseInt(vehicleId));
                if (vehicleRes.success && vehicleRes.data) {
                    setVehicle(vehicleRes.data);
                } else {
                    toast({ type: "error", title: "Error", description: "Failed to load vehicle" });
                    router.push("/app/vehicles");
                    return;
                }

                // Fetch all repairs and filter by vehicle
                const repairsRes = await repairService.getAll();
                if (repairsRes.success) {
                    const vehicleRepairs = repairsRes.data.filter(r => r.vehicle_number === vehicleRes.data?.vehicle_number);
                    setRepairs(vehicleRepairs);
                }
            } catch (error) {
                toast({ type: "error", title: "Error", description: "Failed to load data" });
            } finally {
                setLoading(false);
            }
        };

        if (vehicleId) {
            fetchData();
        }
    }, [vehicleId, toast, router]);

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
            (r.status?.toLowerCase().includes(q) ?? false) ||
            (r.service_type?.toLowerCase().includes(q) ?? false) ||
            (r.attending_worker_name?.toLowerCase().includes(q) ?? false)
        );
    }, [repairs, search]);

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return <CheckCircle2 size={16} className="text-green-500" />;
            case "pending":
                return <Clock size={16} className="text-yellow-500" />;
            case "in-progress":
                return <AlertCircle size={16} className="text-primary" />;
            default:
                return <AlertCircle size={16} className="text-gray-500" />;
        }
    };

    const repairColumns: ColumnDef<Repair>[] = [
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
                        <span className="text-sm capitalize font-medium text-foreground">{repair.status || 'Pending'}</span>
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
        },
        {
            key: "owner_name",
            header: "Owner",
            renderCell: (repair) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{repair.owner_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={12} />
                        {repair.phone_number}
                    </span>
                </div>
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
                description="Fetching vehicle details"
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                        <p className="text-muted-foreground">Loading vehicle details...</p>
                    </div>
                </div>
            </ModuleLayout>
        );
    }

    if (!vehicle) {
        return (
            <ModuleLayout
                title="Vehicle Not Found"
                description="The requested vehicle does not exist"
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Unable to load vehicle details</p>
                        <WorkshopButton variant="primary" onClick={() => router.push("/app/vehicles")}>
                            Back to Vehicles
                        </WorkshopButton>
                    </div>
                </div>
            </ModuleLayout>
        );
    }

    const config = VEHICLE_CONFIG.find(c => c.id === vehicle.vehicle_type) || VEHICLE_CONFIG[0];
    const Icon = config.icon;

    return (
        <ModuleLayout
            title={`${vehicle.vehicle_number} • ${vehicle.model_name}`}
            description={`Owner: ${vehicle.owner_name} • Type: ${vehicle.vehicle_type} • Member since ${new Date(vehicle.created_at).toLocaleDateString()}`}
        >
            <div className="flex flex-col gap-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Registry
                </button>

                {/* Combined Vehicle Information Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Side - Image and Basic Stats */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="relative w-full aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-border bg-muted/20 shadow-xl group">
                            {vehicle.vehicle_image ? (
                                <Image 
                                    src={vehicle.vehicle_image} 
                                    alt={vehicle.model_name} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-muted/50 to-muted/20">
                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20" style={{ backgroundColor: config.color }}>
                                        <Icon size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">No vehicle image</p>
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">{vehicle.vehicle_type}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Detailed Metadata */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Profile Info */}
                        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm flex flex-col justify-between min-h-[160px]">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Vehicle specs</p>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">{vehicle.vehicle_number}</h2>
                                <p className="text-sm font-bold text-muted-foreground">{vehicle.model_name}</p>
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Repairs</span>
                                    <span className="text-lg font-black text-foreground">{repairs.length}</span>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold uppercase border border-green-500/20 w-fit mt-1">Active Registry</span>
                                </div>
                            </div>
                        </div>

                        {/* Owner Info */}
                        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-4 min-h-[160px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Owner profile</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground border border-border">
                                    <Eye size={20} className="text-muted-foreground/40" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-base font-black text-foreground tracking-tight truncate">{vehicle.owner_name}</span>
                                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Phone size={12} className="text-primary" />
                                        {vehicle.owner_phone}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-auto flex items-center gap-2 text-xs font-medium text-muted-foreground pt-4 border-t border-border/50">
                                <Calendar size={14} className="text-primary/60" />
                                Member Since: {new Date(vehicle.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Location/Workshop info */}
                        <div className="md:col-span-2 p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                                    <Wrench size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Registered At</span>
                                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{vehicle.shop_name}</span>
                                </div>
                            </div>
                            <WorkshopButton
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/app/repairs/create?vehicle=' + vehicle.vehicle_number)}
                            >
                                <Plus size={14} className="mr-2" /> New Repair
                            </WorkshopButton>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-border my-2" />

                {/* Repairs Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-base font-black tracking-tight text-foreground uppercase">Service history</h3>
                            <p className="text-xs text-muted-foreground font-medium">Timeline of all maintenance for this vehicle</p>
                        </div>
                    </div>

                    <FilterBar
                        searchPlaceholder="Search by service type, status or worker..."
                        search={search}
                        onSearchChange={setSearch}
                        onReset={() => setSearch("")}
                    />

                    <WorkshopTable
                        columns={repairColumns}
                        data={filtered}
                        actions={repairActions}
                        emptyText="No repair records found for this vehicle"
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
