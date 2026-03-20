import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import type {
  ClearinghouseState,
  AllMids,
  WalletData,
  PositionData,
  AccountSummary,
} from "./types.js";
import { getSideFromSize, calcLiquidationDistance } from "./utils.js";

let cachedClient: InfoClient | null = null;
let cachedIsTestnet: boolean | null = null;

export function getInfoClient(isTestnet: boolean): InfoClient {
  if (cachedClient && cachedIsTestnet === isTestnet) {
    return cachedClient;
  }

  const transport = new HttpTransport({ isTestnet });
  cachedClient = new InfoClient({ transport });
  cachedIsTestnet = isTestnet;

  return cachedClient;
}

export async function fetchClearinghouseState(
  client: InfoClient,
  address: string
): Promise<ClearinghouseState> {
  const state = await client.clearinghouseState({ user: address });
  return state as ClearinghouseState;
}

export async function fetchAllMids(client: InfoClient): Promise<AllMids> {
  const mids = await client.allMids();
  return mids as AllMids;
}

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

export async function fetchWalletsData(
  addresses: string[],
  isTestnet: boolean
): Promise<{ wallets: WalletData[]; allMids: AllMids }> {
  const client = getInfoClient(isTestnet);
  const allMids = await fetchAllMids(client);

  const walletPromises = addresses.map(async (address) => {
    try {
      const state = await fetchClearinghouseState(client, address);
      return processClearinghouseState(state, allMids, address);
    } catch (error) {
      return {
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
      };
    }
  });

  const wallets = await Promise.all(walletPromises);
  return { wallets, allMids };
}
