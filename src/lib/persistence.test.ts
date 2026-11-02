import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultInput } from '../domain/types.ts';
import { readSaved, serializeInput } from './persistence.ts';
import { csvCell, toCsv } from './export.ts';
import { calculate } from '../calculator/calculate.ts';

test('saved input roundtrips while corrupted, incompatible or wrongly typed storage falls back safely', () => {
  const input = defaultInput(); input.salary = '1.01'; input.fundBps = 1200;
  assert.equal(readSaved(serializeInput(input)).salary, '1.01');
  assert.equal(readSaved(serializeInput(input)).fundBps, 1200);
  for (const raw of ['{', '{"version":99}', '{"version":1,"input":{"salary":null}}', '{"version":1,"input":{"salary":"Infinity"}}']) assert.equal(readSaved(raw).salary, '40000');
});
test('CSV quotes newlines, prevents formula injection and preserves decimal numeric fields', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('hello,world'), '"hello,world"');
  assert.equal(csvCell(-12.34), '-12.34');
  const s = calculate(defaultInput()).scenario!;
  const csv = toCsv(s, 'estimate', 2026, 'full');
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('40000.00'));
  assert.ok(csv.includes('全年合计')); assert.ok(csv.includes((s.cash / 100).toFixed(2)));
});
