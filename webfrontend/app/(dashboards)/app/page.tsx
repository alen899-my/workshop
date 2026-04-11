"use client";

import React, { useEffect, useState } from "react";
import {
  Wrench,
  PlusCircle,
  Car,
  Users,
  Clock,
  DollarSign,
  Eye,
  UserCheck,
  Activity,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { repairService, Repair } from "@/services/repair.service";
import { cn } from "@/lib/utils";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { useRBAC } from "@/lib/rbac";

export default function WorkshopDashboard() {
  const { user, can, loading: rbacLoading } = useRBAC();
  const [stats, setStats] = useState({
    totalRepairs: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
    avgCompletionHours: "0",
    recentRepairs: [] as Repair[],
    workers: [] as { id: number; name: string; role: string; active_jobs: number }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const res = await repairService.getSummaryStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    const symbol = user?.shopCurrency || "INR";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: symbol.length === 3 ? symbol : "INR",
    }).format(val);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: "Billed to customers",
      icon: DollarSign,
      bg: "bg-emerald-600",
    },
    {
      title: "In Progress",
      value: stats.pendingRepairs,
      description: "Active repair jobs",
      icon: Activity,
      bg: "bg-amber-500",
    },
    {
      title: "Avg. Completion",
      value: `${stats.avgCompletionHours}h`,
      description: "Per repair job",
      icon: Clock,
      bg: "bg-primary",
    },
    {
      title: "Vehicles Serviced",
      value: stats.totalRepairs,
      description: "All time total",
      icon: Car,
      bg: "bg-violet-600",
    },
  ];

  const quickLinks = [
    { label: "New Repair", href: "/app/repairs/create", icon: PlusCircle, primary: true },
    { label: "All Repairs", href: "/app/repairs", icon: Wrench },
    { label: "Vehicles", href: "/app/vehicles", icon: Car },
    { label: "Invoices", href: "/app/invoices", icon: DollarSign },
  ];

  if (loading || rbacLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted rounded-xl" />
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Permission Check ──
  if (!can("dashboard:view")) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">
            Overview
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening at{" "}
            <span className="font-semibold text-foreground">{user?.shopName}</span> today.
          </p>
        </div>
       
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-5 flex flex-col justify-between gap-5 text-white shadow-sm",
              "hover:shadow-md hover:brightness-105 transition-all duration-200",
              card.bg
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold opacity-85 uppercase tracking-wider leading-snug">
                {card.title}
              </p>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-95",
                link.primary
                  ? "bg-primary border-primary text-primary-foreground shadow-sm hover:brightness-110"
                  : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <link.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                  link.primary ? "text-primary-foreground" : "text-primary"
                )}
              />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Repairs ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Wrench size={14} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Repairs</h3>
              {stats.recentRepairs.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">
                  {stats.recentRepairs.length}
                </span>
              )}
            </div>
            <Link
              href="/app/repairs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all
              <ChevronRight size={12} />
            </Link>
          </div>

          {/* Table body */}
          {stats.recentRepairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Wrench size={18} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No repairs recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentRepairs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  {/* Left: vehicle info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                      {r.vehicle_image ? (
                        <img
                          src={r.vehicle_image}
                          className="w-full h-full object-cover"
                          alt={r.vehicle_number}
                        />
                      ) : (
                        <Car size={15} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.vehicle_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.model_name} &mdash; {r.owner_name}
                      </p>
                    </div>
                  </div>

                  {/* Right: badges + action */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <WorkshopBadge
                      variant={r.status === "Completed" ? "success" : "warning"}
                      size="xs"
                    >
                      {r.status}
                    </WorkshopBadge>
                    <WorkshopBadge
                      variant={(r.payment_status || "Unpaid") === "Paid" ? "success" : "warning"}
                      size="xs"
                      dot
                    >
                      {r.payment_status || "Unpaid"}
                    </WorkshopBadge>
                    <Link
                      href={`/app/repairs/${r.id}`}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="View repair"
                    >
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Staff on Duty ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <UserCheck size={14} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Staff on Duty</h3>
            {stats.workers.length > 0 && (
              <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full ml-auto">
                {stats.workers.length}
              </span>
            )}
          </div>

          {stats.workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Users size={18} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground text-center px-6">
                No staff assigned yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.workers.map((worker) => (
                <Link
                  key={worker.id}
                  href={`/app/users/${worker.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {worker.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {worker.role.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {worker.active_jobs > 0 && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {worker.active_jobs} job{worker.active_jobs !== 1 ? "s" : ""}
                      </span>
                    )}
                    {worker.active_jobs === 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Idle
                      </span>
                    )}
                    <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}