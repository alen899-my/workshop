"use client";

import React, { useEffect, useState } from "react";
import { 
  Wrench, 
  PlusCircle, 
  Car, 
  Users, 
  Clock, 
  ArrowRight, 
  DollarSign,
  Eye,
  UserCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { repairService, Repair } from "@/services/repair.service";
import { cn } from "@/lib/utils";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";
import { useRBAC } from "@/lib/rbac";

export default function WorkshopDashboard() {
  const { user } = useRBAC();
  const [stats, setStats] = useState({
    totalRepairs: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
    avgCompletionHours: "0",
    recentRepairs: [] as Repair[],
    workers: [] as {id: number; name: string; role: string; active_jobs: number}[]
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: symbol.length === 3 ? symbol : 'INR',
    }).format(val);
  };

  const dashboardCards = [
    {
      title: "Total Earnings",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      // solid emerald card
      cardBg: "bg-emerald-600",
      description: "Revenue billed to customers"
    },
    {
      title: "Jobs in Progress",
      value: stats.pendingRepairs,
      icon: Clock,
      // solid amber card
      cardBg: "bg-amber-500",
      description: "Repairs currently being worked on"
    },
    {
      title: "Average Time per Job",
      value: `${stats.avgCompletionHours} hrs`,
      icon: Zap,
      // solid indigo card
      cardBg: "bg-indigo-600",
      description: "How long each repair takes on average"
    },
    {
      title: "Vehicles Serviced",
      value: stats.totalRepairs,
      icon: Car,
      // solid slate card
      cardBg: "bg-slate-700",
      description: "Total number of vehicles seen so far"
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse p-4">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 h-96 bg-muted rounded-xl" />
           <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {getGreeting()}! 👋
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            Here's what's happening at{" "}
            <span className="font-bold text-foreground">{user?.shopName}</span> today.
          </p>
        </div>
       
      </div>

      {/* ── Solid Color Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardCards.map((card, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-5 flex flex-col justify-between gap-6 text-white shadow-md",
              card.cardBg
            )}
          >
            {/* top row: label + icon */}
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90 leading-snug">
                {card.title}
              </p>
              <div className="p-2 rounded-lg bg-white/20">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* bottom: value + description */}
            <div>
              <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
              <p className="text-xs font-medium opacity-75 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "New Repair", href: "/app/repairs/create", icon: PlusCircle, variant: "primary" },
            { label: "All Repairs", href: "/app/repairs", icon: Wrench, variant: "secondary" },
            { label: "Vehicles", href: "/app/vehicles", icon: Car, variant: "secondary" },
            { label: "Invoices", href: "/app/invoices", icon: DollarSign, variant: "secondary" },
          ].map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className={cn(
                "group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border transition-all duration-200 active:scale-95",
                link.variant === "primary"
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/10 hover:brightness-110"
                  : "bg-card border-border hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <link.icon
                className={cn(
                  "w-6 h-6 transition-transform group-hover:scale-110",
                  link.variant === "primary" ? "text-white" : "text-primary"
                )}
              />
              <span className="text-xs font-semibold">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Recent Repairs ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wrench size={15} className="text-primary" /> Recent Repairs
            </h3>
            <Link
              href="/app/repairs"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {stats.recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No repairs recorded yet.
              </p>
            ) : (
              stats.recentRepairs.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-all group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden flex-shrink-0">
                      {r.vehicle_image
                        ? <img src={r.vehicle_image} className="w-full h-full object-cover" alt={r.vehicle_number} />
                        : <Car size={18} className="text-muted-foreground/40" />
                      }
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{r.vehicle_number}</h4>
                      <p className="text-xs text-muted-foreground">
                        {r.model_name} &mdash; {r.owner_name}
                      </p>
                    </div>
                  </div>
                    <div className="flex flex-col items-end gap-1.5">
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
                        className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center pt-0.5"
                        title="View repair details"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Staff on Duty ── */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserCheck size={15} className="text-primary" /> Staff on Duty
            </h3>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {stats.workers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No staff assigned to this workshop yet.
              </div>
            ) : (
              stats.workers.map((worker, i) => (
                <Link
                  key={worker.id}
                  href={`/app/users/${worker.id}`}
                  className={cn(
                    "flex items-center justify-between p-4 hover:bg-primary/5 transition-colors active:bg-primary/10",
                    i !== stats.workers.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{worker.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {worker.role.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-primary">
                      {worker.active_jobs} active {worker.active_jobs === 1 ? "job" : "jobs"}
                    </span>
                    {/* Simple workload dots */}
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-3 h-1 rounded-full",
                            idx < worker.active_jobs ? "bg-primary" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}