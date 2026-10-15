// 9.R2c: readable effect lines built from the hook data itself ("+12% tốc độ tu luyện"),
// so a khí vận card never says something its numbers don't do. Labels: content/effect-labels.json.
import type { Content } from '../core/content';
import type { EffectHook, EffectLabels } from '../core/schemas';

export interface EffectLine { text: string; good: boolean }

const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const signed = (s: string, n: number) => (n >= 0 ? `+${s}` : `−${s.replace('-', '')}`);

function format(fmt: string | undefined, v: number): string {
  switch (fmt) {
    case 'pct': return signed(`${num(Math.abs(v) * 100)}%`, v);
    case 'pts': return signed(`${num(Math.abs(v))}%`, v);
    case 'mul': return `×${num(v)}`;
    case 'count': return num(v);
    case 'num': return signed(num(Math.abs(v)), v);
    default: return signed(String(Math.round(Math.abs(v))), v);
  }
}

/** The label for a hook: exact key first, then one segment swapped for `*`. */
function labelFor(labels: EffectLabels, hook: string): { key: string; seg?: string } | null {
  if (labels.hooks[hook]) return { key: hook };
  const parts = hook.split('.');
  for (let i = parts.length - 1; i >= 1; i--) {
    const key = [...parts.slice(0, i), '*', ...parts.slice(i + 1)].join('.');
    if (labels.hooks[key]) return { key, seg: parts[i] };
  }
  return null;
}

function nameOf(content: Content, labels: EffectLabels, group: string | undefined, seg: string | undefined): string {
  if (!group || !seg) return '';
  if (group === 'realms') return content.cultivation.realms.realms.find((r) => r.id === seg)?.name ?? seg;
  return labels.names[group]?.[seg] ?? seg;
}

/** One line per hook; hooks with no label are skipped (null). */
export function describeEffect(e: EffectHook, content: Content): EffectLine | null {
  const labels = content.effectLabels;
  if (!labels) return null;
  const found = labelFor(labels, e.hook);
  if (!found) return null;
  const l = labels.hooks[found.key];
  const seg = e.hook === 'trigger.everyNYears' ? e.tag : found.seg;
  const name = nameOf(content, labels, l.names, seg);
  const v = e.mul ?? e.add ?? 0;
  const template = e.mul === 0 && l.zero ? l.zero : l.text;
  let text = template.replace('{name}', name).replace('{years}', String(e.years ?? '')).replace('{v}', format(l.fmt, v));
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (e.activeFrom) text += ` (${labels.activeFrom.replace('{age}', String(e.activeFrom.age))})`;
  const up = e.mul !== undefined ? e.mul > 1 : e.add === undefined || e.add >= 0;
  const bad = !!l.bad || labels.badWhenUp.includes(e.hook);
  return { text, good: e.mul === 0 && bad ? true : up !== bad };
}

export function describeEffects(effects: EffectHook[], content: Content): EffectLine[] {
  return effects.map((e) => describeEffect(e, content)).filter((x): x is EffectLine => !!x);
}
