// Fights (task 3.3, PLAN.md K.4): one power number per side, up to 3 rounds,
// the player picks one of 5 actions each round. Texts depend on the player's
// combat path and on element counters (K.3.3).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { CombatAction, Fight, FoeSpec } from '../core/schemas';
import type { Battle, Foe, GameState, LogLine, Tone } from '../core/types';
import { hookSum } from './cultivation';
import { applyOutcome } from './events/engine';
import { itemById, removeItems } from './items';
import { currentTechnique } from './technique';

export interface CombatResult { state: GameState; text: string; tone: Tone }

const realmIndex = (content: Content, id: string) =>
  Math.max(0, content.cultivation.realms.realms.findIndex((r) => r.id === id));
const realmAt = (content: Content, i: number) => {
  const list = content.cultivation.realms.realms;
  return list[Math.max(0, Math.min(list.length - 1, i))].id;
};
const fill = (text: string, foe: Foe, state: GameState) =>
  text.replace(/\{foe\}/g, foe.name).replace(/\{name\}/g, state.character.name);

/** The player's main combat path: the one its hooks favour most (task 3.8 replaces this with trained affinity). */
export function mainPath(state: GameState, content: Content): string | null {
  let best: string | null = null;
  let top = 0;
  for (const p of content.cultivation.aptitudes.paths) {
    const v = hookSum(state, content, `path.${p.id}.affinity`) + hookSum(state, content, `path.${p.id}.power`);
    if (v > top) { top = v; best = p.id; }
  }
  return best;
}

/** The player's element for counters: the first element of the root. */
export function playerElement(state: GameState): string | null {
  return state.cult.root?.elements[0] ?? null;
}

/** Does element a beat element b? */
export function beats(content: Content, a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return content.cultivation.roots.elements.find((e) => e.id === a)?.beats.includes(b) ?? false;
}

/** Strongest combatPower bonus among carried artifacts (paths scale it). */
function artifactBonus(state: GameState, content: Content): number {
  let best = 0;
  for (const [id, n] of Object.entries(state.inventory)) {
    const item = itemById(content, id);
    if (n <= 0 || item?.kind !== 'artifact') continue;
    for (const e of item.carried) if (e.hook === 'combatPower' && (e.add ?? 0) > best) best = e.add ?? 0;
  }
  return best;
}

/** PLAN.md K.4.1: the player's combat power. */
export function combatPower(state: GameState, content: Content): number {
  const b = content.balance;
  const c = b.combat;
  const realm = b.realms[state.cult.realm];
  const base = realm?.combatPower ?? 1;
  const tech = currentTechnique(state, content);
  const techMul = tech ? b.techniques.gradeMul[tech.grade] ?? 1 : 1;
  const lineage = state.cult.lineage ?? tech?.lineage ?? 'tien';
  const path = mainPath(state, content);
  const pathCfg = path ? (b.paths as Record<string, Record<string, number>>)[path] : undefined;
  const artifact = artifactBonus(state, content);
  const artifactMul = (pathCfg?.artifactBonusMul ?? 1) + hookSum(state, content, 'artifactPct');
  const unarmed = artifact === 0 ? pathCfg?.unarmedCombatPower ?? 0 : 0;
  const bonus = hookSum(state, content, 'combatPower') - artifact + artifact * artifactMul
    + (pathCfg?.combatPower ?? 0) + (path ? hookSum(state, content, `path.${path}.power`) : 0) + unarmed;
  const power = base
    * (1 + c.stagePct * state.cult.stage)
    * (c.physiqueBase + state.aptitudes.physique / c.physiqueDivisor)
    * techMul * (c.lineagePower[lineage] ?? 1)
    * Math.max(0.1, 1 + bonus);
  return Math.round(power * 10) / 10;
}

/** Speed (K.4.1): decides who gets away. */
export function combatSpeed(state: GameState, content: Content): number {
  const c = content.balance.combat;
  const path = mainPath(state, content);
  const mul = 1 + (path ? c.pathSpeed[path] ?? 0 : 0) + hookSum(state, content, 'speed');
  return c.speedBase * (1 + realmIndex(content, state.cult.realm)) * Math.max(0.1, mul);
}

