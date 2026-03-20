"use client";

import { useState, useMemo, useCallback } from "react";
import { useWalletPolling } from "@/hooks/useWalletPolling";
import { WalletSelector } from "./WalletSelector";
import { SummaryCards, EmptySummaryCards } from "./SummaryCards";
import { PositionTable } from "./PositionTable";
import { AccountSkeleton } from "./AccountSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseEnvWallets,
  getPollInterval,
  isTestnet as getIsTestnet,
  formatAddress,
} from "@/lib/utils";
import type { AccountSummary, PositionData } from "@/lib/types";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  Settings,
  TestTube,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function WalletDashboard() {
  // Initialize state from env
  const [walletAddresses, setWalletAddresses] = useState<string[]>(() =>
    parseEnvWallets()
  );
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState(() => getIsTestnet());
  const pollInterval = useMemo(() => getPollInterval(), []);

  // Polling hook
  const { wallets, allMids, isLoading, error, lastPollTime, refresh } =
    useWalletPolling({
      addresses: walletAddresses,
      pollInterval,
      isTestnet,
      enabled: walletAddresses.length > 0,
    });

  // Handle wallet management
  const handleAddWallet = useCallback((address: string) => {
    setWalletAddresses((prev) => [...prev, address]);
  }, []);

  const handleRemoveWallet = useCallback((address: string) => {
    setWalletAddresses((prev) => prev.filter((w) => w !== address));
  }, []);

  const handleSelectWallet = useCallback((wallet: string | null) => {
    setSelectedWallet(wallet);
  }, []);

  // Calculate aggregated data based on selection
  const { displaySummary, displayPositions, displayWalletAddress } =
    useMemo(() => {
      if (wallets.length === 0) {
        return {
          displaySummary: null,
          displayPositions: [],
          displayWalletAddress: undefined,
        };
      }

      // If specific wallet selected
      if (selectedWallet) {
        const wallet = wallets.find((w) => w.address === selectedWallet);
        if (wallet) {
          return {
            displaySummary: wallet.summary,
            displayPositions: wallet.positions,
            displayWalletAddress: wallet.address,
          };
        }
      }

      // Aggregate all wallets
      const aggregatedSummary: AccountSummary = {
        accountValue: wallets.reduce((sum, w) => sum + w.summary.accountValue, 0),
        totalMarginUsed: wallets.reduce(
          (sum, w) => sum + w.summary.totalMarginUsed,
          0
        ),
        withdrawable: wallets.reduce((sum, w) => sum + w.summary.withdrawable, 0),
        totalUnrealizedPnl: wallets.reduce(
          (sum, w) => sum + w.summary.totalUnrealizedPnl,
          0
        ),
        totalPositionValue: wallets.reduce(
          (sum, w) => sum + w.summary.totalPositionValue,
          0
        ),
      };

      // Combine all positions
      const allPositions: PositionData[] = wallets.flatMap((w) =>
        w.positions.map((p) => ({
          ...p,
          // Add wallet prefix for identification in combined view
          coin: wallets.length > 1 ? `${p.coin}` : p.coin,
        }))
      );

      return {
        displaySummary: aggregatedSummary,
        displayPositions: allPositions,
        displayWalletAddress: undefined,
      };
    }, [wallets, selectedWallet]);

  // Format last poll time
  const lastPollTimeFormatted = useMemo(() => {
    if (!lastPollTime) return "Never";
    const seconds = Math.floor((Date.now() - lastPollTime) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }, [lastPollTime]);

  // Check for any wallet errors
  const hasErrors = wallets.some((w) => w.error);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">HL</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Hyperliquid Tracker
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Real-time perpetuals monitoring
                </p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Network Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTestnet(!isTestnet)}
                className={cn(
                  "gap-2",
                  isTestnet && "border-yellow-500/50 text-yellow-500"
                )}
              >
                {isTestnet ? (
                  <>
                    <TestTube className="h-4 w-4" />
                    <span className="hidden sm:inline">Testnet</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Mainnet</span>
                  </>
                )}
              </Button>

              {/* Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                {error ? (
                  <div className="flex items-center gap-1 text-red-500">
                    <WifiOff className="h-3 w-3" />
                    <span>Disconnected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-500">
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
                  </div>
                )}
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{lastPollTimeFormatted}</span>
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading || walletAddresses.length === 0}
                className="gap-2"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar - Wallet Selector */}
          <aside className="space-y-4">
            <WalletSelector
              wallets={walletAddresses}
              selectedWallet={selectedWallet}
              onSelectWallet={handleSelectWallet}
              onAddWallet={handleAddWallet}
              onRemoveWallet={handleRemoveWallet}
              isTestnet={isTestnet}
            />

            {/* Polling Info */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Poll Interval</span>
                  <span className="font-mono">{pollInterval / 1000}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <Badge variant={isTestnet ? "warning" : "default"}>
                    {isTestnet ? "Testnet" : "Mainnet"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coins Tracked</span>
                  <span className="font-mono">{Object.keys(allMids).length}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Error Banner */}
            {error && (
              <Card className="border-red-500/50 bg-red-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-500">
                      Error fetching data
                    </p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Wallet Error Warnings */}
            {hasErrors && !error && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-500">
                      Some wallets have errors
                    </span>
                  </div>
                  <div className="space-y-1">
                    {wallets
                      .filter((w) => w.error)
                      .map((w) => (
                        <div
                          key={w.address}
                          className="text-sm text-muted-foreground"
                        >
                          {formatAddress(w.address)}: {w.error}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {walletAddresses.length === 0 ? (
              /* Empty State */
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Settings className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Wallets Configured
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Add a wallet address using the sidebar or set the
                    NEXT_PUBLIC_WALLETS environment variable.
                  </p>
                  <div className="bg-muted rounded-md p-3 max-w-md mx-auto">
                    <code className="text-sm">
                      NEXT_PUBLIC_WALLETS=0x1234...,0x5678...
                    </code>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading && wallets.length === 0 ? (
              /* Loading State - only show when we have wallets but no data yet */
              <AccountSkeleton />
            ) : (
              /* Dashboard Content */
              <>
                {/* Summary Cards */}
                {displaySummary ? (
                  <SummaryCards summary={displaySummary} />
                ) : (
                  <EmptySummaryCards />
                )}

                {/* Selected Wallet Info */}
                {selectedWallet && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Viewing:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatAddress(selectedWallet, 8)}
                    </Badge>
                  </div>
                )}

                {/* Positions Table */}
                <PositionTable
                  positions={displayPositions}
                  walletAddress={displayWalletAddress}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Hyperliquid Wallet Tracker • Built with{" "}
              <a
                href="https://github.com/nktkas/hyperliquid"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                @nktkas/hyperliquid
              </a>
            </span>
            <span>
              {isTestnet ? "Testnet" : "Mainnet"} •{" "}
              {walletAddresses.length} wallet(s)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
