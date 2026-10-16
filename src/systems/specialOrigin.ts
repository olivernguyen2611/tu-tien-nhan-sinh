// 9.S1 Tình tiết Đặc biệt Hiếm: a rare twist decided at birth (Hệ thống, trùng sinh, phế vật nghịch tập,
// đường thành tiên…), shown on the "Thiên cơ biến động" screen. Never in a first life; unlocked over lives
// by Sổ tri thức entries and the karma the last life left. Own seed stream `${seed}:origin`.
// Content in content/special-origins/*.json, numbers in balance.specialOrigins.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook, SpecialOrigin } from '../core/schemas';
import type { GameState } from '../core/types';
import { applyGainHooks, hookSum } from './cultivation';
import { knowsFor } from './knowledge';
import { bindSystem } from './heThong';
import { bindTrungSinh } from './trungSinh';

const BASE_GROUPS = ['he_thong', 'trung_sinh', 'phe_vat'];
const ONCE = (e: EffectHook) => e.hook.startsWith('stat.') || e.hook === 'lifespanPct' || e.hook === 'birthSilver';

export const originDef = (content: Content, id: string) => (content.specialOrigins ?? []).find((o) => o.id === id);

/** The tình tiết this life could draw (unlocked, not barred by a Kim Thủ Chỉ). `pastKarma`: what the last life left. */
export function openOrigins(state: GameState, content: Content, pastKarma = 0): SpecialOrigin[] {
  const lives = state.lifeNo ?? 1;
  return (content.specialOrigins ?? []).filter((o) => o.weight > 0 && lives >= o.unlock.livesMin
    && o.unlock.requiresKnowledge.every((k) => knowsFor(state.knowledge, k))
    && (o.unlock.karmaMin === undefined || pastKarma >= o.unlock.karmaMin)
    && (o.unlock.karmaMax === undefined || pastKarma <= o.unlock.karmaMax)
    && !(o.excludesFinger && state.goldenFinger));
}

/** Chance this life draws any tình tiết at all (0 in a first life). */
export function specialChance(state: GameState, content: Content): number {
  const cfg = content.balance.specialOrigins;
  if ((state.lifeNo ?? 1) < cfg.minLives) return 0;
  const p = cfg.chance + cfg.luckPer * (state.aptitudes.luck - 50) + hookSum(state, content, 'specialOriginChance');
  return Math.max(0, Math.min(1, p));
}

const originWeight = (state: GameState, o: SpecialOrigin) => o.weight * state.traits.reduce((m, t) => m * (o.traitWeight[t] ?? 1), 1);

/** At birth, once the khí vận is known: maybe draw tình tiết and give their gains and costs. */
export function rollSpecialOrigin(state: GameState, content: Content, pastKarma = 0, force?: string): GameState {
  // A weekly challenge keeps its fixed rules.
  if (state.special || (state.challenge && !force)) return state;
  const rng = new Rng(`${state.seed}:origin`);
  const forced = force ? originDef(content, force) : undefined;
  let picked: SpecialOrigin[] = [];
  if (forced) picked = [forced];
  else if (rng.chance(specialChance(state, content))) {
    let pool = openOrigins(state, content, pastKarma);
    for (let i = 0; i < content.balance.specialOrigins.maxPerLife && pool.length > 0; i++) {
      const o = rng.weighted(pool, (x) => originWeight(state, x));
      if (originWeight(state, o) <= 0) break;
      picked.push(o);
      // One "nền" a life; exclusiveWith works both ways. Each draw after the first needs its own luck.
      pool = pool.filter((x) => x.id !== o.id && !o.exclusiveWith.includes(x.id) && !x.exclusiveWith.includes(o.id)
        && !(BASE_GROUPS.includes(o.group) && BASE_GROUPS.includes(x.group)));
      if (!rng.chance(specialChance(state, content))) break;
    }
  }
  if (picked.length === 0) return state;
  let s = applyGainHooks(state, picked.flatMap((o) => [...o.costs, ...o.effects].filter(ONCE)));
  const silver = picked.flatMap((o) => [...o.costs, ...o.effects]).filter((e) => e.hook === 'birthSilver').reduce((n, e) => n + (e.add ?? 0), 0);
  const followUps = picked.flatMap((o) => o.startEvents.map((e) => ({ event: e.event, atAge: Math.max(e.atAge, s.character.age) })));
  const flags = Object.fromEntries(picked.map((o) => [`origin_${o.id}`, true]));
  const birth = s.log[0];
  s = {
    ...s,
    special: { ids: picked.map((o) => o.id), seen: false },
    flags: { ...s.flags, ...flags },
    money: { ...s.money, silver: Math.max(0, s.money.silver + silver) },
    events: { ...s.events, followUps: [...followUps, ...s.events.followUps] },
    log: birth ? [{ ...birth, lines: [...birth.lines, ...picked.map((o) => ({ text: `Thiên cơ biến động · ${o.name}.`, tone: 'rare' as const }))] }, ...s.log.slice(1)] : s.log,
  };
  // 9.S2: a Hệ thống origin binds its system.
  for (const o of picked) if (o.system) s = bindSystem(s, content, o.system);
  return s;
}

/** Hooks of this life's tình tiết that act all life (lifeHooks). */
export function specialHooks(state: GameState, content: Content): EffectHook[] {
  return (state.special?.ids ?? []).flatMap((id) => {
    const o = originDef(content, id);
    const v = o?.variants.find((x) => x.id === state.special?.variants?.[id]);
    return o ? [...o.costs, ...o.effects, ...(v ? [...v.costs, ...v.effects] : [])].filter((e) => !ONCE(e)) : [];
  });
}

/** 9.S3: tình tiết of this life that still wait for the player to pick a variant. */
export const pendingVariants = (state: GameState, content: Content) =>
  (state.special?.ids ?? []).map((id) => originDef(content, id)).filter((o): o is SpecialOrigin => !!o && o.variants.length > 0 && !state.special?.variants?.[o.id]);

/** 9.S3: pick a variant of a tình tiết: its gains, costs and start events apply; memories bind Trùng sinh. */
export function chooseVariant(state: GameState, content: Content, originId: string, variantId: string): GameState {
  const o = originDef(content, originId);
  const v = o?.variants.find((x) => x.id === variantId);
  if (!o || !v || !state.special?.ids.includes(o.id) || state.special.variants?.[o.id]) return state;
  let s = applyGainHooks(state, [...v.costs, ...v.effects].filter(ONCE));
  const followUps = v.startEvents.map((e) => ({ event: e.event, atAge: Math.max(e.atAge, s.character.age + 1) }));
  s = {
    ...s,
    special: { ...state.special, variants: { ...state.special.variants, [o.id]: v.id } },
    flags: { ...s.flags, [`origin_${o.id}_${v.id}`]: true },
    events: { ...s.events, followUps: [...followUps, ...s.events.followUps] },
  };
  return v.memories ? bindTrungSinh(s, content) : s;
}

/** The Thiên cơ biến động screen was shown; a variant not picked falls to the first. */
export function seeSpecial(state: GameState, content?: Content): GameState {
  if (!state.special || state.special.seen) return state;
  const s = content ? pendingVariants(state, content).reduce((st, o) => chooseVariant(st, content, o.id, o.variants[0].id), state) : state;
  return { ...s, special: { ...s.special!, seen: true } };
}