/** Build a foe from an event's spec, relative to the player. */
export function makeFoe(state: GameState, content: Content, spec: FoeSpec, rng: Rng): Foe {
  const c = content.balance.combat;
  const here = realmIndex(content, state.cult.realm);
  const realm = spec.realm === 'same' ? state.cult.realm
    : spec.realm === 'above' ? realmAt(content, here + 1)
    : spec.realm === 'below' ? realmAt(content, here - 1)
    : spec.realm;
  const stage = spec.stage ?? (spec.realm === 'same' ? state.cult.stage : 0);
  const variance = c.foeVariance[0] + rng.next() * (c.foeVariance[1] - c.foeVariance[0]);
  const base = content.balance.realms[realm]?.combatPower ?? 1;
  const power = base * (1 + c.stagePct * stage) * (c.lineagePower[spec.lineage] ?? 1) * spec.powerMul * variance;
  const basic = content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id);
  const element = spec.element === 'random' ? rng.pick(basic) : spec.element;
  return {
    name: spec.name,
    realm,
    stage,
    power: Math.round(power * 10) / 10,
    speed: c.speedBase * (1 + realmIndex(content, realm)) * variance,
    element,
    path: spec.path ?? null,
    lineage: spec.lineage,
    intent: spec.intent,
    mercy: spec.mercy ?? c.pleaIntent[spec.intent],
  };
}

/** Start a fight; the year waits until it ends. Pre-fight pills (combatPowerNext) are spent here. */
export function startBattle(state: GameState, content: Content, fight: Fight, source: string | null): GameState {
  const rng = Rng.fromState(state.rng);
  const foe = makeFoe(state, content, fight.foe, rng);
  const t = content.combat;
  const opening = fill(t.start.replace('{intent}', t.intent[foe.intent]), foe, state);
  const battle: Battle = {
    foe, won: 0, lost: 0,
    lines: [{ text: opening, tone: 'normal' }],
    phase: 'fight',
    nextBonus: state.itemUse.nextCombat,
    outcomes: { win: fight.win, lose: fight.lose, fled: fight.fled },
    source,
  };
  return { ...state, rng: rng.getState(), combat: battle, itemUse: { ...state.itemUse, nextCombat: 0 } };
}

/** Items that can be burnt in a fight (combat-only items with a use). */
export function battleItems(state: GameState, content: Content): string[] {
  return Object.entries(state.inventory)
    .filter(([id, n]) => n > 0 && itemById(content, id)?.use?.combatOnly)
    .map(([id]) => id);
}

/** Chance to win the next round with this action (before the dice). */
export function roundChance(state: GameState, content: Content, action: CombatAction, itemId?: string): number {
  const battle = state.combat;
  if (!battle) return 0;
  const { a, b } = sides(state, content, battle, action, itemId);
  const k = content.balance.combat.k;
  return a ** k / (a ** k + b ** k);
}

function sides(state: GameState, content: Content, battle: Battle, action: CombatAction, itemId?: string) {
  const b = content.balance;
  const c = b.combat;
  const path = mainPath(state, content);
  const paths = b.paths as Record<string, Record<string, number>>;
  let a = combatPower(state, content) * (1 + battle.nextBonus / 100);
  let foe = battle.foe.power;
  // Element counters (K.3.3); the Pháp path gains and loses more.
  const mine = playerElement(state);
  const counter = path === 'spell' ? paths.spell.elementCounterBonus : b.roots.elementCounterBonus;
  if (beats(content, mine, battle.foe.element)) a *= 1 + counter + hookSum(state, content, `element.${mine}.power`);
  if (beats(content, battle.foe.element, mine)) {
    if (path === 'spell') a *= 1 + paths.spell.elementCounteredPenalty;
    else foe *= 1 + b.roots.elementCounterBonus;
  }
  if (realmIndex(content, battle.foe.realm) > realmIndex(content, state.cult.realm)) a *= 1 + hookSum(state, content, 'combatPower.vsHigherRealm');
  if (path === 'sword' && battle.won + battle.lost === 0) a *= 1 + paths.sword.firstRoundBonus;
  if (action === 'all_out') a *= c.allOutMul;
  if (action === 'defend') a *= c.defendMul;
  if (action === 'item' && itemId) {
    const add = itemById(content, itemId)?.use?.effects.find((e) => e.hook === 'combatPowerNext')?.add ?? 0;
    a *= 1 + (add / 100) * (path ? paths[path]?.itemActionMul ?? 1 : 1);
  }
  return { a: Math.max(0.1, a), b: Math.max(0.1, foe) };
}

