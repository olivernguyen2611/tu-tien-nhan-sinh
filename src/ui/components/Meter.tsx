export function Meter({ label, value, max, color, text }: { label: string; value: number; max: number; color: string; text?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div class="meter-label">
        <span>{label}</span>
        <span>{text ?? `${Math.round(pct)}%`}</span>
      </div>
      <div class="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
