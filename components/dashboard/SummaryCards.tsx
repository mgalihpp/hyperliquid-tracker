"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountSummary } from "@/lib/types";
import { formatUsd, formatUsdWithSign } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  summary: AccountSummary;
}

interface SummaryCardData {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: SummaryCardData[] = [
    {
      title: "Account Value",
      value: formatUsd(summary.accountValue),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      trend: "neutral",
    },
    {
      title: "Unrealized PnL",
      value: formatUsdWithSign(summary.totalUnrealizedPnl),
      subtitle:
        summary.accountValue > 0
          ? `${((summary.totalUnrealizedPnl / summary.accountValue) * 100).toFixed(2)}%`
          : undefined,
      icon:
        summary.totalUnrealizedPnl >= 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        ),
      trend: summary.totalUnrealizedPnl >= 0 ? "up" : "down",
    },
    {
      title: "Margin Used",
      value: formatUsd(summary.totalMarginUsed),
      subtitle:
        summary.accountValue > 0
          ? `${((summary.totalMarginUsed / summary.accountValue) * 100).toFixed(1)}% of account`
          : undefined,
      icon: <Landmark className="h-4 w-4 text-muted-foreground" />,
      trend: "neutral",
    },
    {
      title: "Withdrawable",
      value: formatUsd(summary.withdrawable),
      subtitle:
        summary.accountValue > 0
          ? `${((summary.withdrawable / summary.accountValue) * 100).toFixed(1)}% available`
          : undefined,
      icon: <PiggyBank className="h-4 w-4 text-muted-foreground" />,
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight",
                card.trend === "up" && "text-green-500",
                card.trend === "down" && "text-red-500"
              )}
            >
              {card.value}
            </div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty state for when there's no data
export function EmptySummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {["Account Value", "Unrealized PnL", "Margin Used", "Withdrawable"].map(
        (title) => (
          <Card key={title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-muted-foreground">
                --
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No wallet selected
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
