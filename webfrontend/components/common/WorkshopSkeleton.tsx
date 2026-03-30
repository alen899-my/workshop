import { cn } from "@/lib/utils";

interface WorkshopSkeletonProps {
  className?: string;
  count?: number;
}

export const WorkshopSkeleton = ({ className, count = 1 }: WorkshopSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-muted/40 rounded-xl",
            className
          )}
        />
      ))}
    </>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between py-4">
        <WorkshopSkeleton className="h-10 w-64" />
        <WorkshopSkeleton className="h-10 w-32" />
      </div>
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-border bg-muted/10">
          <WorkshopSkeleton className="h-4 w-20" />
          <WorkshopSkeleton className="h-4 w-32" />
          <WorkshopSkeleton className="h-4 w-24" />
          <WorkshopSkeleton className="h-4 w-28" />
          <WorkshopSkeleton className="h-4 w-12 ml-auto" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center">
              <WorkshopSkeleton className="h-6 w-32" />
              <WorkshopSkeleton className="h-6 w-48" />
              <WorkshopSkeleton className="h-6 w-24" />
              <WorkshopSkeleton className="h-10 w-24 rounded-full" />
              <div className="flex gap-2 ml-auto">
                <WorkshopSkeleton className="h-8 w-8 rounded-lg" />
                <WorkshopSkeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 border border-border rounded-[2rem] space-y-4">
          <div className="flex items-center gap-4">
            <WorkshopSkeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <WorkshopSkeleton className="h-4 w-32" />
              <WorkshopSkeleton className="h-3 w-20" />
            </div>
          </div>
          <WorkshopSkeleton className="h-24 w-full rounded-2xl" />
          <div className="flex justify-between">
            <WorkshopSkeleton className="h-8 w-24" />
            <WorkshopSkeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
export const FormSkeleton = () => {
    return (
        <div className="p-8 space-y-12 animate-pulse">
            <div className="space-y-3">
                <WorkshopSkeleton className="h-10 w-64" />
                <WorkshopSkeleton className="h-4 w-96 opacity-60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <WorkshopSkeleton className="h-3 w-20" />
                        <WorkshopSkeleton className="h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <WorkshopSkeleton className="h-3 w-24" />
                        <WorkshopSkeleton className="h-12 w-full" />
                    </div>
                </div>
                <div className="space-y-6">
                     <div className="space-y-2">
                        <WorkshopSkeleton className="h-3 w-16" />
                        <WorkshopSkeleton className="h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <WorkshopSkeleton className="h-3 w-32" />
                        <WorkshopSkeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
            <div className="border-t border-border pt-8 flex justify-end">
                 <WorkshopSkeleton className="h-12 w-32 rounded-xl" />
            </div>
        </div>
    )
}
