export type CityId = 'beijing' | 'shanghai' | 'shenzhen' | 'hangzhou' | 'custom';
export type Source = { title: string; url: string; note?: string };
export type ContributionRule = { min: number; max: number; bps: number; fixed: number };
export type CityPolicy = {
  id: CityId; name: string; period: string; status: 'verified' | 'forecast' | 'incomplete';
  pension: ContributionRule; medical: ContributionRule; unemployment: ContributionRule;
  fund: { min: number; max: number; minBps: number; maxBps: number; rounding: 'yuan' | 'fen'; taxMax: number };
  annuityTaxMax: number; sources: Source[]; notes: string[]; missing: string[];
};
export type ExtraEvent = { id: string; year: number; month: number; amount: string; kind: 'salary' | 'bonus' };
export type SalaryInput = {
  city: CityId; year: number; salary: string; salaryMonths: string; mode: 'full' | 'join';
  joinMonth: number; firstSalary: boolean; newWorker: boolean; fundStart: number | null;
  probationMonths: number | ''; probationPercent: number | ''; bonusSchedule: 'annual' | 'quarterly' | 'custom';
  bonusMonth: number; bonusNextYear: boolean; prorateBonus: boolean; eligibleBonus: boolean;
  bonusMethod: 'separate' | 'combined'; events: ExtraEvent[];
  socialBase: string; fundBase: string; fundBps: number | null; employerFundBps: number | null;
  supplementalFund: boolean; supplementalBps: number; employerSupplementalBps: number;
  annuity: boolean; annuityPersonal: string; annuityEmployer: string; annuityBase: string; annuityEmployerTaxable: string;
  insurance: boolean; insurancePersonal: string; insuranceEmployer: string;
  insuranceTax: 'unknown' | 'taxable' | 'eligible' | 'exempt'; insuranceDeductible: string;
  rent: boolean; rentStart: number; rentEnd: number; otherDeduction: string; deductionStart: number; deductionEnd: number; annualDeduction: string;
  unemploymentBps: number | null; confirmCityParameters: boolean;
  custom: { pensionMin: string; pensionMax: string; pensionBps: string; medicalMin: string; medicalMax: string; medicalBps: string; medicalFixed: string; unemploymentMin: string; unemploymentMax: string; unemploymentBps: string; fundMin: string; fundMax: string; fundMinPercent: string; fundMaxPercent: string; fundTaxMax: string };
  medicalTier: 1 | 2;
};
export type MonthResult = {
  month: number; active: boolean; salary: number; extraSalary: number; bonus: number;
  pension: number; medical: number; unemployment: number; social: number; fund: number; employerFund: number;
  annuity: number; employerAnnuity: number; insurance: number; otherCash: number; deductible: number;
  taxableBenefit: number; deduction: number; cumulativeTaxable: number; cumulativeTax: number;
  taxRate: number; wageTax: number; bonusTax: number; cash: number; policy: CityPolicy;
  bases: { pension: number; medical: number; unemployment: number; fund: number };
};
export type Scenario = { months: MonthResult[]; gross: number; cash: number; tax: number; social: number; fund: number; employerFund: number; annuity: number; employerAnnuity: number; insurance: number; wageTax: number; bonusTax: number; finalSeparateTax: number; finalCombinedTax: number; finalTax: number; settlement: number; nextYearBonus: number; quote: number; extraDifference: number };
export type CalculationResult = { ok: boolean; errors: string[]; warnings: string[]; status: 'estimate' | 'forecast' | 'range' | 'invalid'; scenario?: Scenario; alternative?: Scenario; sources: Source[] };
export function defaultInput(): SalaryInput {
  return {
    city: 'beijing', year: 2026, salary: '40000', salaryMonths: '16', mode: 'full', joinMonth: 7,
    firstSalary: true, newWorker: true, fundStart: null, probationMonths: 0, probationPercent: 100,
    bonusSchedule: 'annual', bonusMonth: 12, bonusNextYear: false, prorateBonus: true, eligibleBonus: true, bonusMethod: 'separate', events: [],
    socialBase: '', fundBase: '', fundBps: null, employerFundBps: null, supplementalFund: false, supplementalBps: 100, employerSupplementalBps: 100,
    annuity: false, annuityPersonal: '0', annuityEmployer: '0', annuityBase: '', annuityEmployerTaxable: '0',
    insurance: false, insurancePersonal: '0', insuranceEmployer: '0', insuranceTax: 'unknown', insuranceDeductible: '0',
    rent: false, rentStart: 1, rentEnd: 12, otherDeduction: '0', deductionStart: 1, deductionEnd: 12, annualDeduction: '0',
    unemploymentBps: null, confirmCityParameters: false, medicalTier: 1,
    custom: { pensionMin: '', pensionMax: '', pensionBps: '', medicalMin: '', medicalMax: '', medicalBps: '', medicalFixed: '', unemploymentMin: '', unemploymentMax: '', unemploymentBps: '', fundMin: '', fundMax: '', fundMinPercent: '', fundMaxPercent: '', fundTaxMax: '' },
  };
}
