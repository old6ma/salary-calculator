import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePolicy, fundRate } from './cities.ts';

test('Beijing selects the policy of the actual month, not the latest cap for all months', () => {
  assert.equal(resolvePolicy('beijing', 2026, 1).pension.max, 3581100);
  assert.equal(resolvePolicy('beijing', 2026, 7).pension.max, 3634800);
  assert.equal(resolvePolicy('beijing', 2026, 7).fund.min, 254000);
});
test('automatic fund uses the local normal minimum and manual values are validated', () => {
  const p = resolvePolicy('shanghai', 2026, 8);
  assert.equal(fundRate(p, null), 500);
  assert.equal(fundRate(p, 700), 700);
  assert.throws(() => fundRate(p, 1200));
});
test('future social parameters are marked forecast, custom region has no invented policy', () => {
  assert.equal(resolvePolicy('beijing', 2027, 1).status, 'forecast');
  assert.equal(resolvePolicy('custom', 2026, 1).status, 'incomplete');
  assert.throws(() => resolvePolicy('beijing', 2028, 1));
});
