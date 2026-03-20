import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency
 */
export function formatUsd(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
  
  return formatted;
}

/**
 * Format a number with sign prefix
 */
export function formatUsdWithSign(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  
  const prefix = num >= 0 ? "+" : "";
  return prefix + formatUsd(num, decimals);
}

/**
 * Format a number with compact notation for large values
 */
export function formatCompact(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a price with appropriate decimals based on value
 */
export function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  
  // More decimals for smaller prices
  let decimals = 2;
  if (num < 1) decimals = 4;
  else if (num < 10) decimals = 3;
  else if (num < 100) decimals = 2;
  else if (num < 10000) decimals = 2;
  else decimals = 0;
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a position size
 */
export function formatSize(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  
  const absNum = Math.abs(num);
  let decimals = 4;
  if (absNum >= 100) decimals = 2;
  else if (absNum >= 10) decimals = 3;
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absNum);
}

/**
 * Format a percentage
 */
export function formatPercent(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  
  return `${num >= 0 ? "+" : ""}${num.toFixed(decimals)}%`;
}

/**
 * Truncate an Ethereum address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Validate an Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate liquidation distance percentage
 * @param side - "LONG" or "SHORT"
 * @param markPrice - Current mark price
 * @param liquidationPrice - Liquidation price
 * @returns Percentage distance to liquidation (positive = safe, negative = liquidated)
 */
export function calcLiquidationDistance(
  side: "LONG" | "SHORT",
  markPrice: number,
  liquidationPrice: number | null
): number | null {
  if (liquidationPrice === null || liquidationPrice === 0 || markPrice === 0) {
    return null;
  }
  
  if (side === "LONG") {
    // Long: liquidation is below mark price
    // Distance = ((mark - liq) / mark) * 100
    return ((markPrice - liquidationPrice) / markPrice) * 100;
  } else {
    // Short: liquidation is above mark price
    // Distance = ((liq - mark) / mark) * 100
    return ((liquidationPrice - markPrice) / markPrice) * 100;
  }
}

/**
 * Get color class based on liquidation distance
 */
export function getLiqDistanceColor(distance: number | null): string {
  if (distance === null) return "text-muted-foreground";
  if (distance < 5) return "text-red-500 font-bold animate-pulse";
  if (distance < 10) return "text-red-500 font-semibold";
  if (distance < 20) return "text-yellow-500";
  return "text-green-500";
}

/**
 * Get the display side from signed size
 */
export function getSideFromSize(szi: string): "LONG" | "SHORT" {
  const size = parseFloat(szi);
  return size >= 0 ? "LONG" : "SHORT";
}

/**
 * Parse environment wallets string to array
 */
export function parseEnvWallets(): string[] {
  const walletsEnv = process.env.NEXT_PUBLIC_WALLETS ?? "";
  return walletsEnv
    .split(",")
    .map((w) => w.trim())
    .filter((w) => isValidAddress(w));
}

/**
 * Get polling interval from env
 */
export function getPollInterval(): number {
  const interval = process.env.NEXT_PUBLIC_POLL_INTERVAL;
  const parsed = interval ? parseInt(interval, 10) : 10000;
  return isNaN(parsed) ? 10000 : Math.max(5000, parsed); // Minimum 5 seconds
}

/**
 * Check if testnet mode is enabled
 */
export function isTestnet(): boolean {
  return process.env.NEXT_PUBLIC_TESTNET === "true";
}
