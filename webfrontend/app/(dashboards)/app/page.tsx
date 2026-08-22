"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wrench, Car, Clock, DollarSign, Eye, UserCheck, Activity,
  ChevronRight, Receipt, TrendingUp, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { repairService, Repair } from "@/services/repair.service";
import { vehicleService, Vehicle } from "@/services/vehicle.service";
import { billService, Bill } from "@/services/bill.service";
import { userService } from "@/services/user.service";
import { customerService, Customer } from "@/services/customer.service";
import { useRBAC } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { WorkshopBadge } from "@/components/ui/WorkshopBadge";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_COLORS = ["#3d7a78", "#8fb8a8", "#d4622a", "#5bb0ae", "#d4a017"];

function groupByMonth(bills: Bill[]): { month: string; revenue: number }[] {
  const map = new Map<string, number>();
  for (const b of bills) {
    if (!b.created_at) continue;
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + (b.total_amount || 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, revenue]) => {
      const [y, m] = key.split("-");
      return { month: `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y.slice(2)}`, revenue };
    });
}

function groupByStatus(repairs: Repair[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of repairs) map.set(r.status, (map.get(r.status) || 0) + 1);
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function groupByVehicleType(vehicles: Vehicle[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const v of vehicles) {
    const type = v.vehicle_type || "Other";
    map.set(type, (map.get(type) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function groupByPayment(repairs: Repair[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of repairs) {
    const status = r.payment_status || "Unpaid";
    map.set(status, (map.get(status) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function topCustomers(customers: Customer[]): { name: string; value: number }[] {
  return customers
    .filter((c) => (c.vehicle_count || 0) > 0)
    .sort((a, b) => (b.vehicle_count || 0) - (a.vehicle_count || 0))
    .slice(0, 5)
    .map((c) => ({ name: c.name, value: c.vehicle_count || 0 }));
}

function ChartCard({ title, icon: Icon, children, className }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden shadow-xs", className)}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Icon size={14} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function AreaTooltip({ active, payload, label, formatCurrency }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatCurrency: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      <p className="text-muted-foreground font-medium text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload, formatCurrency }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
  formatCurrency: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{payload[0].payload.name}</p>
      <p className="text-muted-foreground font-medium">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function WorkshopDashboard() {
  const { user, can, loading: rbacLoading } = useRBAC();

  const [stats, setStats] = useState({
    totalRepairs: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
    avgCompletionHours: "0",
    recentRepairs: [] as Repair[],
    workers: [] as { id: number; name: string; role: string; active_jobs: number }[],
  });
  const [allRepairs, setAllRepairs] = useState<Repair[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [liveRepairs, setLiveRepairs] = useState<Repair[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isWorker = user?.role && !["super-admin", "admin", "shop-owner"].includes(user.role);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      setLoading(true);
      const [sRes, vRes, liveRes, billsRes, usersRes, custRes] = await Promise.all([
        repairService.getSummaryStats(),
        vehicleService.getAll(),
        repairService.getAll(),
        billService.getAll(),
        userService.getAll("active"),
        customerService.getAll(),
      ]);
      if (abort.signal.aborted) return;
      if (sRes.success && sRes.data) setStats(sRes.data);
      if (vRes.success) setAllVehicles(vRes.data || []);
      if (custRes.success) setAllCustomers(custRes.data || []);
      if (liveRes.success) {
        const all = liveRes.data || [];
        setAllRepairs(all);
        const active = all.filter((r) => r.status !== "Completed");
        if (isWorker && user?.ownerName) {
          const name = user.ownerName.toLowerCase();
          setLiveRepairs(active.filter((r) => (r.attending_worker_name || "").toLowerCase() === name));
        } else {
          setLiveRepairs(active);
        }
      }
      if (billsRes.success && billsRes.data) {
        setRecentBills(
          billsRes.data
            .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
            .slice(0, 5)
        );
      }
      if (usersRes.success) {
        const workers = usersRes.data.filter((u) => u.role === "worker" || u.role === "mechanic");
        setWorkerCount(workers.length);
      }
      setLoading(false);
    })();
    return () => abort.abort();
  }, [isWorker, user]);

  const formatCurrency = (val: number) => {
    const symbol = user?.shopCurrency || "INR";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: symbol.length === 3 ? symbol : "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const revenueData = useMemo(() => groupByMonth(recentBills), [recentBills]);
  const statusData = useMemo(() => groupByStatus(allRepairs), [allRepairs]);
  const vehicleTypeData = useMemo(() => groupByVehicleType(allVehicles), [allVehicles]);
  const paymentData = useMemo(() => groupByPayment(allRepairs), [allRepairs]);
  const topCustData = useMemo(() => topCustomers(allCustomers), [allCustomers]);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!can("dashboard:view")) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), description: "Billed to customers", icon: DollarSign, bg: "bg-primary/10 text-primary border border-primary/20", iconBg: "bg-primary/10" },
    { title: "In Progress", value: stats.pendingRepairs, description: "Active repair jobs", icon: Activity, bg: "bg-amber-500/10 text-amber-600 border border-amber-500/20", iconBg: "bg-amber-500/10" },
    { title: "Avg. Completion", value: `${stats.avgCompletionHours}h`, description: "Per repair job", icon: Clock, bg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20", iconBg: "bg-emerald-500/10" },
    { title: "Vehicles Serviced", value: stats.totalRepairs, description: "All time total", icon: Car, bg: "bg-violet-500/10 text-violet-600 border border-violet-500/20", iconBg: "bg-violet-500/10" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Overview</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || user?.ownerName?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening at <span className="font-semibold text-foreground">{user?.shopName}</span> today.
          </p>
        </div>
        <Link href="/app/repairs/create" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:brightness-110 transition-all">
          <Wrench size={16} />
          New Repair
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={cn("rounded-xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-all duration-200", card.bg)}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold opacity-85 uppercase tracking-wider leading-snug">{card.title}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", card.iconBg)}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" icon={TrendingUp}>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3d7a78" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3d7a78" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<AreaTooltip formatCurrency={formatCurrency} />} />
                <Area type="monotone" dataKey="revenue" stroke="#3d7a78" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No billing data yet</div>
          )}
        </ChartCard>

        {/* Repairs by Status */}
        <ChartCard title="Repairs by Status" icon={BarChart3}>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip formatCurrency={(v) => String(v)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {statusData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{entry.name}</span>
                    <span className="text-xs font-bold text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No repairs yet</div>
          )}
        </ChartCard>

        {/* Vehicle Types */}
        <ChartCard title="Vehicle Types" icon={Car}>
          {vehicleTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleTypeData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<PieTooltip formatCurrency={(v) => `${v} vehicles`} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {vehicleTypeData.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No vehicles yet</div>
          )}
        </ChartCard>

        {/* Payment Status */}
        <ChartCard title="Payment Status" icon={DollarSign}>
          {paymentData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip formatCurrency={(v) => String(v)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {paymentData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{entry.name}</span>
                    <span className="text-xs font-bold text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No payment data yet</div>
          )}
        </ChartCard>

        {/* Top Customers */}
        <ChartCard title="Top Customers" icon={UserCheck}>
          {topCustData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCustData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<PieTooltip formatCurrency={(v) => `${v} vehicle${v !== 1 ? "s" : ""}`} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {topCustData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No customers yet</div>
          )}
        </ChartCard>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Repairs ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Wrench size={14} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Repairs</h3>
              {liveRepairs.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">{liveRepairs.length}</span>
              )}
            </div>
            <Link href="/app/repairs" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {liveRepairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Wrench size={18} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No active repairs right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {liveRepairs.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                      {r.vehicle_image ? (
                        <img src={r.vehicle_image} className="w-full h-full object-cover" alt={r.vehicle_number} />
                      ) : (
                        <Car size={15} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.model_name} — {r.attending_worker_name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <WorkshopBadge variant="warning" size="xs">{r.status}</WorkshopBadge>
                    <Link href={`/app/repairs/${r.id}`} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="View repair">
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="flex flex-col gap-6">
          {/* Workers */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <UserCheck size={14} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Workers</h3>
              <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full ml-auto">{workerCount}</span>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Available", value: Math.max(0, workerCount - (stats.workers?.filter((w) => Number(w.active_jobs) > 0).length || 0)), color: "bg-emerald-500" },
                  { label: "On Job", value: stats.workers?.filter((w) => Number(w.active_jobs) > 0).length || 0, color: "bg-amber-500" },
                  { label: "Total", value: workerCount, color: "bg-primary" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">{item.label}</p>
                  </div>
                ))}
              </div>
              {workerCount > 0 && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, ((stats.workers?.filter((w) => Number(w.active_jobs) > 0).length || 0) / Math.max(workerCount, 1)) * 100))}%` }} />
                </div>
              )}
            </div>
            {stats.workers && stats.workers.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {stats.workers.slice(0, 4).map((worker) => (
                  <Link key={worker.id} href={`/app/users/${worker.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{worker.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{worker.role.replace("_", " ")}</p>
                      </div>
                    </div>
                    {Number(worker.active_jobs) > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {worker.active_jobs} job{Number(worker.active_jobs) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bills */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent Bills</h3>
              </div>
              <Link href="/app/invoices" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            {recentBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Receipt size={18} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No bills yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{bill.vehicle_number || `#${bill.id}`}</p>
                      {bill.owner_name && <p className="text-[10px] text-muted-foreground truncate">{bill.owner_name}</p>}
                    </div>
                    <p className="text-sm font-bold text-foreground ml-3 shrink-0">{formatCurrency(bill.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
