import type { Scenario } from '../domain/types.ts';
export function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function toCsv(s: Scenario, status: string, year: number, mode: string): string {
  const yuan = (fen: number) => (fen / 100).toFixed(2);
  const lines: (string | number)[][] = [
    ['薪有数 · 薪资测算', year, mode === 'full' ? '完整年度' : '入职当年', status === 'forecast' ? '预测参数' : status === 'range' ? '保险税务待核实（应税端）' : '按输入假设估算', '单位：元'],
    ['月份', '工资', '额外薪资/奖金', '个人社保', '个人公积金', '个人年金/保险', '工资个税', '奖金个税', '现金到手', '单位公积金', '参数状态'],
    ...s.months.map(m => [m.month, yuan(m.salary), yuan(m.extraSalary + m.bonus), yuan(m.social), yuan(m.fund), yuan(m.otherCash), yuan(m.wageTax), yuan(m.bonusTax), yuan(m.cash), yuan(m.employerFund), m.policy.status]),
    ['全年合计', yuan(s.gross), '', yuan(s.social), yuan(s.fund), yuan(s.annuity + s.insurance), yuan(s.wageTax), yuan(s.bonusTax), yuan(s.cash), yuan(s.employerFund)],
    ['预计汇算退补税（正补负退）', yuan(s.settlement)], ['以后年度计划发放（未计入本年）', yuan(s.nextYearBonus)],
  ];
  return '\uFEFF' + lines.map(line => line.map(csvCell).join(',')).join('\r\n');
}
export function downloadCsv(s: Scenario, status: string, year: number, mode: string): void {
  const url = URL.createObjectURL(new Blob([toCsv(s, status, year, mode)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `薪有数-${year}-逐月明细.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
