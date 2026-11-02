import type { SalaryInput, CityPolicy, MonthResult, Scenario, CalculationResult, ExtraEvent } from '../domain/types.ts';
import { parseMoney, tax, bonusTax, brackets, roundedContribution, clampBase } from '../domain/money.ts';
import { resolvePolicy, fundRate, nationalSources } from '../policies/cities.ts';

function money(value: string, name: string, blank?: number): number {
  if (value === '' && blank !== undefined) return blank;
  const parsed = parseMoney(value);
  if (parsed === null) throw new Error(`${name}请输入有效的非负金额，最多两位小数`);
  return parsed;
}
function numeric(value: number, min: number, max: number, name: string, integer = true): number {
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < min || value > max) throw new Error(`${name}应在${min}—${max}之间`);
  return value;
}
function percent(raw: string, name: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error(`${name}请输入百分比数值`);
  return numeric(Math.round(Number(raw) * 100), 0, 10000, name);
}
function policyFor(input: SalaryInput, month: number): CityPolicy {
  const p = resolvePolicy(input.city, input.year, month);
  if (input.city === 'custom') {
    const c = input.custom;
    for (const name of ['pension', 'medical', 'unemployment'] as const) {
      p[name] = { min: money(c[`${name}Min`], `${name}基数下限`), max: money(c[`${name}Max`], `${name}基数上限`), bps: percent(c[`${name}Bps`], `${name}缴费比例`), fixed: name === 'medical' ? money(c.medicalFixed, '医疗固定附加费') : 0 };
      if (p[name].min > p[name].max) throw new Error('缴费基数下限不能高于上限');
    }
    p.fund = { min: money(c.fundMin, '公积金基数下限'), max: money(c.fundMax, '公积金基数上限'), minBps: percent(c.fundMinPercent, '公积金最低比例'), maxBps: percent(c.fundMaxPercent, '公积金最高比例'), taxMax: money(c.fundTaxMax, '公积金税前扣除基数上限'), rounding: 'fen' };
    if (p.fund.min > p.fund.max || p.fund.minBps > p.fund.maxBps) throw new Error('自定义公积金上下限不正确');
    p.annuityTaxMax = p.fund.taxMax;
    p.missing = [];
  } else if (input.city === 'shenzhen' || input.city === 'hangzhou') {
    if (input.unemploymentBps === null) throw new Error(`${p.name}的2026个人失业险费率尚未核实，请在高级设置中按公司申报比例填写`);
    p.unemployment.bps = numeric(input.unemploymentBps, 0, 1000, '个人失业保险比例');
    if (!input.confirmCityParameters) throw new Error(`请先在高级设置核对${p.name}的城市参数，并确认使用后再测算`);
    p.missing = [];
  }
  if (input.city === 'shenzhen' && input.medicalTier === 2) p.medical.bps = 50;
  return p;
}
function inputEvents(input: SalaryInput, salary: number, months: number, start: number): { events: ExtraEvent[]; planned: number } {
  const hundredths = Math.round(months * 100) - 1200;
  const planned = Math.round(salary * hundredths / 100 * (input.mode === 'join' && input.prorateBonus ? (13 - start) / 12 : 1));
  if (input.bonusSchedule === 'custom') return { events: input.events, planned };
  const kind = input.eligibleBonus ? 'bonus' as const : 'salary' as const;
  if (input.bonusSchedule === 'annual') return { planned, events: planned === 0 ? [] : [{ id: 'annual', year: input.year + Number(input.bonusNextYear), month: input.bonusMonth, amount: (planned / 100).toFixed(2), kind }] };
  const quarters = [3, 6, 9, 12].filter(m => m >= start);
  const part = Math.floor(planned / quarters.length);
  return { planned, events: quarters.map((month, i) => ({ id: `q${month}`, year: input.year, month, amount: ((i === quarters.length - 1 ? planned - part * i : part) / 100).toFixed(2), kind: 'salary' })) };
}
function run(input: SalaryInput, insuranceMode: 'taxable' | 'eligible' | 'exempt'): Scenario {
  const salary = money(input.salary, '月薪');
  if (!/^\d+(\.\d{1,2})?$/.test(input.salaryMonths)) throw new Error('年薪月数请输入12—36之间的数字');
  const months = numeric(Number(input.salaryMonths), 12, 36, '年薪月数', false);
  const start = input.mode === 'join' ? numeric(input.joinMonth, 1, 12, '入职月份') : 1;
  numeric(input.bonusMonth, 1, 12, '奖金月份');
  const probationMonths = input.mode === 'join' ? numeric(Number.isFinite(input.probationMonths) ? Number(input.probationMonths) : NaN, 0, 12, '试用期月份') : 0;
  const probationPercent = input.mode === 'join' ? numeric(Number.isFinite(input.probationPercent) ? Number(input.probationPercent) : NaN, 0, 100, '试用期比例', false) : 100;
  if (input.mode === 'join' && input.fundStart !== null) numeric(input.fundStart, start, 12, '公积金首缴月份');
  for (const [a, b, name] of [[input.rentStart, input.rentEnd, '租房扣除月份'], [input.deductionStart, input.deductionEnd, '其他扣除月份']] as const) {
    numeric(a, 1, 12, name); numeric(b, a, 12, name);
  }
  const extra = inputEvents(input, salary, months, start);
  let bonusCount = 0;
  for (const e of extra.events) {
    numeric(e.month, 1, 12, '额外收入月份'); numeric(e.year, 2026, 2028, '额外收入年份');
    money(e.amount, '额外收入');
    if (e.year === input.year && e.month < start) throw new Error('入职前不能设置本单位工资或奖金到账');
    if (e.year === input.year && e.kind === 'bonus' && input.eligibleBonus) bonusCount++;
  }
  if (bonusCount > 1 && input.bonusMethod === 'separate') throw new Error('同一纳税年度最多设置一笔符合条件的全年一次性奖金单独计税');
  const socialBase = money(input.socialBase, '社保申报工资', salary);
  const fundBase = money(input.fundBase, '公积金申报工资', salary);
  const annuityBase = money(input.annuityBase, '年金计税工资基数', salary);
  const annuity = input.annuity ? money(input.annuityPersonal, '个人年金') : 0;
  const employerAnnuity = input.annuity ? money(input.annuityEmployer, '单位年金') : 0;
  const declaredTaxableAnnuity = input.annuity ? money(input.annuityEmployerTaxable, '单位年金应税部分') : 0;
  if (declaredTaxableAnnuity > employerAnnuity) throw new Error('单位年金应税部分不能超过单位实际缴费');
  const insurance = input.insurance ? money(input.insurancePersonal, '个人补充保险') : 0;
  const employerInsurance = input.insurance ? money(input.insuranceEmployer, '单位补充保险') : 0;
  const insuranceDeduction = input.insurance && insuranceMode === 'eligible' ? money(input.insuranceDeductible, '税优保险允许扣除') : 0;
  if (insuranceDeduction > Math.min(20000, insurance + employerInsurance)) throw new Error('税优健康险月扣除不得超过实际保费及200元限额');
  const other = money(input.otherDeduction, '其他月度专项附加扣除');
  const annual = money(input.annualDeduction, '年度汇算额外扣除');
  const deductibleForMonth = (month: number) => (input.rent && month >= input.rentStart && month <= input.rentEnd ? 150000 : 0) + (month >= input.deductionStart && month <= input.deductionEnd ? other : 0);
  if (input.city === 'custom' && input.rent) throw new Error('自定义地区请将符合当地租房标准的扣除额填入其他月度扣除，不能自动采用1500元');
  let grossWages = 0, deductions = 0, benefits = 0, paid = 0, bonusPaid = 0, totalBonus = 0;
  const result: MonthResult[] = [];
  const fundStart = input.mode === 'join' ? input.fundStart ?? (input.newWorker ? start + 1 : start) : 1;
  for (let month = 1; month <= 12; month++) {
    const p = policyFor(input, month);
    const active = month >= start;
    const fBps = fundRate(p, input.fundBps), employerBps = fundRate(p, input.employerFundBps);
    if (input.supplementalFund && input.city !== 'shanghai' && input.city !== 'custom') throw new Error('当前城市未配置补充公积金政策，请确认后使用自定义地区');
    if (input.supplementalFund) { numeric(input.supplementalBps, 100, 500, '补充公积金个人比例'); numeric(input.employerSupplementalBps, 100, 500, '补充公积金单位比例'); if (input.supplementalBps % 100 || input.employerSupplementalBps % 100) throw new Error('补充公积金比例取整数百分比'); }
    const wage = active ? Math.round(salary * (month < start + probationMonths ? probationPercent / 100 : 1)) : 0;
    const events = extra.events.filter(e => e.year === input.year && e.month === month);
    const bonus = events.filter(e => e.kind === 'bonus' && input.eligibleBonus).reduce((sum, e) => sum + money(e.amount, '奖金'), 0);
    const extraSalary = events.filter(e => e.kind !== 'bonus' || !input.eligibleBonus).reduce((sum, e) => sum + money(e.amount, '绩效'), 0);
    const bases = { pension: clampBase(socialBase, p.pension.min, p.pension.max), medical: clampBase(socialBase, p.medical.min, p.medical.max), unemployment: clampBase(socialBase, p.unemployment.min, p.unemployment.max), fund: clampBase(fundBase, p.fund.min, p.fund.max) };
    const contribution = (key: 'pension' | 'medical' | 'unemployment') => active ? roundedContribution(bases[key], p[key].bps, 'fen') + p[key].fixed : 0;
    const pension = contribution('pension'), medical = contribution('medical'), unemployment = contribution('unemployment');
    const social = pension + medical + unemployment;
    const fundAmount = (bps: number, supplemental: number) => active && month >= fundStart ? roundedContribution(bases.fund, bps, p.fund.rounding) + (input.supplementalFund ? roundedContribution(bases.fund, supplemental, p.fund.rounding) : 0) : 0;
    const fund = fundAmount(fBps, input.supplementalBps), employerFund = fundAmount(employerBps, input.employerSupplementalBps);
    const allowedFund = active && month >= fundStart ? Math.min(fund, roundedContribution(Math.min(fundBase, p.fund.taxMax), Math.min(1200, fBps + (input.supplementalFund ? input.supplementalBps : 0)), p.fund.rounding)) : 0;
    const allowedEmployerFund = active && month >= fundStart ? Math.min(employerFund, roundedContribution(Math.min(fundBase, p.fund.taxMax), Math.min(1200, employerBps + (input.supplementalFund ? input.employerSupplementalBps : 0)), p.fund.rounding)) : 0;
    const employeeAnnuity = active ? annuity : 0, companyAnnuity = active ? employerAnnuity : 0;
    const allowedAnnuity = active ? Math.min(annuity, roundedContribution(Math.min(annuityBase, p.annuityTaxMax), 400, 'fen')) : 0;
    const taxableAnnuity = active ? declaredTaxableAnnuity : 0;
    const insuranceCash = active ? insurance : 0;
    const insuranceTaxable = active && insuranceMode !== 'exempt' ? employerInsurance : 0;
    const allowedInsurance = active ? (insuranceMode === 'eligible' ? insuranceDeduction : 0) : 0;
    const taxableBenefit = employerFund - allowedEmployerFund + taxableAnnuity + insuranceTaxable;
    const deductible = social + allowedFund + allowedAnnuity + allowedInsurance;
    const wageIncome = wage + extraSalary + (input.bonusMethod === 'combined' ? bonus : 0);
    grossWages += wageIncome; benefits += taxableBenefit; deductions += deductible; totalBonus += bonus;
    const cumulativeBasic = active ? 500000 * (input.mode === 'join' && input.firstSalary ? month : month - start + 1) : 0;
    const cumulativeAdditional = Array.from({ length: month }, (_, i) => deductibleForMonth(i + 1)).reduce((a, b) => a + b, 0);
    const taxable = Math.max(0, grossWages + benefits - deductions - cumulativeBasic - cumulativeAdditional);
    const liability = tax(taxable);
    const wageTax = active ? Math.max(0, liability - paid) : 0; paid += wageTax;
    const separateTax = input.bonusMethod === 'separate' ? bonusTax(bonus) : 0; bonusPaid += separateTax;
    const cash = wage + extraSalary + bonus - social - fund - employeeAnnuity - insuranceCash - wageTax - separateTax;
    result.push({ month, active, salary: wage, extraSalary, bonus, pension, medical, unemployment, social, fund, employerFund, annuity: employeeAnnuity, employerAnnuity: companyAnnuity, insurance: insuranceCash, otherCash: employeeAnnuity + insuranceCash, deductible, taxableBenefit, deduction: active ? cumulativeBasic + cumulativeAdditional : 0, cumulativeTaxable: taxable, cumulativeTax: paid, taxRate: brackets.find(([limit]) => taxable <= limit)![1], wageTax, bonusTax: separateTax, cash, policy: p, bases });
  }
  const sum = (key: keyof MonthResult) => result.reduce((total, m) => total + (m[key] as number), 0);
  const annualAdditional = Array.from({ length: 12 }, (_, i) => deductibleForMonth(i + 1)).reduce((a, b) => a + b, 0);
  const ordinaryWages = grossWages - (input.bonusMethod === 'combined' ? totalBonus : 0);
  const annualTaxable = ordinaryWages + benefits - deductions - 6000000 - annualAdditional - annual;
  const canSeparate = bonusCount <= 1 && input.eligibleBonus;
  const finalSeparateTax = canSeparate ? tax(annualTaxable) + bonusTax(totalBonus) : tax(annualTaxable + totalBonus);
  const finalCombinedTax = tax(annualTaxable + totalBonus);
  const finalTax = input.bonusMethod === 'separate' ? finalSeparateTax : finalCombinedTax;
  return { months: result, gross: sum('salary') + sum('extraSalary') + sum('bonus'), cash: sum('cash'), tax: paid + bonusPaid, social: sum('social'), fund: sum('fund'), employerFund: sum('employerFund'), annuity: sum('annuity'), employerAnnuity: sum('employerAnnuity'), insurance: sum('insurance'), wageTax: paid, bonusTax: bonusPaid, finalSeparateTax, finalCombinedTax, finalTax, settlement: finalTax - paid - bonusPaid, nextYearBonus: extra.events.filter(e => e.year > input.year).reduce((s, e) => s + money(e.amount, '次年收入'), 0), quote: Math.round(salary * months), extraDifference: extra.events.reduce((s, e) => s + money(e.amount, '额外收入'), 0) - extra.planned };
}
export function calculate(input: SalaryInput): CalculationResult {
  try {
    if (!['beijing', 'shanghai', 'shenzhen', 'hangzhou', 'custom'].includes(input.city)) throw new Error('请选择已支持的城市或自定义地区');
    const p = policyFor(input, 12);
    const mode = input.insuranceTax === 'unknown' ? 'taxable' : input.insuranceTax;
    const scenario = run(input, mode);
    const warnings = ['按单一雇主、无其他综合所得估算；实际以工资单及年度申报为准。', '公积金比例自动取政策正常最低值，实际以公司缴存方案为准。'];
    if (!input.socialBase || !input.fundBase) warnings.push('未提供申报基数的项目按合同月薪估算；社保与公积金分别封顶。');
    if (input.year === 2027) warnings.push('2027年地方参数尚未公布的部分沿用2026年末标准预测。');
    warnings.push(...p.notes);
    if (p.status === 'incomplete') warnings.push('当前城市使用用户确认/自填参数，不标记为完整官方核实预设。');
    if (scenario.extraDifference) warnings.push('自定义发放日历与报价中的额外薪资不同，结果以实际填写的日历为准。');
    if (scenario.months.some(m => m.cash < 0)) warnings.push('部分月份工资不足以覆盖个人缴费，现金为负表示需要补付。');
    let alternative: Scenario | undefined;
    if (input.insurance && input.insuranceTax === 'unknown' && (money(input.insurancePersonal, '个人保险') || money(input.insuranceEmployer, '单位保险'))) {
      alternative = run(input, 'exempt');
      warnings.push('补充保险税务处理待确认：两端分别按单位保费应税/免税测算，未确认的税优扣除不自动计入。');
    }
    return { ok: true, errors: [], warnings: [...new Set(warnings)], status: alternative ? 'range' : input.year === 2027 ? 'forecast' : 'estimate', scenario, alternative, sources: [...nationalSources, ...p.sources] };
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : '输入参数不完整，请检查后重试'], warnings: [], status: 'invalid', sources: nationalSources };
  }
}
