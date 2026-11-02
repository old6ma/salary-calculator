import type { CSSProperties } from 'react';
const paths = {
  arrow: 'M7 17 17 7M7 7h10v10', chevron: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  calculator: 'M5 3h14v18H5zM8 7h8M8 11h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1m-9 3h1m3 0h1m3 0h1',
  info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', reset: 'M3 11a9 9 0 1 1 2 7M3 4v7h7',
  check: 'm5 12 4 4L19 6', lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3m-4 5v2',
  calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16', document: 'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8m-8 4h6',
  wallet: 'M4 5h15v15H3V5Zm12 7h5v5h-5v-5Zm-9 0h.01', briefcase: 'M3 7h18v14H3zM8 7V3h8v4M3 12c6 4 12 4 18 0m-9 0v4',
  sliders: 'M4 7h16M4 17h16M8 4v6m8 4v6', plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M6 18 18 6',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
};
export function Icon({ name, size = 18, style }: { name: keyof typeof paths; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]}/></svg>;
}
