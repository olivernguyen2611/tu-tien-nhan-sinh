// 9.R11: display and pace preferences kept in this browser (Cài đặt): years per fast-forward press,
// text size, less motion, and the "ẩn nội dung nhạy cảm" switch (applied to each life by systems/options).
export type FontSize = 's' | 'm' | 'l' | 'xl';
export interface Prefs { ffYears: number | null; font: FontSize; reduceMotion: boolean; gentle: boolean }

const KEY = 'bachthe.prefs';
export const DEFAULT_PREFS: Prefs = { ffYears: null, font: 'm', reduceMotion: false, gentle: false };
export const FONT_LABELS: [FontSize, string][] = [['s', 'Nhỏ'], ['m', 'Vừa'], ['l', 'Lớn'], ['xl', 'Rất lớn']];

export function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>;
    return {
      ffYears: typeof p.ffYears === 'number' && p.ffYears > 0 ? p.ffYears : null,
      font: FONT_LABELS.some(([f]) => f === p.font) ? p.font! : 'm',
      reduceMotion: p.reduceMotion === true,
      gentle: p.gentle === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Keep the prefs and show them: <html data-font> and <html data-motion>. */
export function applyPrefs(p: Prefs): void {
  const root = document.documentElement;
  if (p.font === 'm') root.removeAttribute('data-font');
  else root.setAttribute('data-font', p.font);
  if (p.reduceMotion) root.setAttribute('data-motion', 'reduce');
  else root.removeAttribute('data-motion');
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* blocked storage: applies for this visit only */ }
}
