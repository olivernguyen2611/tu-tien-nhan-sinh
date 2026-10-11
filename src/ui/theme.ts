// Light/dark preference, applied as <html data-theme>. "auto" follows the device.
export type ThemePref = 'auto' | 'light' | 'dark';

const KEY = 'tutien.theme';

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyThemePref(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
  try {
    if (pref === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* storage may be blocked; the theme still applies for this visit */
  }
}

/** Cycle auto → light → dark → auto. */
export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
}
