import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  fetchAllMids,
  fetchWalletsData,
  getInfoClient,
  processClearinghouseState,
  fetchClearinghouseState,
} from "../lib/hyperliquid";
import { isValidAddress } from "../lib/utils";
import {
  addWalletToConfig,
  readConfig,
  removeWalletFromConfig,
  writeConfig,
} from "./config-store";

const server = new McpServer({
  name: "hyperliquid-wallet-tracker",
  version: "1.0.0",
});

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function normalizeAddress(address: string): string {
  return address.trim();
}

server.registerTool(
  "list_tracked_wallets",
  {
    title: "List Tracked Wallets",
    description: "List wallet addresses stored in tracker JSON config",
    inputSchema: z.object({}),
  },
  async () => {
    const config = await readConfig();
    return {
      content: [
        {
          type: "text",
          text: jsonText({
            wallets: config.wallets,
            count: config.wallets.length,
            settings: config.settings,
          }),
        },
      ],
    };
  },
);

server.registerTool(
  "add_wallet",
  {
    title: "Add Wallet",
    description: "Add a public Hyperliquid wallet address to tracker config",
    inputSchema: z.object({
      address: z.string().describe("Wallet address, e.g. 0x..."),
    }),
  },
  async ({ address }) => {
    const normalized = normalizeAddress(address);
    if (!isValidAddress(normalized)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid address: ${address}` }],
      };
    }

    const config = await addWalletToConfig(normalized);
    return {
      content: [
        {
          type: "text",
          text: jsonText({ success: true, wallets: config.wallets, count: config.wallets.length }),
        },
      ],
    };
  },
);

server.registerTool(
  "remove_wallet",
  {
    title: "Remove Wallet",
    description: "Remove a wallet address from tracker config",
    inputSchema: z.object({
      address: z.string().describe("Wallet address to remove"),
    }),
  },
  async ({ address }) => {
    const config = await removeWalletFromConfig(normalizeAddress(address));
    return {
      content: [
        {
          type: "text",
          text: jsonText({ success: true, wallets: config.wallets, count: config.wallets.length }),
        },
      ],
    };
  },
);

server.registerTool(
  "clear_wallets",
  {
    title: "Clear Wallets",
    description: "Clear all tracked wallets from config",
    inputSchema: z.object({}),
  },
  async () => {
    const config = await readConfig();
    config.wallets = [];
    await writeConfig(config);
    return {
      content: [{ type: "text", text: jsonText({ success: true, wallets: [], count: 0 }) }],
    };
  },
);

server.registerTool(
  "get_all_mids",
  {
    title: "Get All Mids",
    description: "Fetch mid prices for all Hyperliquid perp coins",
    inputSchema: z.object({
      isTestnet: z.boolean().optional().describe("Use testnet instead of mainnet"),
    }),
  },
  async ({ isTestnet }) => {
    const config = await readConfig();
    const networkIsTestnet = isTestnet ?? config.settings.isTestnet;
    const client = getInfoClient(networkIsTestnet);
    const mids = await fetchAllMids(client);
    return {
      content: [
        {
          type: "text",
          text: jsonText({
            isTestnet: networkIsTestnet,
            count: Object.keys(mids).length,
            mids,
          }),
        },
      ],
    };
  },
);

server.registerTool(
  "get_account_summary",
  {
    title: "Get Account Summary",
    description: "Fetch account summary for a wallet (accountValue, withdrawable, margin, total unrealized PnL)",
    inputSchema: z.object({
      address: z.string().describe("Wallet address"),
      isTestnet: z.boolean().optional().describe("Use testnet instead of mainnet"),
    }),
  },
  async ({ address, isTestnet }) => {
    const normalized = normalizeAddress(address);
    if (!isValidAddress(normalized)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid address: ${address}` }],
      };
    }

    const config = await readConfig();
    const networkIsTestnet = isTestnet ?? config.settings.isTestnet;
    const client = getInfoClient(networkIsTestnet);
    const allMids = await fetchAllMids(client);
    const state = await fetchClearinghouseState(client, normalized);
    const walletData = processClearinghouseState(state, allMids, normalized);

    return {
      content: [
        {
          type: "text",
          text: jsonText({
            address: normalized,
            isTestnet: networkIsTestnet,
            summary: walletData.summary,
            positionsCount: walletData.positions.length,
            lastUpdated: walletData.lastUpdated,
          }),
        },
      ],
    };
  },
);