/** Chance to get away (K.4.2: compare speed). */
export function fleeChance(state: GameState, content: Content, extra = 0): number {
  const battle = state.combat;
  if (!battle) return 0;
  const c = content.balance.combat;
  const mine = combatSpeed(state, content);
  const p = mine / (mine + battle.foe.speed) + hookSum(state, content, 'escapeChance') + extra;
  return Math.max(c.fleeMin, Math.min(c.fleeMax, p));
}

/** Chance the foe accepts a plea. */
export function pleaChance(state: GameState, content: Content): number {
  const battle = state.combat;
  if (!battle) return 0;
  const c = content.balance.combat;
  const p = battle.foe.mercy + (state.stats.charm - 50) * c.pleaPerCharm - (battle.foe.lineage === 'ma' ? c.pleaMaPenalty : 0);
  return Math.max(c.pleaMin, Math.min(c.pleaMax, p));
}

const clampStat = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const hurt = (s: GameState, n: number): GameState => ({ ...s, stats: { ...s.stats, health: clampStat(s.stats.health - n) } });

/** Health lost when a round goes badly, after path and hooks. */
function injury(state: GameState, content: Content, rng: Rng, mul: number): number {
  const c = content.balance.combat;
  const path = mainPath(state, content);
  const pathTaken = path ? (content.balance.paths as Record<string, Record<string, number>>)[path]?.injuryTaken ?? 0 : 0;
  const reduce = hookSum(state, content, 'injuryReduce');
  return Math.max(0, Math.round(rng.int(c.roundInjury[0], c.roundInjury[1]) * mul * (1 + pathTaken) * (1 - reduce)));
}

function withBattle(s: GameState, battle: Battle, line: LogLine, rng: Rng): GameState {
  return { ...s, rng: rng.getState(), combat: { ...battle, lines: [...battle.lines, line] } };
}

