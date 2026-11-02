import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultInput } from '../domain/types.ts';
import { calculate } from './calculate.ts';

function fixture() {
  const input = defaultInput();
  input.city = 'custom'; input.confirmCityParameters = true; input.fundBps = 1000; input.employerFundBps = 1000;
  input.custom = { pensionMin: '0', pensionMax: '50000', pensionBps: '8', medicalMin: '0', medicalMax: '50000', medicalBps: '2', medicalFixed: '0', unemploymentMin: '0', unemploymentMax: '50000', unemploymentBps: '0', fundMin: '0', fundMax: '50000', fundMinPercent: '5', fundMaxPercent: '12', fundTaxMax: '50000' };
  return input;
}
test('40k x16 independent fixture reconciles monthly cash, withholding, and both final bonus methods', () => {
  const r = calculate(fixture()); assert.deepEqual(r.errors, []); const s = r.scenario!;
  assert.equal(s.wageTax, 4908000); assert.equal(s.bonusTax, 3059000); assert.equal(s.cash, 46433000);
  assert.equal(s.finalCombinedTax, 9228000); assert.equal(s.finalSeparateTax, 7967000);
  assert.equal(s.months[0].cash, 3119000); assert.equal(s.months[11].cash, 15481000);
  assert.equal(s.months.reduce((sum, m) => sum + m.cash, 0), s.cash);
  const input = fixture(); input.bonusMethod = 'combined'; const combined = calculate(input).scenario!;
  assert.equal(combined.cash, 45172000); assert.equal(s.cash - combined.cash, 1261000);
});
test('same monthly salary crosses cumulative tax brackets without taxing the whole salary at one rate', () => {
  const input = fixture(); input.salary = '20000'; input.salaryMonths = '12';
  input.custom.pensionBps = '0'; input.custom.medicalBps = '0'; input.custom.fundMinPercent = '0'; input.fundBps = 0; input.employerFundBps = 0;
  const s = calculate(input).scenario!;
  assert.deepEqual(s.months.slice(0, 3).map(m => m.wageTax), [45000, 45000, 108000]);
});
test('first salary in July uses Jan-July deduction, ordinary join only employment months; first fund is next month', () => {
  const input = fixture(); input.mode = 'join'; input.joinMonth = 7; input.salaryMonths = '12';
  let s = calculate(input).scenario!;
  assert.equal(s.months[6].wageTax, 3000); assert.equal(s.months[6].fund, 0); assert.equal(s.months[7].fund, 400000);
  input.firstSalary = false; s = calculate(input).scenario!;
  assert.equal(s.months[6].wageTax, 93000);
});
test('future bonuses are disclosed but never leak into this year cash or bonus optimization', () => {
  const input = fixture(); input.bonusNextYear = true;
  const s = calculate(input).scenario!;
  assert.equal(s.gross, 48000000); assert.equal(s.nextYearBonus, 16000000); assert.equal(s.bonusTax, 0);
  assert.equal(s.finalSeparateTax, s.finalCombinedTax);
});
test('quarterly extra pay is salary, total extra equals quoted amount, and no bonus single-tax exemption is invented', () => {
  const input = fixture(); input.bonusSchedule = 'quarterly';
  const s = calculate(input).scenario!;
  assert.equal(s.bonusTax, 0); assert.equal(s.gross, 64000000); assert.equal(s.finalTax, 9228000);
});
test('individual annuity cash payment and legally deductible limit are distinct', () => {
  const input = fixture(); input.annuity = true; input.annuityPersonal = '2000'; input.annuityBase = '40000';
  const s = calculate(input).scenario!;
  assert.equal(s.months[0].annuity, 200000); assert.equal(s.months[0].deductible, 960000);
});
test('employer insurance creates taxable benefit without becoming received cash; unknown tax creates bounded scenarios', () => {
  const base = calculate(fixture()).scenario!;
  const input = fixture(); input.insurance = true; input.insuranceEmployer = '1000'; input.insuranceTax = 'taxable';
  const taxed = calculate(input).scenario!;
  assert.equal(taxed.gross, base.gross); assert.equal(taxed.months[0].taxableBenefit, 100000);
  assert.ok(taxed.cash < base.cash);
  input.insuranceTax = 'unknown'; const range = calculate(input);
  assert.equal(range.status, 'range'); assert.ok(range.alternative!.cash > range.scenario!.cash);
});
test('annual-only deductions affect settlement, never create a negative payroll withholding refund', () => {
  const input = fixture(); input.annualDeduction = '80000';
  const s = calculate(input).scenario!;
  assert.equal(s.cash, 46433000); assert.ok(s.settlement < 0); assert.ok(s.months.every(m => m.wageTax >= 0));
});
test('bad input, multiple bonus eligibility, unresolved cities and unsupported years cannot produce stale exact results', () => {
  for (const value of ['', '-1', 'NaN']) { const input = fixture(); input.salary = value; assert.equal(calculate(input).ok, false); }
  const input = fixture(); input.bonusSchedule = 'custom'; input.events = [{ id:'1',year:2026,month:4,amount:'1000',kind:'bonus' },{ id:'2',year:2026,month:8,amount:'1000',kind:'bonus' }];
  assert.equal(calculate(input).ok, false);
  const unresolved = defaultInput(); unresolved.city = 'shenzhen'; assert.equal(calculate(unresolved).ok, false);
  unresolved.year = 2028; assert.equal(calculate(unresolved).ok, false);
});
test('city-specific cap, rounded minimum default and next-year forecast are visible in results', () => {
  const input = defaultInput(); let r = calculate(input);
  assert.equal(r.scenario!.months[0].bases.pension, 3581100); assert.equal(r.scenario!.months[6].bases.pension, 3634800);
  assert.equal(r.scenario!.months[6].fund, 181700);
  input.year = 2027; r = calculate(input); assert.equal(r.status, 'forecast');
  input.city = 'shanghai'; input.year = 2026; input.fundBps = 700; input.supplementalFund = true; input.supplementalBps = 500;
  r = calculate(input); assert.equal(r.scenario!.months[6].fund, 452800);
});
test('employer annuity taxable excess is explicitly declared, never inferred from an individual 8% cap', () => {
  const input = fixture(); input.annuity = true; input.annuityEmployer = '5000';
  let s = calculate(input).scenario!;
  assert.equal(s.months[0].taxableBenefit, 0);
  input.annuityEmployerTaxable = '1000'; s = calculate(input).scenario!;
  assert.equal(s.months[0].taxableBenefit, 100000);
  input.annuityEmployerTaxable = '6000'; assert.equal(calculate(input).ok, false);
});
test('full-year mode ignores hidden joining-only probation and fund-start settings', () => {
  const input = defaultInput(); input.salaryMonths = '12'; input.probationMonths = 3; input.probationPercent = 80; input.fundStart = 8;
  const s = calculate(input).scenario!;
  assert.equal(s.gross, 48000000); assert.equal(s.fund, 2164800);
});
test('empty joining-only numeric fields are pending input rather than a silent zero', () => {
  const input = defaultInput(); input.mode = 'join'; input.probationMonths = ''; assert.equal(calculate(input).ok, false);
  input.probationMonths = 3; input.probationPercent = ''; assert.equal(calculate(input).ok, false);
});
test('fractional salary-months use exact hundredths at half-fen boundaries', () => {
  const input = fixture(); input.salary = '0.35'; input.salaryMonths = '12.1';
  assert.equal(calculate(input).scenario!.months[11].bonus, 4);
  input.salaryMonths = '12.7'; assert.equal(calculate(input).scenario!.months[11].bonus, 25);
  assert.equal(calculate(input).scenario!.quote, 445);
});
test('dated custom events remain excluded when browsing a later year', () => {
  const input = fixture(); input.year = 2027; input.bonusSchedule = 'custom'; input.events = [{ id:'prior',year:2026,month:12,amount:'160000',kind:'bonus' }];
  assert.equal(calculate(input).scenario!.gross, 48000000);
});
