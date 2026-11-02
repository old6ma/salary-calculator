import { useState } from 'react';
import type { CalculationResult, SalaryInput, MonthResult } from '../domain/types.ts';
import { formatMoney } from '../domain/money.ts';
import { downloadCsv } from '../lib/export.ts';
import { Icon } from './Icons.tsx';
import { bonusAdvice, settlementText } from '../lib/form-state.ts';

const money = (n: number, decimals = 0) => `¥ ${formatMoney(n, decimals)}`;
export default function Results({ result: r, input: i, tab, setTab }: { result: CalculationResult; input: SalaryInput; tab: string; setTab: (tab: string) => void }) {
  const [selectedMonth, setMonth] = useState(1);
  const [expanded, expand] = useState<number | null>(null);
  if (!r.ok || !r.scenario) return <section className="results invalid-results"><div className="card empty-state" role="status"><span className="empty-icon"><Icon name="calculator" size={36}/></span><h2>先完善这份薪资方案</h2>{r.errors.map(error => <p key={error} className="error-message">{error}</p>)}<p>检查左侧输入后，测算结果会实时显示。<br/>缺少政策或参数时，不会沿用旧的到手金额。</p></div><div className="card education-card"><Icon name="info"/><div><h3>月薪相同，到手也可能不同</h3><p>个税采用年内累计预扣；城市影响缴费基数，奖金发放时间也会影响每月现金。</p></div></div></section>;
  const s = r.scenario, a = r.alternative;
  const activeMonths = s.months.filter(m => m.active);
  const month = s.months.find(m => m.month === selectedMonth) ?? activeMonths[0];
  const maxCash = Math.max(...s.months.map(m => m.cash), ...(a?.months.map(m => m.cash) ?? []), 1);
  const ordinary = activeMonths.filter(m => !m.bonus && !m.extraSalary);
  const ordinarySample = ordinary.length ? ordinary : activeMonths;
  const minOrdinary = Math.min(...ordinarySample.map(m => m.cash));
  const maxOrdinary = Math.max(...ordinarySample.map(m => m.cash));
  const hasBonus = s.months.some(m => m.bonus || m.extraSalary);
  const advice = bonusAdvice(s, a);
  const savings = advice.min === advice.max ? money(advice.min) : `${money(advice.min)}—${formatMoney(advice.max)}`;
  const range = (value: number, alt?: number) => alt !== undefined && alt !== value ? `${money(Math.min(value, alt))} — ${formatMoney(Math.max(value, alt))}` : money(value);
  return <section className="results">
    <div className="result-hero">
      <div className="hero-top"><span><i className="status-dot"/>{i.year} 年 · {i.mode === 'full' ? '完整年度测算' : `${i.joinMonth}月入职测算`}</span><span className="hero-status">{r.status === 'range' ? '保险税务待确认' : r.status === 'forecast' ? '包含预测参数' : '按方案估算'}</span></div>
      <div className="hero-number"><div><p>全年现金到手 <Icon name="wallet" size={15}/></p><h2 className={a ? 'range-number' : ''}>{range(s.cash, a?.cash)}<span>元</span></h2><span className="hero-caption">实际发放收入扣除个人缴费与当年预扣个税</span></div><div className="hero-glyph" aria-hidden="true"><span/><span/><span/><span/><Icon name="arrow" size={24}/></div></div>
      <div className="hero-bottom"><span>税前报价 <strong>{money(s.quote)}</strong></span><span>本年实际发放 <strong>{money(s.gross)}</strong></span><span>现金留存 <strong>{s.gross ? (s.cash / s.gross * 100).toFixed(1) : '0.0'}%</strong></span></div>
    </div>
    <div className="stats-grid">
      <div className="card stat"><span className="stat-top">全年折合月均<Icon name="calendar" size={16}/></span><strong>{range(Math.round(s.cash / 12), a && Math.round(a.cash / 12))}</strong><small>全年到手 ÷ 12，含奖金摊入</small></div>
      <div className="card stat"><span className="stat-top">个人社保与公积金<Icon name="shield" size={16}/></span><strong>{money(s.social + s.fund)}</strong><small>社保 {money(s.social)} · 公积金 {money(s.fund)}</small></div>
      <div className="card stat"><span className="stat-top">全年预扣个税<Icon name="document" size={16}/></span><strong>{range(s.tax, a?.tax)}</strong><small>工资税与奖金税合计</small></div>
    </div>
    <div className="card details-card">
      <div className="result-tabs" role="tablist" aria-label="测算结果视图"><button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>到手概览</button><button role="tab" aria-selected={tab === 'details'} className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>逐月明细</button><button role="tab" aria-selected={tab === 'sources'} className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>计算依据</button><button className="export-button" onClick={() => downloadCsv(s, r.status, i.year, i.mode)}><Icon name="download" size={14}/><span>导出明细</span></button></div>
      {tab === 'overview' && <div className="overview-content">
        <div className="chart-heading"><div><h3>每个月，实际到账多少？</h3><p>点击月份查看账单{r.status === 'range' ? ' · 图中展示保险应税假设' : ''}</p></div><div className="chart-legend"><span><i/>现金到手</span>{hasBonus && <span><i className="bonus-legend"/>含额外薪资</span>}</div></div>
        <div className="cash-chart"><div className="y-axis"><span>{formatMoney(maxCash / 10000, 1)}万</span><span>{formatMoney(maxCash / 20000, 1)}万</span><span>0</span></div><div className="chart-plot"><div className="chart-grid"><span/><span/><span/></div><div className="chart-bars">{s.months.map(m => <button className={`month-bar ${m.month === selectedMonth ? 'chosen' : ''} ${m.bonus || m.extraSalary ? 'with-bonus' : ''}`} key={m.month} onClick={() => setMonth(m.month)} aria-label={`${m.month}月现金到手${formatMoney(m.cash, 2)}元`} aria-pressed={m.month === selectedMonth} title={`${m.month}月 ${money(m.cash, 2)}`}><span className="bar-value">{formatMoney(m.cash)}</span><span className="bar-track"><span style={{ height: `${Math.max(m.cash > 0 ? 2 : 0, m.cash / maxCash * 100)}%` }}/></span><span className="bar-label">{m.month}<span>月</span></span></button>)}</div></div></div>
        <div className="month-receipt"><div className="receipt-label"><span>{selectedMonth.toString().padStart(2, '0')}</span><div><h4>{selectedMonth} 月到账</h4><small>{month?.active ? month.bonus || month.extraSalary ? '工资 + 额外薪资' : '普通工资月' : '尚未入职'}</small></div></div><strong>{range(month.cash, a?.months[selectedMonth - 1].cash)}</strong><div className="receipt-breakdown"><span>税前 <b>{money(month.salary + month.extraSalary + month.bonus)}</b></span><span>个人缴费 <b>−{money(month.social + month.fund + month.otherCash)}</b></span><span>个税 <b>−{money(month.wageTax + month.bonusTax)}</b></span></div></div>
        <div className="insight"><Icon name="info" size={16}/><p>普通工资月到手约 <strong>{money(minOrdinary)}—{formatMoney(maxOrdinary)} 元</strong>。年收入折合月均包含奖金摊入，不等于每月银行卡到账。</p></div>
      </div>}
      {tab === 'details' && <div className="table-content"><div className="table-note">单位：元 · 点击月份展开计算过程{a ? ' · 当前为单位保险保费应税假设，另一端结果见概览' : ''}</div><div className="table-scroll"><table><thead><tr><th>月份</th><th>税前发放</th><th>个人社保</th><th>公积金</th><th>年金 / 保险</th><th>个税</th><th>现金到手</th></tr></thead><tbody>{s.months.map(m => <MonthRow key={m.month} row={m} expanded={expanded === m.month} toggle={() => expand(expanded === m.month ? null : m.month)}/>)}<tr className="total-row"><th>全年</th><td>{formatMoney(s.gross, 2)}</td><td>{formatMoney(s.social, 2)}</td><td>{formatMoney(s.fund, 2)}</td><td>{formatMoney(s.annuity + s.insurance, 2)}</td><td>{formatMoney(s.tax, 2)}</td><td>{formatMoney(s.cash, 2)}</td></tr></tbody></table></div></div>}
      {tab === 'sources' && <div className="sources-content"><div className="source-intro"><Icon name="document"/><div><h3>每一步，都有计算依据</h3><p>政策核验日期：2026-11-02 · 地方规则按有效月份匹配</p></div></div><div className="formula-card"><span>当月预扣个税</span><p>累计应纳税所得额 × 适用税率 − 速算扣除数 − 此前已预扣税</p><small>累计所得已扣除基本减除费用、合规个人缴费及专项附加扣除等；负差额不在工资中直接退税。</small></div><h4>本次测算使用的假设</h4><ul className="assumption-list">{r.warnings.map(w => <li key={w}>{w}</li>)}</ul><h4>政策来源</h4><div className="source-links">{r.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{source.title}{source.note && <small>{source.note}</small>}</span><Icon name="external" size={15}/></a>)}</div></div>}
    </div>
    <div className="bottom-grid">
      <div className="card benefit-card"><div className="subheading"><h3><Icon name="briefcase" size={17}/>现金之外的账户</h3><span className="subtle-badge">独立列示</span></div><div className="benefit-line"><span>公积金账户全年增加</span><strong>{money(s.fund + s.employerFund)}</strong></div><div className="benefit-split"><span>你缴存 <b>{money(s.fund)}</b></span><span>公司缴存 <b>{money(s.employerFund)}</b></span></div>{i.annuity && <div className="benefit-line"><span>企业年金缴费合计</span><strong>{money(s.annuity + s.employerAnnuity)}</strong></div>}<p>公积金不计入银行卡到手。{i.annuity ? '单位年金归属及支取条件以企业方案为准。' : '提取与使用需符合当地规定。'}</p></div>
      <div className="card settlement-card"><div className="subheading"><h3><Icon name="calculator" size={17}/>年度个税对比</h3><span className="subtle-badge">汇算估计</span></div><div className="comparison"><div className={advice.winner === 'separate' ? 'better' : ''}><span>奖金单独计税</span><strong>{range(s.finalSeparateTax, a?.finalSeparateTax)}</strong>{advice.winner === 'separate' && <small>预计少缴 {savings}</small>}</div><div className={advice.winner === 'combined' ? 'better' : ''}><span>并入综合所得</span><strong>{range(s.finalCombinedTax, a?.finalCombinedTax)}</strong>{advice.winner === 'combined' && <small>预计少缴 {savings}</small>}</div></div>{advice.winner === 'uncertain' && <p className="conditional-advice">两种保险税务假设下，较优奖金方案不同，请先确认税务处理。</p>}<p>当前预扣方案{settlementText(s.settlement, a?.settlement)}。{s.nextYearBonus ? `以后年度计划发放 ${money(s.nextYearBonus)}，未计入本年。` : ''}预计退税不加进本年现金。</p></div>
    </div>
    <div className="result-note"><Icon name="info" size={15}/><p>{r.status === 'forecast' ? '当前包含2027年预测参数，待新政策公布后应重新测算。' : r.status === 'range' ? '补充保险税务属性未确认，当前显示两种假设；请按工资单实际处理选择。' : '结果依据输入方案估算，社保申报基数、奖金兑现情况和个人扣除均可能影响实际到账。'}</p></div>
  </section>;
}
function MonthRow({ row: m, expanded, toggle }: { row: MonthResult; expanded: boolean; toggle: () => void }) {
  return <><tr className={m.bonus || m.extraSalary ? 'bonus-row' : ''}><th><button onClick={toggle} aria-expanded={expanded} aria-label={`展开${m.month}月计算过程`}>{m.month}月 <Icon name="down" size={12}/></button></th><td>{formatMoney(m.salary + m.extraSalary + m.bonus, 2)}</td><td>{formatMoney(m.social, 2)}</td><td>{formatMoney(m.fund, 2)}</td><td>{formatMoney(m.otherCash, 2)}</td><td>{formatMoney(m.wageTax + m.bonusTax, 2)}</td><td className="cash-cell">{formatMoney(m.cash, 2)}</td></tr>{expanded && <tr className="expanded-row"><td colSpan={7}><div className="drilldown"><span>养老基数 <b>{money(m.bases.pension)}</b> × {m.policy.pension.bps / 100}%</span><span>医疗基数 <b>{money(m.bases.medical)}</b> × {m.policy.medical.bps / 100}% {m.policy.medical.fixed ? `+ ${money(m.policy.medical.fixed)}` : ''}</span><span>失业基数 <b>{money(m.bases.unemployment)}</b> × {m.policy.unemployment.bps / 100}%</span><span>公积金基数 <b>{money(m.bases.fund)}</b></span><span>本月合规缴费扣除 <b>{money(m.deductible, 2)}</b></span><span>累计基本/附加扣除 <b>{money(m.deduction)}</b></span><span>累计应纳税所得 <b>{money(m.cumulativeTaxable, 2)}</b> · 档位 {m.taxRate / 100}%</span><span>已累计预扣工资税 <b>{money(m.cumulativeTax, 2)}</b></span><span>当月工资税 <b>{money(m.wageTax, 2)}</b> · 奖金税 <b>{money(m.bonusTax, 2)}</b></span></div></td></tr>}</>;
}
