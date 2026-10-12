// Tiên Thiên Khí Vận (PLAN.md task 1.3, spec 4.9.1): roll trait slots at birth,
// reroll a limited number of times, then apply the chosen traits' stat hooks.
import type { Content } from '../core/content';
import { Rng, hashSeed } from '../core/rng';
import type { EffectHook, Trait, TraitComboFile } from '../core/schemas';
import type { GameState } from '../core/types';
import { blessingGains, blessingNames } from './blessings';
import { awakenGoldenFinger, fingerDef } from './goldenFinger';
import { rebirthTalentGains, rebirthTalentNames } from './rebirthTalents';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Draw one trait not already in `taken`. Bad luck first, then rarity by weight. */
function drawOne(rng: Rng, content: Content, taken: Set<string>): Trait {
  const { badLuckChance, rarityWeights } = content.balance.traits;
  const free = content.traits.filter((t) => !taken.has(t.id));
  const bad = free.filter((t) => t.rarity === 'ac');
  if (bad.length > 0 && rng.chance(badLuckChance)) return rng.pick(bad);

  // Only rarities that still have traits left can be drawn.
  const rarities = Object.keys(rarityWeights).filter((r) => free.some((t) => t.rarity === r));
  const rarity = rng.weighted(rarities, (r) => rarityWeights[r]);
  return rng.pick(free.filter((t) => t.rarity === rarity));
}

/** Locked slots stay where they are; the others are drawn again (task 5b.3). */
function drawSlots(rng: Rng, content: Content, slots: number, offered: string[], locked: string[]): string[] {
  const taken = new Set<string>(locked);
  const out: string[] = [];
  for (let i = 0; i < slots; i++) {
    const keep = offered[i];
    if (keep && locked.includes(keep)) { out.push(keep); continue; }
    const t = drawOne(rng, content, taken);
    taken.add(t.id);
    out.push(t.id);
  }
  return out;
}

/** First roll at birth (and every reroll). */
export function rollDestiny(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const d = state.destiny;
  const offered = drawSlots(rng, content, d.slots ?? content.balance.traits.slots, d.offered, d.locked ?? []);
  return { ...state, rng: rng.getState(), destiny: { ...state.destiny, offered } };
}

/** "Nghịch thiên cải mệnh": spend one reroll (developer mode rerolls for free). */
export function rerollDestiny(state: GameState, content: Content, unlimited = false): GameState {
  if (state.destiny.confirmed || (!unlimited && state.destiny.rerollsLeft <= 0)) return state;
  const rolled = rollDestiny(state, content);
  const rerollsLeft = unlimited ? state.destiny.rerollsLeft : state.destiny.rerollsLeft - 1;
  return { ...rolled, destiny: { ...rolled.destiny, rerollsLeft } };
}

/** Task 5b.3: lock or unlock an offered slot before rerolling (up to destiny.maxLocks). */
export function toggleLock(state: GameState, traitId: string): GameState {
  const d = state.destiny;
  // Task 5b.6: a weekly challenge's given traits stay.
  if (d.confirmed || state.challenge || !d.offered.includes(traitId)) return state;
  if (d.locked.includes(traitId)) return { ...state, destiny: { ...d, locked: d.locked.filter((x) => x !== traitId) } };
  if (d.locked.length >= d.maxLocks) return state;
  return { ...state, destiny: { ...d, locked: [...d.locked, traitId] } };
}

/** Luân Hồi points the locks cost, paid when the destiny is confirmed. */
export function lockCost(state: GameState, content: Content): number {
  return state.destiny.locked.length * content.balance.traits.lockCost;
}

/** Task 5b.3: tổ hợp ẩn woken by the traits this life has. */
export function activeCombos(state: GameState, content: Content): TraitComboFile['combos'] {
  return content.traitCombos.combos.filter((c) => c.traits.every((t) => state.traits.includes(t)));
}

const ONCE = (e: EffectHook) => e.hook.startsWith('stat.') || e.hook === 'lifespanPct';

/** Hooks of the tổ hợp ẩn that last the whole life (read through lifeHooks). */
export function comboHooks(state: GameState, content: Content): EffectHook[] {
  return activeCombos(state, content).flatMap((c) => c.effects.filter((e) => !ONCE(e)));
}

/** Accept the offered traits and apply their immediate hooks (stats, lifespan). */
/** Points the chosen khí vận add up to (balance.traits.fate.rarityScore). */
export function fateScore(traits: Trait[], content: Content): number {
  const score = content.balance.traits.fate.rarityScore;
  return traits.reduce((sum, t) => sum + (score[t.rarity] ?? 0), 0);
}

