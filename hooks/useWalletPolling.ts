"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { WalletData, AllMids, PositionChange } from "@/lib/types";
import { fetchWalletsData, resetClient } from "@/lib/hyperliquid";

interface UseWalletPollingOptions {
  addresses: string[];
  pollInterval: number;
  isTestnet: boolean;
  enabled?: boolean;
}

interface UseWalletPollingReturn {
  wallets: WalletData[];
  allMids: AllMids;
  isLoading: boolean;
  error: string | null;
  lastPollTime: number | null;
  refresh: () => Promise<void>;
}

/**
 * Detect changes between previous and current wallet data
 */
function detectChanges(
  prevWallets: WalletData[],
  currentWallets: WalletData[]
): PositionChange[] {
  const changes: PositionChange[] = [];

  for (const currentWallet of currentWallets) {
    const prevWallet = prevWallets.find((w) => w.address === currentWallet.address);
    if (!prevWallet) continue;

    const prevPositions = new Map(prevWallet.positions.map((p) => [p.coin, p]));
    const currentPositions = new Map(currentWallet.positions.map((p) => [p.coin, p]));

    // Check for new positions
    for (const [coin, position] of currentPositions) {
      if (!prevPositions.has(coin)) {
        changes.push({
          type: "new",
          wallet: currentWallet.address,
          coin,
          side: position.side,
          message: `New ${position.side} position opened: ${coin}`,
        });
      }
    }

    // Check for closed positions
    for (const [coin, position] of prevPositions) {
      if (!currentPositions.has(coin)) {
        changes.push({
          type: "closed",
          wallet: currentWallet.address,
          coin,
          side: position.side,
          message: `Position closed: ${coin}`,
        });
      }
    }

    // Check for significant PnL changes (>5%)
    for (const [coin, currentPos] of currentPositions) {
      const prevPos = prevPositions.get(coin);
      if (!prevPos) continue;

      const pnlChange = currentPos.unrealizedPnl - prevPos.unrealizedPnl;
      const pnlChangePercent = prevPos.marginUsed > 0 
        ? Math.abs(pnlChange / prevPos.marginUsed) * 100 
        : 0;

      if (pnlChangePercent > 5 && Math.abs(pnlChange) > 10) { // >5% and >$10 change
        changes.push({
          type: pnlChange > 0 ? "pnl_up" : "pnl_down",
          wallet: currentWallet.address,
          coin,
          previousPnl: prevPos.unrealizedPnl,
          currentPnl: currentPos.unrealizedPnl,
          message: `${coin} PnL ${pnlChange > 0 ? "increased" : "decreased"}: $${prevPos.unrealizedPnl.toFixed(2)} → $${currentPos.unrealizedPnl.toFixed(2)}`,
        });
      }

      // Check for liquidation warning
      if (
        currentPos.liqDistance !== null &&
        currentPos.liqDistance < 10 &&
        (prevPos.liqDistance === null || prevPos.liqDistance >= 10)
      ) {
        changes.push({
          type: "liq_warning",
          wallet: currentWallet.address,
          coin,
          liqDistance: currentPos.liqDistance,
          message: `WARNING: ${coin} is ${currentPos.liqDistance.toFixed(1)}% from liquidation!`,
        });
      }
    }
  }

  return changes;
}

/**
 * Show toast notifications for position changes
 */
function notifyChanges(changes: PositionChange[]): void {
  for (const change of changes) {
    switch (change.type) {
      case "new":
        toast.success(change.message, {
          description: `Wallet: ${change.wallet.slice(0, 8)}...`,
          duration: 5000,
        });
        break;
      case "closed":
        toast.info(change.message, {
          description: `Wallet: ${change.wallet.slice(0, 8)}...`,
          duration: 5000,
        });
        break;
      case "pnl_up":
        toast.success(change.message, {
          description: `Wallet: ${change.wallet.slice(0, 8)}...`,
          duration: 4000,
        });
        break;
      case "pnl_down":
        toast.warning(change.message, {
          description: `Wallet: ${change.wallet.slice(0, 8)}...`,
          duration: 4000,
        });
        break;
      case "liq_warning":
        toast.error(change.message, {
          description: `Wallet: ${change.wallet.slice(0, 8)}... - Consider reducing position!`,
          duration: 10000,
        });
        break;
    }
  }
}

/**
 * Custom hook for polling wallet data from Hyperliquid
 */
export function useWalletPolling({
  addresses,
  pollInterval,
  isTestnet,
  enabled = true,
}: UseWalletPollingOptions): UseWalletPollingReturn {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [allMids, setAllMids] = useState<AllMids>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPollTime, setLastPollTime] = useState<number | null>(null);

  const prevWalletsRef = useRef<WalletData[]>([]);
  const prevTestnetRef = useRef<boolean>(isTestnet);
  const isFirstFetchRef = useRef(true);

  // Reset client when testnet mode changes
  useEffect(() => {
    if (prevTestnetRef.current !== isTestnet) {
      resetClient();
      prevTestnetRef.current = isTestnet;
      isFirstFetchRef.current = true;
    }
  }, [isTestnet]);

  const fetchData = useCallback(async () => {
    if (addresses.length === 0) {
      setWallets([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { wallets: newWallets, allMids: newMids } = await fetchWalletsData(
        addresses,
        isTestnet
      );

      // Detect and notify changes (skip first fetch)
      if (!isFirstFetchRef.current && prevWalletsRef.current.length > 0) {
        const changes = detectChanges(prevWalletsRef.current, newWallets);
        if (changes.length > 0) {
          notifyChanges(changes);
        }
      }

      prevWalletsRef.current = newWallets;
      isFirstFetchRef.current = false;

      setWallets(newWallets);
      setAllMids(newMids);
      setLastPollTime(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
      toast.error("Failed to fetch wallet data", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addresses, isTestnet]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, pollInterval, enabled]);

  // Reset when addresses change
  useEffect(() => {
    isFirstFetchRef.current = true;
    setIsLoading(true);
  }, [addresses.join(",")]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  return {
    wallets,
    allMids,
    isLoading,
    error,
    lastPollTime,
    refresh,
  };
}
