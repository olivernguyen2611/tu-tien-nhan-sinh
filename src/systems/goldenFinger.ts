// Kim Thủ Chỉ (task 5b.2, spec 4.9.2): the one "hack" of a life, rare, at most one.
// Comes at birth (tiny chance, sure after balance.goldenFinger.pityLives lives without one),
// from a rare event (effect goldenFinger), or through the remnant soul in a ring (task 4.11).
// It awakens level by level as the realm rises; its risk plays out in exposure events
// (condition goldenFinger). Data: golden-fingers.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook, GoldenFingerFile } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';

type Finger = GoldenFingerFile['fingers'][number];

/** 9.R3a: set by an action (Thiên mệnh thư, via setFlags); the next event check succeeds, then it is spent. */
export const SURE_CHECK_FLAG = 'menh_thu_sua_mot_dong';

export function fingerDef(content: Content, id: string | null | undefined): Finger | undefined {
  return content.goldenFingers.fingers.find((f) => f.id === id);
}

const realmIndex = (content: Content, id: string) => content.cultivation.realms.realms.findIndex((r) => r.id === id);

/** 9.R3a: a finger with an age / realm activation sleeps (no level, no hook) until then. */
export function fingerAwake(state: GameState, content: Content, f: Finger): boolean {
  const a = f.activation;
  if (a.kind === 'age') return state.character.age >= (a.age ?? 0);
  if (a.kind === 'realm') return realmIndex(content, state.cult.realm) >= realmIndex(content, a.realm ?? '');
  return true;
}

/** Levels of this finger the current realm has reached. */
function reachedLevel(state: GameState, content: Content, f: Finger): number {
  if (!fingerAwake(state, content, f)) return 0;
  const here = realmIndex(content, state.cult.realm);
  return f.levels.filter((l) => realmIndex(content, l.realm) <= here).length;
}

/** 9.R3c: draw a tier by balance.goldenFinger.rarityWeights, then a finger in it by weight. */
export function pickFinger(rng: Rng, content: Content, pool: Finger[]): Finger | null {
  const live = pool.filter((x) => x.weight > 0);
  if (live.length === 0) return null;
  const tiers = content.balance.goldenFinger.rarityWeights;
  if (tiers) {
    const open = Object.keys(tiers).filter((r) => live.some((x) => x.rarity === r) && (tiers[r as Finger['rarity']] ?? 0) > 0);
    if (open.length > 0) {
      const tier = rng.weighted(open, (r) => tiers[r as Finger['rarity']] ?? 0);
      return rng.weighted(live.filter((x) => x.rarity === tier), (x) => x.weight);
    }
  }
  return rng.weighted(live, (x) => x.weight);
}

const ONCE = (e: EffectHook) => e.hook.startsWith('stat.') || e.hook === 'lifespanPct';

/** Hooks of every awakened level (read through lifeHooks). */
export function goldenFingerHooks(state: GameState, content: Content): EffectHook[] {
  const g = state.goldenFinger;
  const f = g && fingerDef(content, g.id);
  if (!g || !f) return [];
  const levels = f.levels.slice(0, g.level).flatMap((l) => l.effects.filter((e) => !ONCE(e)));
  if (g.level === 0) return levels;
  // 9.R3a: its weakness while awake, and what every use has piled up.
  const piled = f.actions.flatMap((a) => {
    const n = g.count?.[a.id] ?? 0;
    return n > 0 ? a.perUse.map((e) => ({ ...e, add: e.add !== undefined ? e.add * n : undefined, mul: e.mul !== undefined ? e.mul ** n : undefined })) : [];
  });
  return [...levels, ...(f.drawback?.hooks ?? []), ...piled];
}

function addLine(state: GameState, line: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (!last) return state;
  log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { ...state, log };
}

