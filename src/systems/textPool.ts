// 9.3 Văn bản có ngữ cảnh, chống lặp. A pool is a list of lines (each may carry conditions: the other person's
// thiện cảm, mood, age, tầng, relation) or a line built from parts. Each life remembers the last few picks of
// every pool (GameState.textMemory) and avoids them; lines used often weigh less. Numbers in balance.text.
import type { Content } from '../core/content';
import type { Rng } from '../core/rng';
import type { TextLine, TextPool, TextWhen } from '../core/schemas';
import type { GameState } from '../core/types';

type Line = TextLine;

/** What the line is about, beyond the player: the other person's thiện cảm, the relation (cha, đạo lữ…). */
export interface TextContext { affinity?: number; relation?: string }

const textOf = (l: Line) => (typeof l === 'string' ? l : l.text);
const weightOf = (l: Line) => (typeof l === 'string' ? 1 : l.weight);

function fits(when: TextWhen | undefined, state: GameState, ctx: TextContext): boolean {
  if (!when) return true;
  const a = ctx.affinity;
  if (when.affinityMin !== undefined && (a === undefined || a < when.affinityMin)) return false;
  if (when.affinityMax !== undefined && (a === undefined || a > when.affinityMax)) return false;
  if (when.moodMin !== undefined && state.stats.happiness < when.moodMin) return false;
  if (when.moodMax !== undefined && state.stats.happiness > when.moodMax) return false;
  if (when.ageMin !== undefined && state.character.age < when.ageMin) return false;
  if (when.ageMax !== undefined && state.character.age > when.ageMax) return false;
  if (when.tier && !when.tier.includes(state.tier ?? '')) return false;
  if (when.relation && (!ctx.relation || !when.relation.includes(ctx.relation))) return false;
  return true;
}

/** Pick one line of a list, avoiding the last picks in `memory`. */
function pickLine(lines: Line[], state: GameState, ctx: TextContext, memory: string[], content: Content, rng: Rng): string {
  const cfg = content.balance.text;
  const ok = lines.filter((l) => fits(typeof l === 'string' ? undefined : l.when, state, ctx));
  const pool = ok.length > 0 ? ok : lines.filter((l) => typeof l === 'string' || !l.when);
  const usable = pool.length > 0 ? pool : lines;
  const recent = memory.slice(-cfg.avoid);
  const fresh = usable.filter((l) => !recent.includes(textOf(l)));
  const from = fresh.length > 0 ? fresh : usable;
  const w = (l: Line) => weightOf(l) * cfg.decay ** memory.filter((m) => m === textOf(l)).length;
  return textOf(from.some((l) => w(l) > 0) ? rng.weighted(from, w) : rng.pick(from));
}

const remember = (mem: Record<string, string[]>, key: string, text: string, keep: number) => ({ ...mem, [key]: [...(mem[key] ?? []), text].slice(-keep) });

/** Draw a line of `pool` for this life; the pick is remembered under `key` (e.g. "romance.company"). */
export function drawText(state: GameState, content: Content, key: string, pool: TextPool, ctx: TextContext, rng: Rng): { text: string; state: GameState } {
  const keep = content.balance.text.memory;
  let mem = state.textMemory ?? {};
  let text: string;
  if (Array.isArray(pool)) {
    text = pickLine(pool, state, ctx, mem[key] ?? [], content, rng);
    mem = remember(mem, key, text, keep);
  } else if (pool.lines.length > 0 && rng.chance(pool.linesShare)) {
    text = pickLine(pool.lines, state, ctx, mem[key] ?? [], content, rng);
    mem = remember(mem, key, text, keep);
  } else {
    const parts = pool.parts.map((p, i) => pickLine(p, state, ctx, mem[`${key}.${i}`] ?? [], content, rng));
    parts.forEach((p, i) => { mem = remember(mem, `${key}.${i}`, p, keep); });
    text = parts.filter((p) => p.trim().length > 0).join(' ');
  }
  return { text, state: { ...state, textMemory: mem } };
}

/** All whole lines and parts of a pool (for the validator and tests). */
export const poolTexts = (pool: TextPool): string[] => (Array.isArray(pool) ? pool.map(textOf) : [...pool.lines.map(textOf), ...pool.parts.flat().map(textOf)]);

/** An outcome's text, or one of its `variants` drawn under `key`; no variants → the text as is, no roll. */
export function outcomeText(state: GameState, content: Content, key: string, outcome: { text: string; variants?: string[] }, rng: Rng): { text: string; state: GameState } {
  if (!outcome.variants?.length) return { text: outcome.text, state };
  return drawText(state, content, key, [outcome.text, ...outcome.variants], {}, rng);
}
