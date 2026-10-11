// Tiên Thiên Khí Vận (PLAN.md task 1.3, spec 4.9.1): roll trait slots at birth,
// reroll a limited number of times, then apply the chosen traits' stat hooks.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { Trait } from '../core/schemas';
import type { GameState } from '../core/types';

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

function drawSlots(rng: Rng, content: Content): string[] {
  const taken = new Set<string>();
  for (let i = 0; i < content.balance.traits.slots; i++) taken.add(drawOne(rng, content, taken).id);
  return [...taken];
}

/** First roll at birth. */
export function rollDestiny(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const offered = drawSlots(rng, content);
  return { ...state, rng: rng.getState(), destiny: { ...state.destiny, offered } };
}

/** "Nghịch thiên cải mệnh": spend one reroll (developer mode rerolls for free). */
export function rerollDestiny(state: GameState, content: Content, unlimited = false): GameState {
  if (state.destiny.confirmed || (!unlimited && state.destiny.rerollsLeft <= 0)) return state;
  const rolled = rollDestiny(state, content);
  const rerollsLeft = unlimited ? state.destiny.rerollsLeft : state.destiny.rerollsLeft - 1;
  return { ...rolled, destiny: { ...rolled.destiny, rerollsLeft } };
}

/** Accept the offered traits and apply their immediate hooks (stats, lifespan). */
export function confirmDestiny(state: GameState, content: Content): GameState {
  if (state.destiny.confirmed) return state;
  const chosen = state.destiny.offered
    .map((id) => content.traits.find((t) => t.id === id))
    .filter((t): t is Trait => !!t);

  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespanPct = 0;

  for (const trait of chosen) {
    for (const e of trait.effects) {
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

  const lifespan = Math.max(1, Math.round(state.cult.lifespan * (1 + lifespanPct)));
  const notable = chosen.filter((t) => t.rarity === 'thien' || t.rarity === 'than');
  const birth = state.log[0];
  const lines = [
    ...birth.lines,
    { text: `Tiên thiên khí vận: ${chosen.map((t) => t.name).join(', ')}.`, tone: notable.length ? ('rare' as const) : ('normal' as const) },
    ...notable.map((t) => ({ text: t.flavor, tone: 'rare' as const })),
  ];

  return {
    ...state,
    stats,
    aptitudes,
    cult: { ...state.cult, lifespan },
    traits: chosen.map((t) => t.id),
    destiny: { ...state.destiny, confirmed: true },
    log: [{ ...birth, lines }, ...state.log.slice(1)],
  };
}