server.registerTool(
  "get_wallet_positions",
  {
    title: "Get Wallet Positions",
    description: "Fetch detailed perp positions for one wallet, including mark price and liquidation distance",
    inputSchema: z.object({
      address: z.string().describe("Wallet address"),
      isTestnet: z.boolean().optional().describe("Use testnet instead of mainnet"),
    }),
  },
  async ({ address, isTestnet }) => {
    const normalized = normalizeAddress(address);
    if (!isValidAddress(normalized)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid address: ${address}` }],
      };
    }

    const config = await readConfig();
    const networkIsTestnet = isTestnet ?? config.settings.isTestnet;
    const client = getInfoClient(networkIsTestnet);
    const allMids = await fetchAllMids(client);
    const state = await fetchClearinghouseState(client, normalized);
    const walletData = processClearinghouseState(state, allMids, normalized);

    return {
      content: [
        {
          type: "text",
          text: jsonText({
            address: normalized,
            isTestnet: networkIsTestnet,
            positionsCount: walletData.positions.length,
            positions: walletData.positions,
          }),
        },
      ],
    };
  },
);

server.registerTool(
  "get_multi_wallet_summary",
  {
    title: "Get Multi Wallet Summary",
    description: "Fetch and aggregate summaries for many wallets (input list or config wallets)",
    inputSchema: z.object({
      addresses: z.array(z.string()).optional().describe("Optional wallet list; if omitted uses tracked wallets"),
      isTestnet: z.boolean().optional().describe("Use testnet instead of mainnet"),
    }),
  },
  async ({ addresses, isTestnet }) => {
    const config = await readConfig();
    const selectedAddresses = (addresses ?? config.wallets).map((a) => normalizeAddress(a));

    if (selectedAddresses.length === 0) {
      return {
        isError: true,
        content: [{ type: "text", text: "No wallet addresses provided or configured" }],
      };
    }

    const invalid = selectedAddresses.filter((a) => !isValidAddress(a));
    if (invalid.length > 0) {
      return {
        isError: true,
        content: [{ type: "text", text: `Invalid addresses: ${invalid.join(", ")}` }],
      };
    }

    const networkIsTestnet = isTestnet ?? config.settings.isTestnet;
    const { wallets, allMids } = await fetchWalletsData(selectedAddresses, networkIsTestnet);

    const aggregate = wallets.reduce(
      (acc, w) => {
        acc.accountValue += w.summary.accountValue;
        acc.totalMarginUsed += w.summary.totalMarginUsed;
        acc.withdrawable += w.summary.withdrawable;
        acc.totalUnrealizedPnl += w.summary.totalUnrealizedPnl;
        acc.totalPositionValue += w.summary.totalPositionValue;
        return acc;
      },
      {
        accountValue: 0,
        totalMarginUsed: 0,
        withdrawable: 0,
        totalUnrealizedPnl: 0,
        totalPositionValue: 0,
      },
    );

    return {
      content: [
        {
          type: "text",
          text: jsonText({
            isTestnet: networkIsTestnet,
            walletCount: wallets.length,
            aggregate,
            wallets,
            midsCount: Object.keys(allMids).length,
          }),
        },
      ],
    };
  },
);

server.registerResource(
  "tracker-config",
  "hyperliquid://config",
  {
    title: "Tracker Config",
    description: "Current tracked wallets and settings",
    mimeType: "application/json",
  },
  async () => {
    const config = await readConfig();
    return {
      contents: [
        {
          uri: "hyperliquid://config",
          mimeType: "application/json",
          text: jsonText(config),
        },
      ],
    };
  },
);

server.registerResource(
  "tracker-status",
  "hyperliquid://status",
  {
    title: "Tracker Status",
    description: "Live status from Hyperliquid including mids count and network",
    mimeType: "application/json",
  },
  async () => {
    const config = await readConfig();
    const client = getInfoClient(config.settings.isTestnet);
    const mids = await fetchAllMids(client);
    const status = {
      network: config.settings.isTestnet ? "testnet" : "mainnet",
      isTestnet: config.settings.isTestnet,
      pollInterval: config.settings.pollInterval,
      trackedWallets: config.wallets.length,
      midsCount: Object.keys(mids).length,
      timestamp: new Date().toISOString(),
    };

    return {
      contents: [
        {
          uri: "hyperliquid://status",
          mimeType: "application/json",
          text: jsonText(status),
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
