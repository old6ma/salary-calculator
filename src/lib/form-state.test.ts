import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultInput } from '../domain/types.ts';
import { calculate } from '../calculator/calculate.ts';
import { applyInputPatch, fundOptions, bonusAdvice, settlementText, parseNumericField } from './form-state.ts';

test('year navigation preserves actual custom payout dates and excludes the future payout', () => {
  const i = defaultInput(); i.year = 2027; i.bonusSchedule = 'custom'; i.events = [{ id:'dated',year:2027,month:12,amount:'160000',kind:'bonus' }];
  const next = applyInputPatch(i, {year:2026});
  assert.equal(next.events[0].year, 2027); const s = calculate(next).scenario!;
  assert.equal(s.gross, 48000000); assert.equal(s.nextYearBonus, 16000000);
});
test('custom fund display uses declared range and has no fictional range when incomplete', () => {
  const i = defaultInput(); i.city = 'custom';
  assert.equal(fundOptions(i), null);
  i.custom.fundMinPercent = '3'; i.custom.fundMaxPercent = '4';
  assert.deepEqual(fundOptions(i), {minBps:300,maxBps:400});
});
test('unknown insurance does not issue a single bonus winner when the two assumptions disagree', () => {
  const i = defaultInput(); i.salary = '8000'; i.salaryMonths = '18'; i.insurance = true; i.insuranceEmployer = '10000'; i.insuranceTax = 'unknown';
  const r = calculate(i); assert.equal(bonusAdvice(r.scenario!, r.alternative!).winner, 'uncertain');
});
test('settlement explicitly displays a refund range or a crossing refund/payment result', () => {
  assert.equal(settlementText(-1500000, -1250000), '预计退税 ¥ 12,500—15,000');
  assert.equal(settlementText(-50000, 20000), '预计退税 ¥ 500 至补税 ¥ 200');
});

test('clearing a numeric field preserves empty draft instead of converting it to zero', () => {
  assert.equal(parseNumericField(''), ''); assert.equal(parseNumericField('0'), 0); assert.equal(parseNumericField('80'), 80);
});
