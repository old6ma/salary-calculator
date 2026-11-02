import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, tax, bonusTax, roundedContribution } from './money.ts';

test('money parsing keeps cents and accepts salary shorthand, rejecting unsafe input', () => {
  for (const [input, expected] of [['40k', 4000000], ['40.125k', 4012500], ['0', 0], ['1.01', 101], ['10000000', 1000000000]] as const) assert.equal(parseMoney(input), expected);
  for (const input of ['', ' ', '-1', 'NaN', 'Infinity', '1e7', '1.001', '10000001', '40kfoo']) assert.equal(parseMoney(input), null, input);
});
test('annual progressive tax uses exact thresholds and clamps negative taxable income', () => {
  for (const [input, expected] of [[-100, 0], [0, 0], [3600000, 108000], [3600100, 108010], [14400000, 1188000], [30000000, 4308000], [32400000, 4908000], [42000000, 7308000], [66000000, 14508000], [96000000, 25008000], [100000000, 26808000]]) assert.equal(tax(input), expected);
});
test('bonus tax checks total against unrounded monthly thresholds', () => {
  assert.equal(bonusTax(3600000), 108000);
  assert.equal(bonusTax(3600001), 339000);
  assert.equal(bonusTax(14400000), 1419000);
  assert.equal(bonusTax(16000000), 3059000);
  assert.equal(bonusTax(0), 0);
});
test('fund rounding to yuan is distinct from social insurance rounding to fen', () => {
  assert.equal(roundedContribution(3773100, 700, 'yuan'), 264100);
  assert.equal(roundedContribution(3773100, 700, 'fen'), 264117);
});
