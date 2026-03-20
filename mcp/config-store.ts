import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface McpConfig {
  wallets: string[];
  settings: {
    pollInterval: number;
    isTestnet: boolean;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "../data/config.json");

const defaultConfig: McpConfig = {
  wallets: [],
  settings: {
    pollInterval: 10000,
    isTestnet: false,
  },
};

export async function readConfig(): Promise<McpConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<McpConfig>;

    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : defaultConfig.wallets,
      settings: {
        pollInterval:
          typeof parsed.settings?.pollInterval === "number"
            ? parsed.settings.pollInterval
            : defaultConfig.settings.pollInterval,
        isTestnet:
          typeof parsed.settings?.isTestnet === "boolean"
            ? parsed.settings.isTestnet
            : defaultConfig.settings.isTestnet,
      },
    };
  } catch {
    return defaultConfig;
  }
}

export async function writeConfig(config: McpConfig): Promise<void> {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

export async function addWalletToConfig(address: string): Promise<McpConfig> {
  const config = await readConfig();
  const exists = config.wallets.some((w) => w.toLowerCase() === address.toLowerCase());
  if (!exists) {
    config.wallets.push(address);
    await writeConfig(config);
  }
  return config;
}

export async function removeWalletFromConfig(address: string): Promise<McpConfig> {
  const config = await readConfig();
  config.wallets = config.wallets.filter((w) => w.toLowerCase() !== address.toLowerCase());
  await writeConfig(config);
  return config;
}
