import { defaultInput } from '../domain/types.ts';
import type { SalaryInput } from '../domain/types.ts';
import { parseMoney } from '../domain/money.ts';
export const storageKey = 'offer-lens:salary:v1';
export function serializeInput(input: SalaryInput): string { return JSON.stringify({ version: 1, input }); }
export function readSaved(raw: string | null): SalaryInput {
  const fallback = defaultInput();
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !data.input || typeof data.input !== 'object') return fallback;
    const saved = data.input;
    for (const [key, value] of Object.entries(fallback)) {
      if (!(key in saved) || (value !== null && typeof saved[key] !== typeof value)) return fallback;
      if (value === null && saved[key] !== null && (!Number.isFinite(saved[key]) || typeof saved[key] !== 'number')) return fallback;
    }
    if (parseMoney(saved.salary) === null || !['beijing', 'shanghai', 'shenzhen', 'hangzhou', 'custom'].includes(saved.city) || ![2026, 2027].includes(saved.year)) return fallback;
    if (!['full', 'join'].includes(saved.mode) || !['annual', 'quarterly', 'custom'].includes(saved.bonusSchedule) || !['separate', 'combined'].includes(saved.bonusMethod) || !['unknown', 'taxable', 'eligible', 'exempt'].includes(saved.insuranceTax)) return fallback;
    if (!saved.custom || Object.keys(fallback.custom).some(key => typeof saved.custom[key] !== 'string') || !Array.isArray(saved.events)) return fallback;
    if (saved.events.some((e: unknown) => !e || typeof e !== 'object' || !('amount' in e) || !('month' in e) || !('year' in e) || !('kind' in e) || typeof e.amount !== 'string' || typeof e.month !== 'number' || typeof e.year !== 'number' || !['salary', 'bonus'].includes(String(e.kind)))) return fallback;
    return Object.fromEntries(Object.keys(fallback).map(key => [key, saved[key]])) as unknown as SalaryInput;
  } catch { return fallback; }
}
