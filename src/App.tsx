import { useMemo, useState } from 'react';
import { defaultInput } from './domain/types.ts';
import type { SalaryInput, CityId } from './domain/types.ts';
import { parseMoney, formatMoney } from './domain/money.ts';
import { calculate } from './calculator/calculate.ts';
import { readSaved, serializeInput, storageKey } from './lib/persistence.ts';
import Inputs from './components/Inputs.tsx';
import Results from './components/Results.tsx';
import { Icon } from './components/Icons.tsx';
import { applyInputPatch } from './lib/form-state.ts';

function initialInput(): SalaryInput { try { return readSaved(localStorage.getItem(storageKey)); } catch { return defaultInput(); } }
export default function App() {
  const [input, setInput] = useState<SalaryInput>(initialInput);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState('');
  const [pendingCity, setPendingCity] = useState<CityId | null>(null);
  const result = useMemo(() => calculate(input), [input]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3500); };
  const patch = (patch: Partial<SalaryInput>) => setInput(current => {
    const next = applyInputPatch(current, patch);
    try { localStorage.setItem(storageKey, serializeInput(next)); } catch { /* Browsing without storage remains usable. */ }
    return next;
  });
  const applyCity = (city: CityId) => {
    patch({ city, fundBps: null, employerFundBps: null, supplementalFund: false, socialBase: '', fundBase: '', unemploymentBps: null, confirmCityParameters: false, medicalTier: 1 });
    setPendingCity(null); notify('已更新城市政策与自动公积金比例');
  };
  const changeCity = (city: CityId) => {
    if (city === input.city) return;
    const hasOverrides = input.fundBps !== null || input.employerFundBps !== null || input.socialBase !== '' || input.fundBase !== '';
    if (hasOverrides) { setPendingCity(city); return; }
    applyCity(city);
  };
  const reset = () => { const next = defaultInput(); setInput(next); try { localStorage.setItem(storageKey, serializeInput(next)); } catch {} notify('已恢复示例方案'); };
  const clear = () => { try { localStorage.removeItem(storageKey); } catch {} setInput(defaultInput()); notify('已删除本地保存的数据，当前显示示例'); };
  const salary = parseMoney(input.salary);
  const validMonths = /^\d+(\.\d{1,2})?$/.test(input.salaryMonths) && Number(input.salaryMonths) >= 12 && Number(input.salaryMonths) <= 36;
  return <><div inert={pendingCity !== null}><header className="site-header"><div className="header-inner"><a href="#" className="brand" onClick={e => { e.preventDefault(); setTab('overview'); }} aria-label="薪有数首页"><span className="brand-mark"><span/><span/><span/></span><strong>薪有数<span>OFFER LENS</span></strong></a><nav aria-label="主导航"><button className={tab !== 'sources' ? 'active' : ''} onClick={() => setTab('overview')}><Icon name="calculator" size={16}/>薪资测算</button><button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}><Icon name="document" size={16}/>政策与口径</button></nav><span className="privacy-pill"><Icon name="shield" size={14}/>本地计算，安心比较</span></div></header>
    <main className="page"><section className="intro"><div><div className="eyebrow"><span/>OFFER SEASON / 秋招薪资指南</div><h1>好 Offer，<span>心里有数。</span></h1><p>把税前年薪，换成看得懂的到手收入。</p></div><div className="quote-preview"><span>你的税前薪资包</span><strong>{salary === null ? '—' : formatMoney(salary)}<span> × </span>{validMonths ? input.salaryMonths : '—'}<small>薪</small></strong><span>薪资之外，也看见每一份保障 <Icon name="arrow" size={13}/></span></div></section>
      <div className="workspace-heading"><div><span className="step-number">01</span><span>填写方案，看清现金与福利</span></div><button className="text-button muted" onClick={reset}><Icon name="reset" size={15}/>恢复示例</button></div>
      <div className="workspace"><Inputs input={input} patch={patch} changeCity={changeCity}/><Results result={result} input={input} tab={tab} setTab={setTab}/></div>
      <footer className="site-footer"><span><span className="footer-brand">薪有数</span>每一份选择，都值得算清楚。</span><div><span>政策核验于 2026.11.02</span><button onClick={clear}>删除本地数据</button></div></footer>
    </main></div>{pendingCity && <div className="modal-backdrop"><div className="city-modal card" role="alertdialog" aria-modal="true" aria-labelledby="city-dialog-title" aria-describedby="city-dialog-description" onKeyDown={e => {
      if (e.key === 'Escape') setPendingCity(null);
      if (e.key === 'Tab') {
        const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
        if (e.shiftKey && e.target === buttons[0]) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
        if (!e.shiftKey && e.target === buttons[buttons.length - 1]) { e.preventDefault(); buttons[0].focus(); }
      }
    }}><span className="section-icon"><Icon name="sliders" size={24}/></span><h2 id="city-dialog-title">更新城市缴费参数？</h2><p id="city-dialog-description">将重置公积金比例、申报基数与医保档次，采用新城市的参数。你的月薪和薪资安排会保留。</p><div className="modal-actions"><button autoFocus onClick={() => setPendingCity(null)}>保留当前城市</button><button className="primary-button" onClick={() => applyCity(pendingCity)}>确认切换</button></div></div></div>}{toast && <div className="toast" role="status"><Icon name="check" size={16}/>{toast}</div>}
  </>;
}
