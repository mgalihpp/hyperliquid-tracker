"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";

// ── Filter + Sort header (for Coin, Side columns) ────────────────────────────

export function FilterHeader({
  label,
  isSorted,
  onToggle,
  options,
  filterValue,
  onFilterChange,
}: {
  label: string;
  isSorted: false | "asc" | "desc";
  onToggle: () => void;
  options: { value: string; label: string }[];
  filterValue: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Select value={filterValue} onValueChange={onFilterChange}>
        <SelectTrigger className="h-7 text-xs w-auto min-w-0 border-0 shadow-none px-0.5 gap-0.5 bg-transparent font-medium text-muted-foreground focus:ring-0">
          <SelectValue>{filterValue === "ALL" ? label : filterValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All {label}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={onToggle}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSorted ? (
          <ArrowUpDown className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ArrowDownUp className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </div>
  );
}

// ── Sort-only header (for Size, Entry, Mark, PnL, etc.) ──────────────────────

export function SortableHeader({
  label,
  isSorted,
  onToggle,
  rightAlign = false,
}: {
  label: string;
  isSorted: false | "asc" | "desc";
  onToggle: () => void;
  rightAlign?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 h-7 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none",
        rightAlign && "ml-auto flex-row-reverse"
      )}
    >
      {label}
      {isSorted ? (
        <ArrowUpDown className="h-3.5 w-3.5 text-foreground" />
      ) : (
        <ArrowDownUp className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}

// ── Plain text header (for Type, RO, Status, Fee) ────────────────────────────

export function TextHeader({
  label,
  rightAlign = false,
  center = false,
}: {
  label: string;
  rightAlign?: boolean;
  center?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-7",
        rightAlign && "justify-end",
        center && "justify-center"
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Pagination bar ───────────────────────────────────────────────────────────

export function Pager({
  pageIndex,
  pageCount,
  canPrevious,
  canNext,
  onPrev,
  onNext,
}: {
  pageIndex: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t px-2 py-3 text-sm">
      <span className="text-muted-foreground">
        Page {pageIndex + 1} / {Math.max(1, pageCount)}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!canPrevious}>
          Prev
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ── Table empty state ────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
