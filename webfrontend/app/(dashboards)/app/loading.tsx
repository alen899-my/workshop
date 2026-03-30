import { cn } from "@/lib/utils";

export default function GlobalDashboardLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-primary/10 rounded-full animate-pulse" />
          <div className="h-10 w-64 bg-muted/40 rounded-2xl animate-pulse" />
          <div className="h-4 w-96 bg-muted/20 rounded-lg animate-pulse" />
        </div>
        <div className="h-12 w-40 bg-primary/20 rounded-2xl animate-pulse" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-14 w-full bg-card border border-border/40 rounded-[1.5rem] flex items-center px-6 gap-4 shadow-sm animate-pulse">
        <div className="w-5 h-5 bg-muted/40 rounded-md" />
        <div className="h-4 w-48 bg-muted/30 rounded" />
        <div className="ml-auto flex gap-2">
            <div className="h-8 w-24 bg-muted/20 rounded-xl" />
            <div className="h-8 w-8 bg-muted/20 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-[2.5rem] border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="bg-muted/30 px-8 py-5 border-b border-border/40 flex items-center gap-12">
            <div className="h-3 w-8 bg-muted/40 rounded-full" />
            <div className="h-3 w-48 bg-muted/40 rounded-full" />
            <div className="h-3 w-32 bg-muted/40 rounded-full ml-auto sm:ml-0" />
            <div className="hidden sm:block h-3 w-40 bg-muted/40 rounded-full" />
            <div className="hidden lg:block h-3 w-32 bg-muted/40 rounded-full ml-auto" />
        </div>
        <div className="divide-y divide-border/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-8 py-6 flex items-center gap-12 animate-pulse">
                <div className="h-4 w-6 bg-muted/20 rounded tabular-nums" />
                <div className="flex items-center gap-4 flex-1 sm:flex-none">
                    <div className="w-12 h-12 bg-muted/40 rounded-2xl" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted/40 rounded-lg" />
                        <div className="h-3 w-20 bg-muted/20 rounded-md" />
                    </div>
                </div>
                <div className="hidden sm:block h-3 w-32 bg-muted/20 rounded-full" />
                <div className="hidden lg:block h-8 w-24 bg-primary/5 border border-primary/10 rounded-full ml-auto" />
                <div className="flex gap-2 ml-auto lg:ml-0">
                    <div className="h-9 w-9 bg-muted/40 rounded-xl" />
                    <div className="h-9 w-9 bg-muted/40 rounded-xl" />
                </div>
            </div>
          ))}
        </div>
        <div className="bg-muted/10 px-8 py-4 border-t border-border/40 flex justify-between items-center">
            <div className="h-4 w-40 bg-muted/30 rounded" />
            <div className="flex gap-1">
                <div className="h-8 w-8 bg-muted/30 rounded-lg" />
                <div className="h-8 w-8 bg-muted/30 rounded-lg" />
                <div className="h-8 w-8 bg-muted/30 rounded-lg" />
            </div>
        </div>
      </div>
    </div>
  );
}
