export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getSideFromSize(szi: string): "LONG" | "SHORT" {
  const size = parseFloat(szi);
  return size >= 0 ? "LONG" : "SHORT";
}

export function calcLiquidationDistance(
  side: "LONG" | "SHORT",
  markPrice: number,
  liquidationPrice: number | null
): number | null {
  if (liquidationPrice === null || liquidationPrice === 0 || markPrice === 0) {
    return null;
  }

  if (side === "LONG") {
    return ((markPrice - liquidationPrice) / markPrice) * 100;
  } else {
    return ((liquidationPrice - markPrice) / markPrice) * 100;
  }
}
