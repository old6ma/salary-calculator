/** Money is integer fen; rates are integer basis points. */
export function parseMoney(raw: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,5}))?([kK])?$/.exec(raw.trim());
  if (!match) return null;
  const fraction = match[2] ?? '';
  const numerator = Number(match[1] + fraction);
  const denominator = 10 ** fraction.length;
  const result = numerator * (match[3] ? 100000 : 100) / denominator;
  return Number.isSafeInteger(result) && result >= 0 && result <= 1000000000 ? result : null;
}
export const brackets = [
  [3600000, 300, 0], [14400000, 1000, 252000], [30000000, 2000, 1692000],
  [42000000, 2500, 3192000], [66000000, 3000, 5292000], [96000000, 3500, 8592000],
  [Infinity, 4500, 18192000],
] as const;
export function tax(taxable: number): number {
  const amount = Math.max(0, taxable);
  const [, rate, quick] = brackets.find(([limit]) => amount <= limit)!;
  return Math.max(0, Math.round(amount * rate / 10000) - quick);
}
export function bonusTax(amount: number): number {
  if (amount <= 0) return 0;
  const [, rate, annualQuick] = brackets.find(([limit]) => amount <= limit)!;
  return Math.max(0, Math.round(amount * rate / 10000) - annualQuick / 12);
}
export function roundedContribution(base: number, bps: number, rounding: 'yuan' | 'fen'): number {
  return rounding === 'yuan' ? Math.round(base * bps / 1000000) * 100 : Math.round(base * bps / 10000);
}
export function clampBase(base: number, min: number, max: number): number { return Math.min(max, Math.max(min, base)); }
export function formatMoney(fen: number, digits = 0): string {
  return (fen / 100).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
