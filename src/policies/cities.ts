import type { CityId, CityPolicy, ContributionRule, Source } from '../domain/types.ts';
export const cities: { id: CityId; name: string; subtitle: string }[] = [
  { id: 'beijing', name: '北京', subtitle: '北京市缴存' }, { id: 'shanghai', name: '上海', subtitle: '支持补充公积金' },
  { id: 'shenzhen', name: '深圳', subtitle: '需核对部分参数' }, { id: 'hangzhou', name: '杭州', subtitle: '需核对部分参数' },
  { id: 'custom', name: '自定义地区', subtitle: '使用已知缴费参数' },
];
const source = (title: string, url: string, note?: string): Source => ({ title, url, note });
export const nationalSources = [
  source('工资薪金累计预扣规则与税率表', 'https://fgk.chinatax.gov.cn/zcfgk/c100015/c5200946/content.html'),
  source('全年一次性奖金政策（至2027年底）', 'https://czju.suzhou.gov.cn/czj/cszc/202401/cfa3ec7cbbdb41f9b27fca4367674dc3.shtml'),
  source('首次取得工资的预扣规则', 'https://tianjin.chinatax.gov.cn/11200000000/0300/030004/03000418/20200729155939012.shtml'),
  source('社保、公积金税前扣除标准', 'https://shanghai.chinatax.gov.cn/zcfw/zcfgk/grsds/200610/t288889.html'),
  source('企业年金个人税务规则', 'https://www.chinatax.gov.cn/chinatax/n810341/n810765/n812146/n812300/c1079953/content.html'),
];
const bjSources = [
  source('北京2026社保基数', 'https://rsj.beijing.gov.cn/xxgk/2024zcjd/202608/t20260821_4831476.html'),
  source('北京2025社保基数（2026上半年适用）', 'https://swj.beijing.gov.cn/zwgk/szfgb/202512/P020251210656850568550.pdf'),
  source('北京2026公积金', 'https://gjj.beijing.gov.cn/web/zwgk61/2024zcwj/436433461/744103382/index.html'),
  source('北京职工缴费比例', 'https://www.bjfsh.gov.cn/zsk/zcwd/202608/t20260818_40116625.shtml'),
  source('北京基本医保及3元大额互助', 'https://www.beijing.gov.cn/zhengce/zfwj/zfwj2016/szfl/201905/t20190522_56689.html'),
];
const shSources = [
  source('上海2026社保基数', 'https://rsj.sh.gov.cn/tdjjf_17554/20260824/t0035_1443297.html'),
  source('上海2026公积金', 'https://www.shanghai.gov.cn/gwk/affairs/content/0064%40f3d788ec72e9404ebcbf3d27fda98435'),
  source('上海2025公积金（2026上半年适用）', 'https://www.shzfgjj.cn/html/newxxgk/zcwj/gfxwj/228051.html'),
  source('上海职工个人社保比例', 'https://www.shanghai.gov.cn/nw17239/20251211/6a00e933de0347acbc172518d6bbab79.html'),
];
const szSources = [
  source('广东2026养老基数', 'https://guangdong.chinatax.gov.cn/gdsw/ssfggds/2026-10/08/content_b40dcb7bf605411fbb12e0f81281dc6b.shtml', '搜索索引可读，原文直接访问超时'),
  source('深圳2026医保基数答复', 'https://www.sz.gov.cn/hdjlpt/detail?pid=3330310&via=pc'),
  source('深圳医保档次及个人费率', 'https://www.sz.gov.cn/zfgb/zcjd/content/post_10865980.html'),
  source('深圳公积金比例与基数规则', 'https://www.sz.gov.cn/hdjlpt/detail?pid=3463076&via=pc'),
  source('深圳2026公积金调整说明', 'https://zjj.sz.gov.cn/zcjzts/'),
  source('深圳2026最低工资调整', 'https://hrss.sz.gov.cn/tzgg/content/post_12954870.html'),
  source('广东失业降费政策到期说明', 'https://hrss.gd.gov.cn/zmhd/cjwtk/rcrs/content/mpost_4712010.html', '旧0.2%个人费率政策明确截至2025年底，2026不可自动沿用'),
];
const hzSources = [
  source('浙江2026社会保险基数通知', 'https://rlsbt.zj.gov.cn/col/col1229101513/art/2026/art_e8b496ab59834390884b8d375cff1651.html', '原文访问受限，需核对公布的5122—25611元'),
  source('杭州2025公积金（2026上半年适用）', 'https://www.hzzx.gov.cn/cshz/content/2025-07/16/content_9039745.htm'),
  source('杭州2026公积金调整（中心发布内容）', 'https://hznews.hangzhou.com.cn/jingji/content/2026-07/25/content_9263759.htm', '主管部门原通知的媒体转载，尚需核对原文'),
  source('国家医保局：杭州2026医保新政', 'https://www.nhsa.gov.cn/art/2025/10/22/art_14_18314.html'),
  source('杭州税务局：失业降费政策未延续', 'https://zhejiang.chinatax.gov.cn/art/2026/5/6/art_13129_654020.html'),
];
function rule(min: number, max: number, bps: number, fixed = 0): ContributionRule { return { min: min * 100, max: max * 100, bps, fixed }; }
export function resolvePolicy(id: CityId, year: number, month: number): CityPolicy {
  if (![2026, 2027].includes(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('仅支持2026、2027年有效月份');
  const h2 = year > 2026 || month >= 7;
  const base: CityPolicy = {
    id, name: cities.find(c => c.id === id)?.name ?? '未知地区', period: h2 ? '2026年7月起' : '2026年1—6月', status: year > 2026 ? 'forecast' : 'verified',
    pension: rule(0, 0, 800), medical: rule(0, 0, 200), unemployment: rule(0, 0, 50),
    fund: { min: 0, max: 0, minBps: 500, maxBps: 1200, rounding: 'yuan', taxMax: 0 },
    annuityTaxMax: 0, sources: [], notes: [], missing: [],
  };
  if (id === 'beijing') {
    const lo = h2 ? 7270 : 7162, hi = h2 ? 36348 : 35811;
    Object.assign(base, { pension: rule(lo, hi, 800), medical: rule(lo, hi, 200, 300), unemployment: rule(lo, hi, 50), sources: bjSources });
    base.fund = { min: 254000, max: hi * 100, minBps: 500, maxBps: 1200, rounding: 'yuan', taxMax: hi * 100 };
    base.annuityTaxMax = hi * 100;
  } else if (id === 'shanghai') {
    const lo = h2 ? 7546 : 7460, hi = h2 ? 37731 : 37302;
    Object.assign(base, { pension: rule(lo, hi, 800), medical: rule(lo, hi, 200), unemployment: rule(lo, hi, 50), sources: shSources });
    base.fund = { min: (h2 ? 2740 : 2690) * 100, max: hi * 100, minBps: 500, maxBps: 700, rounding: 'yuan', taxMax: hi * 100 };
    base.annuityTaxMax = hi * 100;
  } else if (id === 'shenzhen') {
    Object.assign(base, { status: 'incomplete', pension: rule(h2 ? 5521 : 5510, h2 ? 27603 : 27549, 800), medical: rule(6727, 33633, 200), unemployment: rule(year > 2026 || month >= 9 ? 2700 : 2520, h2 ? 48471 : 45060, 0), sources: szSources, missing: ['2026年个人失业保险费率'], notes: ['社保、公积金上限不同；失业及公积金工资上限由官方工资统计口径推算，需按实际申报核对。', '深圳医保默认一档；二档仅供符合当地参保条件人员按实际方案选择。'] });
    base.fund = { min: 252000, max: (h2 ? 48471 : 45060) * 100, minBps: 500, maxBps: 1200, rounding: 'yuan', taxMax: (h2 ? 48471 : 45060) * 100 };
    base.annuityTaxMax = (h2 ? 48471 : 45060) * 100;
  } else if (id === 'hangzhou') {
    Object.assign(base, { status: 'incomplete', pension: rule(5122, 25611, 800), medical: rule(5122, 25611, 200), unemployment: rule(5122, 25611, 0), sources: hzSources, missing: ['2026年个人失业保险费率'], notes: ['社保基数5122—25611、公积金2026年7月起2660—42151元的原文核验尚未完成，使用前需核对。', '部分信息网站仍使用已于2025年底到期的失业降费比例，本计算器不自动采用。'] });
    base.fund = { min: (h2 ? 2660 : 2490) * 100, max: (h2 ? 42151 : 40694) * 100, minBps: 500, maxBps: 1200, rounding: 'yuan', taxMax: (h2 ? 42151 : 40694) * 100 };
    base.annuityTaxMax = 2561100;
  } else {
    base.status = 'incomplete'; base.missing = ['自定义缴费基数、比例与扣除上限'];
  }
  if (year > 2026) base.notes.push('2027年未公布的地方参数沿用2026年末数据作预测，不代表2027年官方标准。');
  return base;
}
export function fundRate(p: CityPolicy, requested: number | null): number {
  const bps = requested ?? p.fund.minBps;
  if (!Number.isInteger(bps) || bps < p.fund.minBps || bps > p.fund.maxBps || (p.id !== 'custom' && bps % 100 !== 0)) throw new Error(`${p.name}基本公积金比例应为${p.fund.minBps / 100}%—${p.fund.maxBps / 100}%${p.id !== 'custom' ? '，取整数百分比' : ''}`);
  return bps;
}