/** Add lines to this year's log. */
function logLines(state: GameState, lines: LogLine[]): GameState['log'] {
  const out = state.log.slice();
  const last = out[out.length - 1];
  if (last && last.age === state.character.age) out[out.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else out.push({ age: state.character.age, lines });
  return out;
}

/** Play one round with an action. */
export function act(state: GameState, content: Content, action: CombatAction, itemId?: string): CombatResult {
  const battle = state.combat;
  if (!state.alive || !battle || battle.phase !== 'fight') return { state, text: '', tone: 'normal' };
  if (action === 'item' && (!itemId || !battleItems(state, content).includes(itemId))) return { state, text: '', tone: 'normal' };
  const c = content.balance.combat;
  const t = content.combat;
  const rng = Rng.fromState(state.rng);
  const foe = battle.foe;
  let s = state;

  if (action === 'item' && itemId) s = removeItems(s, [itemId]);
  const escape = action === 'item' && itemId ? itemById(content, itemId)?.use?.effects.find((e) => e.hook === 'escapeNext')?.add : undefined;

  if (action === 'flee' || escape !== undefined) {
    if (rng.chance(fleeChance(s, content, (escape ?? 0) / 100))) {
      return end(s, content, battle, 'fled', { text: fill(rng.pick(t.fleeOk), foe, s), tone: 'normal' }, rng);
    }
    s = hurt(s, injury(s, content, rng, 1));
    return lostRound(s, content, battle, { text: fill(rng.pick(t.fleeFail), foe, s), tone: 'bad' }, rng);
  }

  if (action === 'plead') {
    if (rng.chance(pleaChance(s, content))) {
      return end(s, content, battle, 'spared', { text: fill(rng.pick(t.pleaOk[foe.intent]), foe, s), tone: 'normal' }, rng);
    }
    s = hurt(s, injury(s, content, rng, 1));
    return lostRound(s, content, battle, { text: fill(rng.pick(t.pleaFail), foe, s), tone: 'bad' }, rng);
  }

  const p = roundChance(s, content, action, itemId);
  const win = rng.chance(p);
  if (win) {
    const path = mainPath(s, content) ?? 'none';
    const pool = action === 'defend' ? t.defendHit : action === 'item' ? t.itemHit : t.hit[path] ?? t.hit.none;
    let text = fill(rng.pick(pool), foe, s);
    if (beats(content, playerElement(s), foe.element)) text = `${text} ${rng.pick(t.counter)}`;
    // Lifesteal heals a little of what a lost round would cost.
    const steal = hookSum(s, content, 'lifesteal');
    if (steal > 0) s = hurt(s, -Math.round(c.roundInjury[1] * steal));
    const b2 = { ...battle, won: battle.won + 1 };
    if (b2.won >= c.winRounds) {
      const next = withBattle(s, { ...b2, phase: 'won' }, { text, tone: 'good' }, rng);
      return { state: withBattle(next, next.combat!, { text: fill(t.won, foe, s), tone: 'good' }, rng), text, tone: 'good' };
    }
    return { state: withBattle(s, b2, { text, tone: 'good' }, rng), text, tone: 'good' };
  }
  const mul = action === 'all_out' ? c.allOutInjuryMul : action === 'defend' ? c.defendInjuryMul : 1;
  s = hurt(s, injury(s, content, rng, mul));
  const pool = action === 'defend' ? t.defendMiss : t.miss;
  return lostRound(s, content, battle, { text: fill(rng.pick(pool), foe, s), tone: 'bad' }, rng);
}

function lostRound(s: GameState, content: Content, battle: Battle, line: LogLine, rng: Rng): CombatResult {
  const b2 = { ...battle, lost: battle.lost + 1 };
  if (b2.lost >= content.balance.combat.winRounds || s.stats.health <= 0) return end(s, content, b2, 'lost', line, rng);
  return { state: withBattle(s, b2, line, rng), text: line.text, tone: line.tone };
}

/** What happens to the loser, by the foe's intent. */
function loseConsequence(s: GameState, content: Content, foe: Foe, rng: Rng): { state: GameState; lines: LogLine[] } {
  const c = content.balance.combat.lose;
  const t = content.combat.lost;
  if (foe.intent === 'teach') {
    return { state: hurt(s, -c.teachHealth), lines: [{ text: fill(t.teach, foe, s), tone: 'bad' }] };
  }
  if (foe.intent === 'rob') {
    const money = { silver: Math.floor(s.money.silver * (1 - c.robShare)), spiritStones: Math.floor(s.money.spiritStones * (1 - c.robShare)) };
    let next: GameState = { ...s, money };
    // A storage bag keeps the goods (items-draft V20).
    const guarded = Object.keys(s.inventory).some((id) => s.inventory[id] > 0 && itemById(content, id)?.carried.some((e) => e.hook === 'keepItemsOnLoss'));
    if (!guarded) {
      const owned = Object.entries(s.inventory).filter(([id, n]) => n > 0 && !itemById(content, id)?.carried.some((e) => e.hook === 'keepItemsOnLoss')).map(([id]) => id);
      for (let i = 0; i < c.robItems && owned.length > 0; i++) next = removeItems(next, [owned.splice(rng.int(0, owned.length - 1), 1)[0]]);
    }
    return { state: next, lines: [{ text: fill(t.rob, foe, s), tone: 'bad' }] };
  }
  // Intent to kill: a protective jade breaks instead, or luck lets you slip away.
  const jade = Object.keys(s.inventory).find((id) => s.inventory[id] > 0 && itemById(content, id)?.carried.some((e) => e.hook === 'trigger.cheatDeath'));
  const lines: LogLine[] = [{ text: fill(t.kill, foe, s), tone: 'bad' }];
  if (jade) {
    lines.push({ text: `${itemById(content, jade)!.name} vỡ tan, đỡ cho ngươi một mạng.`, tone: 'rare' });
    return { state: hurt(removeItems(s, [jade]), -c.killEscapeHealth), lines };
  }
  if (rng.chance(c.killEscapeBase + s.aptitudes.luck * c.killEscapePerLuck)) {
    lines.push({ text: fill(t.killEscape, foe, s), tone: 'rare' });
    return { state: hurt(s, -c.killEscapeHealth), lines };
  }
  return { state: { ...s, stats: { ...s.stats, health: 0 } }, lines };
}

function end(s: GameState, content: Content, battle: Battle, how: 'lost' | 'fled' | 'spared', line: LogLine, rng: Rng): CombatResult {
  const lines: LogLine[] = [line];
  let next = s;
  if (how === 'lost') {
    const lost = loseConsequence(next, content, battle.foe, rng);
    next = lost.state;
    lines.push(...lost.lines);
    if (next.stats.health > 0) {
      const o = applyOutcome({ ...next, rng: rng.getState() }, content, battle.outcomes.lose, rng);
      next = o.state;
      lines.push({ text: o.text, tone: 'bad' });
    }
  } else if (how === 'fled' && battle.outcomes.fled) {
    const o = applyOutcome({ ...next, rng: rng.getState() }, content, battle.outcomes.fled, rng);
    next = o.state;
    lines.push({ text: o.text, tone: 'normal' });
  }
  return finish(next, battle, lines, rng, how === 'lost' ? 'bad' : 'normal');
}

/** Close the fight: sum it up in the year's log and free the year. */
function finish(s: GameState, battle: Battle, lines: LogLine[], rng: Rng, tone: Tone): CombatResult {
  const head: LogLine = { text: `Giao chiến với ${battle.foe.name}${battle.source ? ` (${battle.source})` : ''}: thắng ${battle.won}, thua ${battle.lost} hiệp.`, tone: 'normal' };
  const state: GameState = { ...s, rng: rng.getState(), combat: null, log: logLines(s, [head, ...lines]) };
  return { state, text: lines.map((l) => l.text).join(' '), tone };
}

export type Aftermath = 'spare' | 'loot' | 'kill';

/** After winning: spare, loot or kill the foe (K.4.2), then the event's win outcome. */
export function settle(state: GameState, content: Content, choice: Aftermath): CombatResult {
  const battle = state.combat;
  if (!battle || battle.phase !== 'won') return { state, text: '', tone: 'normal' };
  const w = content.balance.combat.win;
  const rng = Rng.fromState(state.rng);
  const foe = battle.foe;
  let s = state;
  const karma = (n: number) => ({ ...s.social, karma: Math.max(-100, Math.min(100, s.social.karma + n)) });
  if (choice === 'spare') s = { ...s, social: karma(w.spareKarma) };
  if (choice === 'loot') {
    const mul = foe.power * (1 + hookSum(s, content, 'lootPct'));
    s = foe.realm === 'pham_nhan'
      ? { ...s, money: { ...s.money, silver: s.money.silver + Math.round(mul * w.lootSilverPerPower) } }
      : { ...s, money: { ...s.money, spiritStones: s.money.spiritStones + Math.round(mul * w.lootStonesPerPower) } };
  }
  if (choice === 'kill') {
    s = { ...s, social: karma(w.killKarma) };
    if ((s.cult.lineage ?? currentTechnique(s, content)?.lineage) === 'phat') {
      s = { ...s, aptitudes: { ...s.aptitudes, daoHeart: clampStat(s.aptitudes.daoHeart + w.killDaoHeartPhat) } };
    }
  }
  const lines: LogLine[] = [{ text: fill(content.combat.after[choice], foe, s), tone: choice === 'kill' ? 'bad' : 'good' }];
  const o = applyOutcome({ ...s, rng: rng.getState() }, content, battle.outcomes.win, rng);
  lines.push({ text: o.text, tone: 'good' });
  return finish(o.state, battle, lines, rng, 'good');
}
