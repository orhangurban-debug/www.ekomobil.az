/**
 * Dinamik minimum təklif artımı (Meqa-Tapşırıq spesifikasiyası).
 */
export function getMinBidIncrement(currentPriceAzn: number): number {
  const p = Math.max(0, currentPriceAzn);
  if (p < 1000) return 10;
  if (p < 10000) return 50;
  return 100;
}
