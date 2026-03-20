import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import type {
  ClearinghouseState,
  AllMids,
  WalletData,
  PositionData,
  AccountSummary,
  WalletActivityData,
  OpenOrderData,
  HistoricalOrderData,
  FillData,
} from "./types";
import { getSideFromSize, calcLiquidationDistance } from "./utils";

// ============================================================
// Client Factory
// ============================================================

let cachedClient: InfoClient | null = null;
let cachedIsTestnet: boolean | null = null;

/**
 * Create or return cached InfoClient
 */
export function getInfoClient(isTestnet: boolean): InfoClient {
  // Return cached client if testnet mode hasn't changed
  if (cachedClient && cachedIsTestnet === isTestnet) {
    return cachedClient;
  }

  const transport = new HttpTransport({ isTestnet });
  cachedClient = new InfoClient({ transport });
  cachedIsTestnet = isTestnet;

  return cachedClient;
}

/**
 * Reset the cached client (useful when switching networks)
 */
export function resetClient(): void {
  cachedClient = null;
  cachedIsTestnet = null;
}

// ============================================================
// Data Fetching
// ============================================================

/**
 * Fetch clearinghouse state for a wallet address
 */
export async function fetchClearinghouseState(
  client: InfoClient,
  address: string
): Promise<ClearinghouseState> {
  const state = await client.clearinghouseState({ user: address });
  return state as ClearinghouseState;
}

/**
 * Fetch all mid prices
 */
export async function fetchAllMids(client: InfoClient): Promise<AllMids> {
  const mids = await client.allMids();
  return mids as AllMids;
}

// ============================================================
// Data Processing
// ============================================================

/**
 * Process raw clearinghouse state into UI-friendly format
 */
export function processClearinghouseState(
  state: ClearinghouseState,
  allMids: AllMids,
  address: string
): WalletData {
  const positions: PositionData[] = state.assetPositions.map((ap) => {
    const pos = ap.position;
    const side = getSideFromSize(pos.szi);
    const size = Math.abs(parseFloat(pos.szi));
    const entryPx = parseFloat(pos.entryPx);
    const markPx = parseFloat(allMids[pos.coin] ?? pos.entryPx);
    const unrealizedPnl = parseFloat(pos.unrealizedPnl);
    const liquidationPx = pos.liquidationPx ? parseFloat(pos.liquidationPx) : null;
    const liqDistance = calcLiquidationDistance(side, markPx, liquidationPx);

    return {
      wallet: address,
      coin: pos.coin,
      side,
      size,
      sizeRaw: pos.szi,
      entryPx,
      markPx,
      unrealizedPnl,
      unrealizedPnlRaw: pos.unrealizedPnl,
      liquidationPx,
      leverage: pos.leverage.value,
      leverageType: pos.leverage.type,
      marginUsed: parseFloat(pos.marginUsed),
      positionValue: parseFloat(pos.positionValue),
      returnOnEquity: parseFloat(pos.returnOnEquity),
      liqDistance,
      maxLeverage: pos.maxLeverage,
    };
  });

  // Calculate summary
  const accountValue = parseFloat(state.marginSummary.accountValue);
  const totalMarginUsed = parseFloat(state.marginSummary.totalMarginUsed);
  const withdrawable = parseFloat(state.withdrawable);
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalPositionValue = positions.reduce((sum, p) => sum + p.positionValue, 0);

  const summary: AccountSummary = {
    accountValue,
    totalMarginUsed,
    withdrawable,
    totalUnrealizedPnl,
    totalPositionValue,
  };

  return {
    address,
    summary,
    positions,
    lastUpdated: state.time,
  };
}

// ============================================================
// Combined Fetch
// ============================================================

/**
 * Fetch and process wallet data for multiple addresses
 */
export async function fetchWalletsData(
  addresses: string[],
  isTestnet: boolean,
  includeActivity = true,
  activityAddresses?: string[]
): Promise<{ wallets: WalletData[]; walletActivities: WalletActivityData[]; allMids: AllMids }> {
  const client = getInfoClient(isTestnet);
  const activityAddressSet = new Set(activityAddresses ?? addresses);

  // Fetch allMids once (shared across all wallets)
  const allMids = await fetchAllMids(client);

  // Fetch clearinghouse state for each wallet in parallel
  const walletPromises = addresses.map(async (address) => {
    try {
      const state = await fetchClearinghouseState(client, address);
      const walletData = processClearinghouseState(state, allMids, address);

      let openOrders: OpenOrderData[] = [];
      let historicalOrders: HistoricalOrderData[] = [];
      let fills: FillData[] = [];

      if (includeActivity && activityAddressSet.has(address)) {
        const [openOrdersRaw, historicalOrdersRaw, fillsRaw] = await Promise.all([
          client.frontendOpenOrders({ user: address }),
          client.historicalOrders({ user: address }),
          client.userFills({ user: address, aggregateByTime: true }),
        ]);

        openOrders = openOrdersRaw.map((order) => ({
          wallet: address,
          coin: order.coin,
          side: order.side === "B" ? "BUY" : "SELL",
          orderType: order.orderType,
          tif: order.tif,
          limitPx: parseFloat(order.limitPx),
          size: parseFloat(order.sz),
          originalSize: parseFloat(order.origSz),
          reduceOnly: order.reduceOnly,
          isTrigger: order.isTrigger,
          triggerPx: order.triggerPx ? parseFloat(order.triggerPx) : null,
          timestamp: order.timestamp,
          orderId: order.oid,
        }));

        historicalOrders = historicalOrdersRaw.map((item) => ({
          wallet: address,
          coin: item.order.coin,
          side: item.order.side === "B" ? "BUY" : "SELL",
          status: item.status,
          orderType: item.order.orderType,
          tif: item.order.tif,
          limitPx: parseFloat(item.order.limitPx),
          size: parseFloat(item.order.sz),
          originalSize: parseFloat(item.order.origSz),
          reduceOnly: item.order.reduceOnly,
          timestamp: item.order.timestamp,
          statusTimestamp: item.statusTimestamp,
          orderId: item.order.oid,
        }));

        fills = fillsRaw.map((fill) => ({
          wallet: address,
          coin: fill.coin,
          side: fill.side === "B" ? "BUY" : "SELL",
          price: parseFloat(fill.px),
          size: parseFloat(fill.sz),
          fee: parseFloat(fill.fee),
          feeToken: fill.feeToken,
          closedPnl: parseFloat(fill.closedPnl),
          timestamp: fill.time,
          orderId: fill.oid,
        }));
      }

      return {
        walletData,
        activity: {
          wallet: address,
          openOrders,
          historicalOrders,
          fills,
        },
      };
    } catch (error) {
      // Return error state for this wallet
      return {
        walletData: {
          address,
          summary: {
            accountValue: 0,
            totalMarginUsed: 0,
            withdrawable: 0,
            totalUnrealizedPnl: 0,
            totalPositionValue: 0,
          },
          positions: [],
          lastUpdated: Date.now(),
          error: error instanceof Error ? error.message : "Failed to fetch wallet data",
        },
        activity: {
          wallet: address,
          openOrders: [],
          historicalOrders: [],
          fills: [],
          error: error instanceof Error ? error.message : "Failed to fetch wallet activity",
        },
      };
    }
  });

  const walletResults = await Promise.all(walletPromises);
  const wallets = walletResults.map((result) => result.walletData);
  const walletActivities = walletResults.map((result) => result.activity);

  return { wallets, walletActivities, allMids };
}