/** Raise the level to what the realm allows: each new level logs its text and gives its one-time gains. */
export function awakenGoldenFinger(state: GameState, content: Content): GameState {
  const g = state.goldenFinger;
  const f = g && fingerDef(content, g.id);
  if (!g || !f) return state;
  const target = reachedLevel(state, content, f);
  let next = state;
  if (g.level === 0 && target > 0 && f.activation.kind !== 'birth' && f.activation.text) {
    next = addLine(next, { text: `${f.name}: ${f.activation.text}`, tone: 'rare' });
  }
  for (let lv = g.level + 1; lv <= target; lv++) {
    const l = f.levels[lv - 1];
    const stats = { ...next.stats };
    const aptitudes = { ...next.aptitudes };
    let lifespan = next.cult.lifespan;
    for (const e of l.effects.filter(ONCE)) {
      if (e.add === undefined) continue;
      const k = e.hook.slice(5);
      if (e.hook === 'lifespanPct') lifespan = Math.max(next.character.age + 1, Math.round(lifespan * (1 + e.add)));
      else if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    }
    const flags = { ...next.flags };
    for (const fl of l.setFlags) flags[fl] = true;
    next = addLine({ ...next, stats, aptitudes, flags, cult: { ...next.cult, lifespan }, goldenFinger: { ...g, level: lv } },
      { text: `${f.name} · ${l.name}: ${l.text}`, tone: 'rare' });
  }
  return next;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Gain a Kim Thủ Chỉ ("random": by weight); nothing if the life already has one. */
export function gainGoldenFinger(state: GameState, content: Content, id: string): GameState {
  if (state.goldenFinger) return state;
  let f = fingerDef(content, id);
  let next = state;
  if (id === 'random') {
    const rng = Rng.fromState(state.rng);
    f = pickFinger(rng, content, content.goldenFingers.fingers) ?? undefined;
    if (!f) return state;
    next = { ...state, rng: rng.getState() };
  }
  if (!f) return state;
  next = addLine({ ...next, goldenFinger: { id: f.id, level: 0, since: state.character.age } }, { text: `Kim Thủ Chỉ · ${f.name}: ${f.flavor}`, tone: 'rare' });
  return awakenGoldenFinger(next, content);
}

/** The finger is gone (given up, taken, driven out). */
export function loseGoldenFinger(state: GameState, content: Content): GameState {
  const f = fingerDef(content, state.goldenFinger?.id);
  if (!f) return { ...state, goldenFinger: null };
  return addLine({ ...state, goldenFinger: null }, { text: `${f.name} đã rời khỏi ngươi.`, tone: 'bad' });
}

/** Chance of a Kim Thủ Chỉ at birth, given lives played and lives since the last one (pity). */
export function birthFingerChance(content: Content, livesPlayed: number, sinceLast: number): number {
  const b = content.balance.goldenFinger;
  if (sinceLast >= b.pityLives) return 1;
  return Math.min(b.maxChance, b.birthChance + b.perLife * livesPlayed);
}

/** The birth draw (its own rng stream, so the rest of the birth is the same with or without it). */
export function rollBirthFinger(seed: string, content: Content, livesPlayed: number, sinceLast: number): string | null {
  const rng = new Rng(`${seed}:kim_thu_chi`);
  if (!rng.chance(birthFingerChance(content, livesPlayed, sinceLast))) return null;
  // 9.R3a: fingers that only come through an event are never drawn at birth.
  return pickFinger(rng, content, content.goldenFingers.fingers.filter((x) => x.activation.kind !== 'event'))?.id ?? null;
}

/** Does conditions.goldenFinger hold? */
export function goldenFingerMeets(state: GameState, c: { has?: boolean; id?: string[]; minLevel?: number }): boolean {
  const g = state.goldenFinger;
  if (c.has !== undefined && !!g !== c.has) return false;
  if (c.id && (!g || !c.id.includes(g.id))) return false;
  if (c.minLevel !== undefined && (!g || g.level < c.minLevel)) return false;
  return true;
}
