export interface LeverageInfo {
  type: "isolated" | "cross";
  value: number;
  rawUsd?: string;
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

export type AllMids = Record<string, string>;

export interface PositionData {
  coin: string;
  side: "LONG" | "SHORT";
  size: number;
  sizeRaw: string;
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
  liqDistance: number | null;
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
