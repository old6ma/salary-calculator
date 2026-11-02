import type { SalaryInput, Scenario } from '../domain/types.ts';
import { resolvePolicy } from '../policies/cities.ts';
import { formatMoney } from '../domain/money.ts';
export function applyInputPatch(current: SalaryInput, patch: Partial<SalaryInput>): SalaryInput { return { ...current, ...patch }; }
export function parseNumericField(raw: string): number | '' { return raw.trim() === '' ? '' : Number(raw); }
export function fundOptions(input: SalaryInput): { minBps: number; maxBps: number } | null {
  if (input.city !== 'custom') { const p = resolvePolicy(input.city, input.year, 12); return { minBps: p.fund.minBps, maxBps: p.fund.maxBps }; }
  const parse = (raw: string) => /^\d+(\.\d{1,2})?$/.test(raw) ? Math.round(Number(raw) * 100) : NaN;
  const minBps = parse(input.custom.fundMinPercent), maxBps = parse(input.custom.fundMaxPercent);
  return Number.isFinite(minBps) && Number.isFinite(maxBps) && minBps <= maxBps && maxBps <= 10000 ? { minBps, maxBps } : null;
}
export function bonusAdvice(s: Scenario, alt?: Scenario): { winner: 'separate' | 'combined' | 'same' | 'uncertain'; min: number; max: number } {
  const diff = s.finalCombinedTax - s.finalSeparateTax;
  const other = alt ? alt.finalCombinedTax - alt.finalSeparateTax : diff;
  const sameDirection = Math.sign(diff) === Math.sign(other);
  return { winner: !sameDirection ? 'uncertain' : diff > 0 ? 'separate' : diff < 0 ? 'combined' : 'same', min: Math.min(Math.abs(diff), Math.abs(other)), max: Math.max(Math.abs(diff), Math.abs(other)) };
}
export function settlementText(amount: number, alt = amount): string {
  const lo = Math.min(amount, alt), hi = Math.max(amount, alt);
  if (lo < 0 && hi > 0) return `预计退税 ¥ ${formatMoney(-lo)} 至补税 ¥ ${formatMoney(hi)}`;
  const min = Math.min(Math.abs(lo), Math.abs(hi)), max = Math.max(Math.abs(lo), Math.abs(hi));
  return `预计${hi > 0 ? '补税' : '退税'} ¥ ${formatMoney(min)}${min !== max ? `—${formatMoney(max)}` : ''}`;
}
