/**
 * Type definitions for the Hyperliquid Wallet Tracker
 * Based on @nktkas/hyperliquid SDK types
 */

// ============================================================
// Position Types
// ============================================================

export interface LeverageInfo {
  type: "isolated" | "cross";
  value: number;
  rawUsd?: string; // Only present for isolated
}

export interface CumFunding {
  allTime: string;
  sinceOpen: string;
  sinceChange: string;
}

export interface RawPosition {
  coin: string;
  szi: string;
  leverage: LeverageInfo;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage: number;
  cumFunding: CumFunding;
}

export interface AssetPosition {
  type: "oneWay";
  position: RawPosition;
}

// ============================================================
// Clearinghouse State Types
// ============================================================

export interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface ClearinghouseState {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
}

// ============================================================
// AllMids Types
// ============================================================

export type AllMids = Record<string, string>;

// ============================================================
// Processed Types for UI
// ============================================================

export interface PositionData {
  coin: string;
  side: "LONG" | "SHORT";
  size: number; // Absolute size
  sizeRaw: string; // Raw signed size
  entryPx: number;
  markPx: number;
  unrealizedPnl: number;
  unrealizedPnlRaw: string;
  liquidationPx: number | null;
  leverage: number;
  leverageType: "isolated" | "cross";
  marginUsed: number;
  positionValue: number;
  returnOnEquity: number;
  liqDistance: number | null; // Percentage distance to liquidation
  maxLeverage: number;
}

export interface AccountSummary {
  accountValue: number;
  totalMarginUsed: number;
  withdrawable: number;
  totalUnrealizedPnl: number;
  totalPositionValue: number;
}

export interface WalletData {
  address: string;
  summary: AccountSummary;
  positions: PositionData[];
  lastUpdated: number;
  error?: string;
}

// ============================================================
// App State Types
// ============================================================

export interface TrackerState {
  wallets: WalletData[];
  allMids: AllMids;
  isLoading: boolean;
  error: string | null;
  lastPollTime: number | null;
  isTestnet: boolean;
}

export interface TrackerConfig {
  pollInterval: number;
  isTestnet: boolean;
  walletAddresses: string[];
}

// ============================================================
// Change Detection Types
// ============================================================

export type PositionChangeType = 
  | "new"      // New position opened
  | "closed"   // Position closed
  | "pnl_up"   // PnL increased significantly (>5%)
  | "pnl_down" // PnL decreased significantly (>5%)
  | "liq_warning"; // Approaching liquidation (<10%)

export interface PositionChange {
  type: PositionChangeType;
  wallet: string;
  coin: string;
  side?: "LONG" | "SHORT";
  previousPnl?: number;
  currentPnl?: number;
  liqDistance?: number;
  message: string;
}
