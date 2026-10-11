/** Labelled progress bar. With `tone="auto"` the color follows the value like a health bar. */
export function Meter({ label, value, max = 100, color, text, tone }: {
  label: string; value: number; max?: number; color?: string; text?: string; tone?: 'auto';
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === 'auto' ? (pct >= 60 ? 'var(--good)' : pct >= 30 ? 'var(--warn)' : 'var(--bad)') : color;
  return (
    <div>
      <div class="label">
        <span>{label}</span>
        <b>{text ?? `${Math.round(pct)}%`}</b>
      </div>
      <div class="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}
