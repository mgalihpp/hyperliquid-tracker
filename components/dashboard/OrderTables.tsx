"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatAddress, formatPrice, formatSize, formatUsdWithSign } from "@/lib/utils";
import type { FillData, HistoricalOrderData, OpenOrderData } from "@/lib/types";
import { ArrowLeftRight, ClipboardList, History } from "lucide-react";
import { FilterHeader, SortableHeader, TextHeader, Pager } from "./TableHeader";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface OrderTablesProps {
  openOrders: OpenOrderData[];
  historicalOrders: HistoricalOrderData[];
  fills: FillData[];
  showWalletColumn: boolean;
}

type OrderTab = "open" | "history" | "fills";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SideBadge({ side }: { side: "BUY" | "SELL" }) {
  return <Badge variant={side === "BUY" ? "long" : "short"}>{side}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant = normalized.includes("fill")
    ? "success"
    : normalized.includes("cancel")
      ? "warning"
      : normalized.includes("reject")
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

// ── Column Definitions ────────────────────────────────────────────────────────

function useOpenColumns(showWalletColumn: boolean, openCoins: string[]): ColumnDef<OpenOrderData>[] {
  return useMemo<ColumnDef<OpenOrderData>[]>(
    () => [
      ...(showWalletColumn
        ? [
            {
              id: "wallet",
              header: () => <TextHeader label="Wallet" />,
              cell: ({ row }: { row: { original: OpenOrderData } }) => (
                <div className="font-mono text-xs">{formatAddress(row.original.wallet, 6)}</div>
              ),
              enableSorting: false,
            } as ColumnDef<OpenOrderData>,
          ]
        : []),
      {
        accessorKey: "coin",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Coin"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={openCoins.map((c) => ({ value: c, label: c }))}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <span className="font-semibold">{row.original.coin}</span>,
      },
      {
        accessorKey: "side",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Side"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={[
              { value: "BUY", label: "BUY" },
              { value: "SELL", label: "SELL" },
            ]}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <SideBadge side={row.original.side} />,
      },
      {
        accessorKey: "size",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Size" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">{formatSize(row.original.size)}</div>,
      },
      {
        accessorKey: "limitPx",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Limit" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">${formatPrice(row.original.limitPx)}</div>,
      },
      {
        accessorKey: "orderType",
        header: () => <TextHeader label="Type" center />,
        enableSorting: false,
        cell: ({ row }) => <div className="text-center text-sm">{row.original.orderType}</div>,
      },
      {
        accessorKey: "reduceOnly",
        header: () => <TextHeader label="RO" center />,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.reduceOnly ? "warning" : "outline"}>
              {row.original.reduceOnly ? "Yes" : "No"}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Placed" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{formatTime(row.original.timestamp)}</div>,
      },
    ],
    [showWalletColumn, openCoins]
  );
}

function useHistoryColumns(showWalletColumn: boolean, historyCoins: string[]): ColumnDef<HistoricalOrderData>[] {
  return useMemo<ColumnDef<HistoricalOrderData>[]>(
    () => [
      ...(showWalletColumn
        ? [
            {
              id: "wallet",
              header: () => <TextHeader label="Wallet" />,
              cell: ({ row }: { row: { original: HistoricalOrderData } }) => (
                <div className="font-mono text-xs">{formatAddress(row.original.wallet, 6)}</div>
              ),
              enableSorting: false,
            } as ColumnDef<HistoricalOrderData>,
          ]
        : []),
      {
        accessorKey: "coin",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Coin"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={historyCoins.map((c) => ({ value: c, label: c }))}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <span className="font-semibold">{row.original.coin}</span>,
      },
      {
        accessorKey: "side",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Side"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={[
              { value: "BUY", label: "BUY" },
              { value: "SELL", label: "SELL" },
            ]}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <SideBadge side={row.original.side} />,
      },
      {
        accessorKey: "status",
        header: () => <TextHeader label="Status" />,
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "originalSize",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Size" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">{formatSize(row.original.originalSize)}</div>,
      },
      {
        accessorKey: "limitPx",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Limit" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">${formatPrice(row.original.limitPx)}</div>,
      },
      {
        accessorKey: "statusTimestamp",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Updated" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{formatTime(row.original.statusTimestamp)}</div>,
      },
    ],
    [showWalletColumn, historyCoins]
  );
}

