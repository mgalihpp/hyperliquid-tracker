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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PositionData } from "@/lib/types";
import { cn, formatAddress, formatPrice, formatSize, formatUsdWithSign, getLiqDistanceColor } from "@/lib/utils";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { FilterHeader, SortableHeader, TextHeader, Pager, EmptyState } from "./TableHeader";

interface PositionTableProps {
  positions: PositionData[];
  walletAddress?: string;
  showWalletColumn?: boolean;
  onSelectWallet?: (wallet: string | null) => void;
}

export function PositionTable({ positions, walletAddress, showWalletColumn = false, onSelectWallet }: PositionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "positionValue", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const coins = useMemo(() => Array.from(new Set(positions.map((p) => p.coin))).sort(), [positions]);

  const columns = useMemo<ColumnDef<PositionData>[]>(
    () => [
      ...(showWalletColumn
        ? [
            {
              id: "wallet",
              accessorKey: "wallet",
              header: () => <TextHeader label="Wallet" />,
              cell: ({ row }: { row: { original: PositionData } }) => (
                <button
                  onClick={() => onSelectWallet?.(row.original.wallet)}
                  className="font-mono text-xs hover:text-primary hover:underline cursor-pointer transition-colors"
                  title={`View ${row.original.wallet}`}
                >
                  {formatAddress(row.original.wallet, 6)}
                </button>
              ),
              enableSorting: false,
            } as ColumnDef<PositionData>,
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
            options={coins.map((c) => ({ value: c, label: c }))}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => {
          const p = row.original;
          const isLiqDanger = p.liqDistance !== null && p.liqDistance < 10;
          return (
            <div className="font-semibold flex items-center gap-1">
              {isLiqDanger && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
              {p.coin}
            </div>
          );
        },
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
              { value: "LONG", label: "LONG" },
              { value: "SHORT", label: "SHORT" },
            ]}
            filterValue={(column.getFilterValue() as string) ?? "ALL"}
            onFilterChange={(v) => column.setFilterValue(v === "ALL" ? undefined : v)}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.side === "LONG" ? "long" : "short"}>{row.original.side}</Badge>
        ),
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
        accessorKey: "entryPx",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Entry" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">${formatPrice(row.original.entryPx)}</div>,
      },
      {
        accessorKey: "markPx",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Mark" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-mono">${formatPrice(row.original.markPx)}</div>,
      },
      {
        accessorKey: "unrealizedPnl",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Unreal. PnL" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => {
          const p = row.original;
          const isProfit = p.unrealizedPnl >= 0;
          return (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                {isProfit ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={cn("font-mono font-semibold", isProfit ? "text-green-500" : "text-red-500")}>
                  {formatUsdWithSign(p.unrealizedPnl)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{(p.returnOnEquity * 100).toFixed(2)}% ROE</div>
            </div>
          );
        },
      },
      {
        accessorKey: "liquidationPx",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Liq. Price" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => {
          const p = row.original;
          const isLiqDanger = p.liqDistance !== null && p.liqDistance < 10;
          if (p.liquidationPx === null) return <div className="text-right text-muted-foreground">N/A</div>;
          return (
            <div className={cn("text-right font-mono", isLiqDanger && "text-red-500 font-semibold")}>
              ${formatPrice(p.liquidationPx)}
            </div>
          );
        },
      },
      {
        accessorKey: "leverage",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Lev" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold">{row.original.leverage.toFixed(1)}x</div>
            <div className="text-xs text-muted-foreground">{row.original.leverageType}</div>
          </div>
        ),
      },
      {
        id: "liqDistance",
        accessorFn: (row) => row.liqDistance ?? Number.POSITIVE_INFINITY,
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader label="Dist. Liq" isSorted={column.getIsSorted()} onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} rightAlign />
          </div>
        ),
        cell: ({ row }) => {
          const dist = row.original.liqDistance;
          if (dist === null) return <div className="text-right text-muted-foreground">N/A</div>;
          return (
            <div className={cn("text-right font-mono font-semibold", getLiqDistanceColor(dist))}>
              {dist.toFixed(2)}%
            </div>
          );
        },
      },
      {
        id: "positionValue",
        accessorFn: (row) => row.positionValue,
        enableHiding: true,
      },
    ],
    [showWalletColumn, coins]
  );

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting, columnFilters, columnVisibility: { positionValue: false } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<TrendingUp className="h-6 w-6 text-muted-foreground" />}
            title="No Open Positions"
            description={walletAddress ? "This wallet has no open perpetual positions." : "Select a wallet to view positions."}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Open Positions
          <Badge variant="secondary" className="ml-2">
            {table.getFilteredRowModel().rows.length}/{positions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="align-top">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No positions match filters.
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
      </CardContent>
    </Card>
  );
}
