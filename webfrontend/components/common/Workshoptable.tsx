"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  renderCell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface ActionButton<T> {
  label: string;
  icon?: React.ElementType;
  onClick: (row: T) => void;
  variant?: "default" | "danger" | "success";
  hidden?: (row: T) => boolean;
}

export interface WorkshopTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionButton<T>[];
  pagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyText?: string;
  showIndex?: boolean;
  caption?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  rowClassName?: (row: T, index: number) => string;
  maxHeight?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue(row: any, key: string): any {
  return key.split(".").reduce<any>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as any)[k];
    return undefined;
  }, row);
}

function matchesSearch(row: any, keys: string[], query: string): boolean {
  const q = query.toLowerCase();
  return keys.some((k) =>
    String(getValue(row, k) ?? "")
      .toLowerCase()
      .includes(q)
  );
}

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const ACTION_VARIANT = {
  default:
    "text-primary hover:bg-primary/10 hover:text-primary border-primary/20 hover:border-primary/40",
  danger:
    "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 hover:border-destructive/40",
  success:
    "text-green-600 dark:text-green-400 hover:bg-green-500/10 border-green-500/20 hover:border-green-500/40",
} as const;

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc")
    return <ChevronUp size={11} className="text-primary shrink-0" />;
  if (direction === "desc")
    return <ChevronDown size={11} className="text-primary shrink-0" />;
  return (
    <ChevronsUpDown
      size={11}
      className="text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 transition-colors"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorkshopTable<T>({
  data,
  columns,
  actions,
  pagination = true,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  emptyText = "No records found.",
  showIndex = true,
  caption,
  className,
  rowKey,
  rowClassName,
  maxHeight = "500px",
}: WorkshopTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(sorted.length / pageSize))
    : 1;
  const safePage = Math.min(page, totalPages);
  const paginated = pagination
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted;

  const handlePageSize = (v: number) => {
    setPageSize(v);
    setPage(1);
  };
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  };

  const hasActions = actions && actions.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden",
        "shadow-[0_1px_3px_0_rgb(0,0,0,0.04),0_4px_16px_0_rgb(0,0,0,0.04)]",
        className
      )}
    >

      {/* ── Table scroll wrapper ── */}
      <div 
        className="overflow-x-auto overflow-y-auto custom-scrollbar"
        style={{ maxHeight: pagination ? maxHeight : 'none' }}
      >
        <table className="w-full min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border/50 bg-muted/30">
              {showIndex && (
                <th className="w-12 px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/40 select-none">
                    #
                  </span>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3.5 whitespace-nowrap",
                    ALIGN_CLASS[col.align ?? "left"],
                    col.className
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 group rounded-md -ml-1 px-1 py-0.5 hover:bg-accent/10 transition-colors"
                    >
                      <span
                        className={cn(
                          "text-[10px] font-semibold tracking-widest uppercase transition-colors",
                          sortKey === col.key
                            ? "text-primary"
                            : "text-muted-foreground/50 group-hover:text-muted-foreground/80"
                        )}
                      >
                        {col.header}
                      </span>
                      <SortIcon
                        direction={sortKey === col.key ? sortDir : null}
                      />
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/40 select-none">
                      {col.header}
                    </span>
                  )}
                </th>
              ))}
              {hasActions && (
                <th className="px-5 py-3.5 text-right">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/40 select-none">
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (showIndex ? 1 : 0) +
                    (hasActions ? 1 : 0)
                  }
                  className="py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/50 border border-border/40">
                      <Inbox size={22} strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground/40">
                      {emptyText}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => {
                const globalIdx = pagination
                  ? (safePage - 1) * pageSize + idx
                  : idx;
                return (
                  <tr
                    key={rowKey ? rowKey(row, globalIdx) : globalIdx}
                    className={cn(
                      "transition-colors duration-100 group",
                      "hover:bg-accent/[0.04]",
                      rowClassName?.(row, globalIdx)
                    )}
                  >
                    {showIndex && (
                      <td className="px-5 py-3.5 w-12">
                        <span className="text-[11px] tabular-nums text-muted-foreground/30 font-medium">
                          {globalIdx + 1}
                        </span>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-5 py-3.5 text-[13px] text-foreground/75 whitespace-nowrap",
                          ALIGN_CLASS[col.align ?? "left"],
                          col.className
                        )}
                      >
                        {col.renderCell
                          ? col.renderCell(row, globalIdx)
                          : String(getValue(row, col.key) ?? "—")}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {actions!.map((action) => {
                            if (action.hidden?.(row)) return null;
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.label}
                                onClick={() => action.onClick(row)}
                                title={action.label}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                                  "text-[11.5px] font-medium border transition-all duration-150",
                                  "opacity-70 group-hover:opacity-100",
                                  ACTION_VARIANT[action.variant ?? "default"]
                                )}
                              >
                                {Icon && <Icon size={13} className="shrink-0" />}
                                <span className="hidden md:inline">
                                  {action.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer ── */}
      {pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 bg-muted/20 px-5 py-3.5">
          {/* Row count + page size */}
          <div className="flex items-center gap-3">
            <span className="text-[11.5px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
              {sorted.length === 0
                ? "No records"
                : `${(safePage - 1) * pageSize + 1}–${Math.min(
                    safePage * pageSize,
                    sorted.length
                  )} of ${sorted.length} rows`}
            </span>

            <div className="h-3.5 w-px bg-border/50" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/40">
                Show
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
                className={cn(
                  "rounded-lg border border-border/60 bg-background/80 px-2 py-1",
                  "text-[11.5px] font-medium text-foreground outline-none",
                  "focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]",
                  "transition-all duration-150 cursor-pointer"
                )}
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-0.5">
            <PaginationBtn
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              aria="First page"
            >
              <ChevronsLeft size={13} />
            </PaginationBtn>
            <PaginationBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria="Previous page"
            >
              <ChevronLeft size={13} />
            </PaginationBtn>

            <div className="flex items-center gap-0.5 mx-1">
              {getPageNumbers(safePage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="w-8 text-center text-[12px] text-muted-foreground/30 select-none"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(Number(p))}
                    className={cn(
                      "min-w-[32px] h-8 rounded-lg text-[12px] font-medium transition-all duration-150",
                      p === safePage
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground/60 hover:bg-accent/10 hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <PaginationBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria="Next page"
            >
              <ChevronRight size={13} />
            </PaginationBtn>
            <PaginationBtn
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              aria="Last page"
            >
              <ChevronsRight size={13} />
            </PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pagination button helper ─────────────────────────────────────────────────

function PaginationBtn({
  onClick,
  disabled,
  aria,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
        disabled
          ? "text-muted-foreground/20 cursor-not-allowed"
          : "text-muted-foreground/50 hover:bg-accent/10 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ─── Page numbers with ellipsis ───────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}