function useFillsColumns(showWalletColumn: boolean, fillsCoins: string[]): ColumnDef<FillData>[] {
  return useMemo<ColumnDef<FillData>[]>(
    () => [
      ...(showWalletColumn
        ? [
            {
              id: "wallet",
              header: () => <TextHeader label="Wallet" />,
              cell: ({ row }: { row: { original: FillData } }) => (
                <div className="font-mono text-xs">{formatAddress(row.original.wallet, 6)}</div>
              ),
              enableSorting: false,
            } as ColumnDef<FillData>,
          ]
        : []),
      {
        accessorKey: "coin",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Coin"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={fillsCoins.map((c) => ({ value: c, label: c }))}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <span className="font-semibold">{row.original.coin}</span>,
      },
      {
        accessorKey: "side",
        filterFn: "equalsString",
        header: ({ column }) => (
          <FilterHeader
            label="Side"
            isSorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
            options={[
              { value: "BUY", label: "BUY" },
              { value: "SELL", label: "SELL" },
            ]}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => <SideBadge side={row.original.side} />,
      },
      {
        accessorKey: "size",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Size" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">{formatSize(row.original.size)}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Price" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">${formatPrice(row.original.price)}</div>,
      },
      {
        accessorKey: "closedPnl",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Closed PnL" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-mono",
              row.original.closedPnl > 0 && "text-green-500",
              row.original.closedPnl < 0 && "text-red-500"
            )}
          >
            {formatUsdWithSign(row.original.closedPnl)}
          </div>
        ),
      },
      {
        id: "fee",
        accessorFn: (row) => row.fee,
        header: () => <TextHeader label="Fee" center />,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center font-mono">
            {row.original.fee.toFixed(4)} {row.original.feeToken}
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Time" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{formatTime(row.original.timestamp)}</div>,
      },
    ],
    [showWalletColumn, fillsCoins]
  );
}

// ── Table Renderer ────────────────────────────────────────────────────────────

function DataTable<TData>({
  table,
  columns,
  emptyMessage,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  columns: ColumnDef<TData>[];
  emptyMessage: string;
}) {
  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="align-top">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pager
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
        canPrevious={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
        onPrev={() => table.previousPage()}
        onNext={() => table.nextPage()}
      />
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderTables({ openOrders, historicalOrders, fills, showWalletColumn }: OrderTablesProps) {
  const [tab, setTab] = useState<OrderTab>("open");

  const [openSorting, setOpenSorting] = useState<SortingState>([{ id: "timestamp", desc: true }]);
  const [historySorting, setHistorySorting] = useState<SortingState>([{ id: "statusTimestamp", desc: true }]);
  const [fillsSorting, setFillsSorting] = useState<SortingState>([{ id: "timestamp", desc: true }]);

  const [openFilters, setOpenFilters] = useState<ColumnFiltersState>([]);
  const [historyFilters, setHistoryFilters] = useState<ColumnFiltersState>([]);
  const [fillsFilters, setFillsFilters] = useState<ColumnFiltersState>([]);

  const openCoins = useMemo(() => Array.from(new Set(openOrders.map((o) => o.coin))).sort(), [openOrders]);
  const historyCoins = useMemo(() => Array.from(new Set(historicalOrders.map((o) => o.coin))).sort(), [historicalOrders]);
  const fillsCoins = useMemo(() => Array.from(new Set(fills.map((f) => f.coin))).sort(), [fills]);

  const openColumns = useOpenColumns(showWalletColumn, openCoins);
  const historyColumns = useHistoryColumns(showWalletColumn, historyCoins);
  const fillsColumns = useFillsColumns(showWalletColumn, fillsCoins);

  const openTable = useReactTable({
    data: openOrders,
    columns: openColumns,
    state: { sorting: openSorting, columnFilters: openFilters },
    onSortingChange: setOpenSorting,
    onColumnFiltersChange: setOpenFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const historyTable = useReactTable({
    data: historicalOrders,
    columns: historyColumns,
    state: { sorting: historySorting, columnFilters: historyFilters },
    onSortingChange: setHistorySorting,
    onColumnFiltersChange: setHistoryFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const fillsTable = useReactTable({
    data: fills,
    columns: fillsColumns,
    state: { sorting: fillsSorting, columnFilters: fillsFilters },
    onSortingChange: setFillsSorting,
    onColumnFiltersChange: setFillsFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["open", "history", "fills"] as const).map((t) => {
              const labels = {
                open: `Open Orders (${openOrders.length})`,
                history: `History (${historicalOrders.length})`,
                fills: `Fills (${fills.length})`,
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "h-8 rounded-md border px-3 text-sm transition-colors",
                    tab === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  )}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Open Orders */}
      {tab === "open" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Open Orders
              <Badge variant="secondary" className="ml-2">
                {openTable.getFilteredRowModel().rows.length}/{openOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DataTable table={openTable} columns={openColumns} emptyMessage="No open orders." />
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" /> Order History
              <Badge variant="secondary" className="ml-2">
                {historyTable.getFilteredRowModel().rows.length}/{historicalOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DataTable table={historyTable} columns={historyColumns} emptyMessage="No historical orders." />
          </CardContent>
        </Card>
      )}

      {/* Recent Fills */}
      {tab === "fills" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" /> Recent Fills
              <Badge variant="secondary" className="ml-2">
                {fillsTable.getFilteredRowModel().rows.length}/{fills.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DataTable table={fillsTable} columns={fillsColumns} emptyMessage="No recent fills." />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
