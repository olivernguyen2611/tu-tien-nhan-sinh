import type { ThemePref } from '../theme';

const LABEL: Record<ThemePref, string> = { auto: 'Tự động', light: 'Sáng', dark: 'Tối' };
const GLYPH: Record<ThemePref, string> = { auto: '自', light: '晝', dark: '夜' };

export function ThemeToggle({ pref, onChange }: { pref: ThemePref; onChange: () => void }) {
  return (
    <button class="icon-btn" onClick={onChange} title={`Giao diện: ${LABEL[pref]}`} aria-label={`Giao diện: ${LABEL[pref]}`}>
      {GLYPH[pref]}
    </button>
  );
}