/**
 * Backlog 5: a better tiên thiên khí vận means higher starting stats, in proportion. Every listed stat
 * is lifted to a floor that grows with the score (so a born genius never rolls low), then gets a flat
 * bonus. Deterministic from the seed: no RNG is consumed.
 */
export function applyFateLift(state: GameState, traits: Trait[], content: Content): { stats: GameState['stats']; aptitudes: GameState['aptitudes']; lifted: boolean } {
  const cfg = content.balance.traits.fate;
  const score = fateScore(traits, content);
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  if (score <= 0) return { stats, aptitudes, lifted: false };
  const floor = Math.min(cfg.floorMax, score * cfg.floorPerPoint);
  const bonus = Math.min(cfg.bonusMax, score * cfg.bonusPerPoint);
  for (const key of cfg.stats) {
    const jitter = cfg.floorJitter > 0 ? hashSeed(`${state.seed}|fate|${key}`) % (cfg.floorJitter + 1) : 0;
    const target = Math.min(100, floor + jitter * Math.min(1, floor / cfg.floorMax));
    if (key in stats) stats[key as keyof typeof stats] = clamp(Math.max(stats[key as keyof typeof stats], target) + bonus);
    else if (key in aptitudes) aptitudes[key as keyof typeof aptitudes] = clamp(Math.max(aptitudes[key as keyof typeof aptitudes], target) + bonus);
  }
  return { stats, aptitudes, lifted: score >= cfg.noteFrom };
}

export function confirmDestiny(state: GameState, content: Content): GameState {
  if (state.destiny.confirmed) return state;
  const chosen = state.destiny.offered
    .map((id) => content.traits.find((t) => t.id === id))
    .filter((t): t is Trait => !!t);

  let stats = { ...state.stats };
  let aptitudes = { ...state.aptitudes };
  let lifespanPct = 0;

  // Phúc báo from the last life (task 5b.8) give their one-time gains with the traits.
  const combos = activeCombos({ ...state, traits: chosen.map((t) => t.id) }, content);
  const gains = [...chosen.map((t) => t.effects), ...combos.map((c) => c.effects.filter(ONCE)), blessingGains(state, content), rebirthTalentGains(state, content)];
  for (const effects of gains) {
    for (const e of effects) {
      if (e.hook.startsWith('stat.') && e.add !== undefined) {
        const key = e.hook.slice(5);
        if (key in stats) stats[key as keyof typeof stats] = clamp(stats[key as keyof typeof stats] + e.add);
        else if (key in aptitudes) aptitudes[key as keyof typeof aptitudes] = clamp(aptitudes[key as keyof typeof aptitudes] + e.add);
      } else if (e.hook === 'lifespanPct' && e.add !== undefined) {
        lifespanPct += e.add;
      }
      // Other hooks are read by their own systems (cultivation, combat, events…) later.
    }
  }

  // Backlog 5: the khí vận lifts the starting stats after the traits' own gains.
  const lift = applyFateLift({ ...state, stats, aptitudes }, chosen, content);
  stats = lift.stats;
  aptitudes = lift.aptitudes;

  const lifespan = Math.max(1, Math.round(state.cult.lifespan * (1 + lifespanPct)));
  const talentNames = rebirthTalentNames(state, content);
  const notable = chosen.filter((t) => t.rarity === 'thien' || t.rarity === 'than');
  const birth = state.log[0];
  const lines = [
    ...birth.lines,
    { text: `Tiên thiên khí vận: ${chosen.map((t) => t.name).join(', ')}.`, tone: notable.length ? ('rare' as const) : ('normal' as const) },
    ...notable.map((t) => ({ text: t.flavor, tone: 'rare' as const })),
    ...(lift.lifted ? [{ text: content.lifeTexts.fateLift, tone: 'rare' as const }] : []),
    ...combos.map((c) => ({ text: `Tổ hợp ẩn · ${c.name}: ${c.text}`, tone: 'rare' as const })),
    ...(state.blessings.length > 0 ? [{ text: `Phúc báo kiếp trước: ${blessingNames(state.blessings, content).join(', ')}.`, tone: 'rare' as const }] : []),
    ...(talentNames.length > 0 ? [{ text: `Thiên phú luân hồi: ${talentNames.join(', ')}.`, tone: 'good' as const }] : []),
  ];

  const finger = fingerDef(content, state.goldenFinger?.id);
  if (finger) lines.push({ text: `Kim Thủ Chỉ · ${finger.name}: ${finger.flavor}`, tone: 'rare' as const });
  return awakenGoldenFinger({
    ...state,
    stats,
    aptitudes,
    cult: { ...state.cult, lifespan },
    traits: chosen.map((t) => t.id),
    destiny: { ...state.destiny, confirmed: true },
    log: [{ ...birth, lines }, ...state.log.slice(1)],
  }, content);
}
