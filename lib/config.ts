/**
 * Configuration management using localStorage
 * Stores wallet addresses and settings persistently in the browser
 */

import defaultConfigJson from "@/data/config.json";

export interface TrackerConfig {
  wallets: string[];
  settings: {
    pollInterval: number;
    isTestnet: boolean;
  };
}

const STORAGE_KEY = "hyperliquid-tracker-config";

const DEFAULT_CONFIG: TrackerConfig = {
  wallets: Array.isArray(defaultConfigJson.wallets) ? defaultConfigJson.wallets : [],
  settings: {
    pollInterval: defaultConfigJson.settings?.pollInterval ?? 10000,
    isTestnet: defaultConfigJson.settings?.isTestnet ?? false,
  },
};

/**
 * Load config from localStorage
 */
export function loadConfig(): TrackerConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(stored) as Partial<TrackerConfig>;
    
    // Merge with defaults to ensure all fields exist
    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : DEFAULT_CONFIG.wallets,
      settings: {
        pollInterval: parsed.settings?.pollInterval ?? DEFAULT_CONFIG.settings.pollInterval,
        isTestnet: parsed.settings?.isTestnet ?? DEFAULT_CONFIG.settings.isTestnet,
      },
    };
  } catch {
    console.error("Failed to load config from localStorage");
    return DEFAULT_CONFIG;
  }
}

/**
 * Save config to localStorage
 */
export function saveConfig(config: TrackerConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.error("Failed to save config to localStorage");
  }
}

/**
 * Add a wallet address to config
 */
export function addWallet(address: string): TrackerConfig {
  const config = loadConfig();
  if (!config.wallets.includes(address)) {
    config.wallets.push(address);
    saveConfig(config);
  }
  return config;
}

/**
 * Remove a wallet address from config
 */
export function removeWallet(address: string): TrackerConfig {
  const config = loadConfig();
  config.wallets = config.wallets.filter((w) => w !== address);
  saveConfig(config);
  return config;
}

/**
 * Update settings
 */
export function updateSettings(settings: Partial<TrackerConfig["settings"]>): TrackerConfig {
  const config = loadConfig();
  config.settings = { ...config.settings, ...settings };
  saveConfig(config);
  return config;
}

/**
 * Get default poll interval
 */
export function getDefaultPollInterval(): number {
  return DEFAULT_CONFIG.settings.pollInterval;
}

/**
 * Get default testnet setting
 */
export function getDefaultIsTestnet(): boolean {
  return DEFAULT_CONFIG.settings.isTestnet;
}
