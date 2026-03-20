"use client";

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
import {
  formatUsdWithSign,
  formatPrice,
  formatSize,
  getLiqDistanceColor,
  cn,
} from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PositionTableProps {
  positions: PositionData[];
  walletAddress?: string;
}

export function PositionTable({ positions, walletAddress }: PositionTableProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Minus className="h-5 w-5" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Open Positions</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {walletAddress
                ? "This wallet has no open perpetual positions."
                : "Select a wallet to view positions."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort positions by position value (largest first)
  const sortedPositions = [...positions].sort(
    (a, b) => b.positionValue - a.positionValue
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Open Positions
          <Badge variant="secondary" className="ml-2">
            {positions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Coin</TableHead>
                <TableHead className="w-[70px]">Side</TableHead>
                <TableHead className="text-right w-[90px]">Size</TableHead>
                <TableHead className="text-right w-[100px]">Entry</TableHead>
                <TableHead className="text-right w-[100px]">Mark</TableHead>
                <TableHead className="text-right w-[110px]">Unrealized PnL</TableHead>
                <TableHead className="text-right w-[100px]">Liq. Price</TableHead>
                <TableHead className="text-right w-[70px]">Leverage</TableHead>
                <TableHead className="text-right w-[100px]">Distance to Liq</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPositions.map((position) => (
                <PositionRow key={position.coin} position={position} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface PositionRowProps {
  position: PositionData;
}

function PositionRow({ position }: PositionRowProps) {
  const isLong = position.side === "LONG";
  const isProfitable = position.unrealizedPnl >= 0;
  const liqDistanceColor = getLiqDistanceColor(position.liqDistance);
  const isLiqDanger = position.liqDistance !== null && position.liqDistance < 10;

  return (
    <TableRow className={cn("position-row", isLiqDanger && "bg-red-950/20")}>
      {/* Coin */}
      <TableCell className="font-semibold">
        <div className="flex items-center gap-1">
          {isLiqDanger && (
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          )}
          {position.coin}
        </div>
      </TableCell>

      {/* Side */}
      <TableCell>
        <Badge variant={isLong ? "long" : "short"}>
          {position.side}
        </Badge>
      </TableCell>

      {/* Size */}
      <TableCell className="text-right font-mono">
        {formatSize(position.size)}
      </TableCell>

      {/* Entry Price */}
      <TableCell className="text-right font-mono">
        ${formatPrice(position.entryPx)}
      </TableCell>

      {/* Mark Price */}
      <TableCell className="text-right font-mono">
        ${formatPrice(position.markPx)}
      </TableCell>

      {/* Unrealized PnL */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {isProfitable ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span
            className={cn(
              "font-mono font-semibold",
              isProfitable ? "text-green-500" : "text-red-500"
            )}
          >
            {formatUsdWithSign(position.unrealizedPnl)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {((position.returnOnEquity) * 100).toFixed(2)}% ROE
        </div>
      </TableCell>

      {/* Liquidation Price */}
      <TableCell className="text-right font-mono">
        {position.liquidationPx !== null ? (
          <span className={isLiqDanger ? "text-red-500 font-semibold" : ""}>
            ${formatPrice(position.liquidationPx)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>

      {/* Leverage */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="font-semibold">{position.leverage.toFixed(1)}x</span>
          <span className="text-xs text-muted-foreground">
            {position.leverageType}
          </span>
        </div>
      </TableCell>

      {/* Distance to Liquidation */}
      <TableCell className="text-right">
        {position.liqDistance !== null ? (
          <span className={cn("font-mono font-semibold", liqDistanceColor)}>
            {position.liqDistance.toFixed(2)}%
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>
    </TableRow>
  );
}
