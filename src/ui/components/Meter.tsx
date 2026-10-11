import { Term } from './Tooltip';

/**
 * Labelled progress bar. With `tone="auto"` the color follows the value like a health bar.
 * `term` makes the label open that glossary entry.
 */
export function Meter({ label, value, max = 100, color, text, tone, term }: {
  label: string; value: number; max?: number; color?: string; text?: string; tone?: 'auto'; term?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === 'auto' ? (pct >= 60 ? 'var(--good)' : pct >= 30 ? 'var(--warn)' : 'var(--bad)') : color;
  return (
    <div>
      <div class="label">
        <span>{term ? <Term id={term}>{label}</Term> : label}</span>
        <b>{text ?? `${Math.round(pct)}%`}</b>
      </div>
      <div class="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}
