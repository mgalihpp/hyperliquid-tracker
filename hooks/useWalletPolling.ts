"use client";

import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WalletData, AllMids, WalletActivityData } from "@/lib/types";
import { fetchWalletsData, resetClient } from "@/lib/hyperliquid";

interface UseWalletPollingOptions {
  addresses: string[];
  pollInterval: number;
  isTestnet: boolean;
  enabled?: boolean;
  includeActivity?: boolean;
  activityAddresses?: string[];
}

interface UseWalletPollingReturn {
  wallets: WalletData[];
  walletActivities: WalletActivityData[];
  allMids: AllMids;
  isLoading: boolean;
  error: string | null;
  lastPollTime: number | null;
  refresh: () => Promise<void>;
}

function normalizeError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Failed to fetch data";
  }

  const message = err.message || "Failed to fetch data";
  if (message.includes("429") || message.toLowerCase().includes("too many requests")) {
    return "429 Too Many Requests - rate limited by Hyperliquid API. Reduce polling or track fewer wallets in orders view.";
  }

  return message;
}

export function useWalletPolling({
  addresses,
  pollInterval,
  isTestnet,
  enabled = true,
  includeActivity = false,
  activityAddresses,
}: UseWalletPollingOptions): UseWalletPollingReturn {
  const addressKey = useMemo(() => addresses.join(","), [addresses]);
  const activityAddressKey = useMemo(
    () => (activityAddresses ?? []).join(","),
    [activityAddresses]
  );

  const effectivePollInterval = includeActivity
    ? Math.max(pollInterval, 20000)
    : Math.max(pollInterval, 10000);

  const query = useQuery({
    queryKey: [
      "wallet-data",
      isTestnet,
      addressKey,
      includeActivity,
      activityAddressKey,
      effectivePollInterval,
    ],
    enabled: enabled && addresses.length > 0,
    staleTime: Math.max(5000, Math.floor(effectivePollInterval / 2)),
    refetchInterval: (q) => {
      const errorMessage = (q.state.error as Error | null)?.message ?? "";
      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("too many requests")) {
        return Math.max(effectivePollInterval * 3, 30000);
      }
      return effectivePollInterval;
    },
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("429") || message.includes("too many requests")) {
        return failureCount < 1;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    queryFn: async () => {
      resetClient();
      return fetchWalletsData(addresses, isTestnet, includeActivity, activityAddresses);
    },
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  if (addresses.length === 0) {
    return {
      wallets: [],
      walletActivities: [],
      allMids: {},
      isLoading: false,
      error: null,
      lastPollTime: null,
      refresh,
    };
  }

  return {
    wallets: query.data?.wallets ?? [],
    walletActivities: query.data?.walletActivities ?? [],
    allMids: query.data?.allMids ?? {},
    isLoading: query.isLoading || query.isFetching,
    error: query.error ? normalizeError(query.error) : null,
    lastPollTime: query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
    refresh,
  };
}
