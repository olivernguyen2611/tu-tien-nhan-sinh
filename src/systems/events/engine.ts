// EventEngine (PLAN.md task 1.5): each year pick at most one event, the player
// chooses, the outcome is applied. Pure functions over GameState + Content.
import { addGrade, addTradeLevel, enrollSchool, leaveSchool, startTrade } from '../schooling';
import { beginExam } from '../exams';
import { addPerf, promoteJob, quitJob, takeJob } from '../jobs';
import { addArt, adoptPet, castOmen, noteGamble, omenMul } from '../leisure';
import { festivalBoost } from '../calendar';
import { addNetRenown, addRenown } from '../jianghu';
import { addMerit, factionMission, factionTeach, hideFromHunt, joinFaction, leaveFaction } from '../jhFactions';
import { addWound, buyWeapon, gainWeapon, learnArt, practiseArt } from '../martialArts';
import { addPrestige, wulinResign, wulinTournament } from '../wulin';
import { addArmyMerit, armyBattle, armyJoin, armyLeave } from '../army';
import { addOfficeEvidence, addOfficeMerit, officeDefend, officeJoin, officeResign, setOfficeFaction, setOfficeStyle } from '../office';
import { catchDisease, cureAilment, injure, noteDrink } from '../health';
import { addJailYears, addWanted, arrest, bribe, commitCrime, fleeLaw, imprison, sentence, tryEscape } from '../law';
import { checkDeath } from '../time';
import { childrenAffinity, chooseHeir, repairShrine, setRule, shareEstate, worship } from '../kin';
import { borrow, buyAsset, loseAsset, repayDebts, sellAsset, setStrategy, sowCrop } from '../assets';
import { ordinaryAptitude, ordinaryStat } from '../aptitudeGain';
import type { Content } from '../../core/content';
import { Rng } from '../../core/rng';
import type { GameEvent } from '../../core/schemas';
import { fillTemplate } from '../../core/state';
import { extremeThemeMultiplier } from '../extremes';
import type { GameState, LogLine, Tone } from '../../core/types';
import { meets, readValue } from './conditions';
import { addProgress, addSpeedBuff, enterFirstRealm, awakenBody, grantRoot, hookActive, hookSum, lifeHooks, reducePeakFails, revealRoot, startCultivating } from '../cultivation';
import { fittingTechnique, gainScroll, learnTechnique } from '../technique';
import { addItems, removeItems } from '../items';
import { addCraftXp } from '../crafts';
import { forceJoinCareer, leaveCareer, promoteCareer } from '../career';
import { addMartialYears, martialAscend, martialAttempt, martialPromote } from '../martial';
import { addPathAffinity } from '../paths';
import { regionThemeMultiplier } from '../regions';
import { worldThemeMultiplier } from '../worldEvents';
import { timesThemeMultiplier } from '../worldState';
import { chosenDisciple, isChosenEvent, setChosenRole, takeChosen } from '../chosen';
import { addContribution, breakPrecept, grantMaster, joinSect, leaveSect, promoteSect } from '../sect';
import { startBattle } from '../combat';
import { changeNpc, createNpc, killNpc, npcCalls, type NpcTrigger } from '../npcs';
import { markReunion } from '../karmaLedger';
import { markVisit, pickVisit, remember } from '../acquaintances';
import { hiddenByOptions } from '../options';
import { applyRomance, romanceTarget } from '../romance';
import { gainGoldenFinger, loseGoldenFinger, SURE_CHECK_FLAG } from '../goldenFinger';
import { applyPastSect } from '../pastSect';
import { succeedSect } from '../ownSect';
import { outcomeText } from '../textPool';

type Outcome = NonNullable<GameEvent['choices'][number]['result']>;

export function findEvent(content: Content, id: string): GameEvent | undefined {
  return content.events.find((e) => e.id === id);
}

/** Product of the life's multipliers for this event's themes (K.6 eventWeight.<theme>). */
export function themeMultiplier(state: GameState, content: Content, event: GameEvent): number {
  let mul = 1;
  // Traits, special body and career (K.6 eventWeight.<theme>).
  for (const e of lifeHooks(state, content)) {
    if (!e.hook.startsWith('eventWeight.') || e.mul === undefined || !hookActive(e, state, content)) continue;
    if (event.themes.includes(e.hook.slice('eventWeight.'.length))) mul *= e.mul;
  }
  return mul * extremeThemeMultiplier(state, content, event.themes) * regionThemeMultiplier(state, content, event.themes) * worldThemeMultiplier(state, content, event.themes) * timesThemeMultiplier(state, content, event.themes);
}

/** Weight of an event for this life right now; 0 = cannot happen. */
export function eventWeight(state: GameState, content: Content, event: GameEvent): number {
  if (event.npcTrigger) return 0;
  if (event.weight <= 0) return 0; // follow-up only
  if (hiddenByOptions(state, event)) return 0;
  const last = state.events.history[event.id];
  if (last !== undefined) {
    if (event.oncePerLife) return 0;
    // Playtest 2026-10-12: every repeatable event waits at least minCooldownYears.
    const cooldown = Math.max(event.cooldownYears, content.balance.events.minCooldownYears);
    if (state.character.age - last < cooldown) return 0;
  }
  // Task 3.6: a romance event is judged with its lover/partner as the event's NPC.
  const target = event.conditions.romance?.target;
  const judged = target ? { ...state, events: { ...state.events, npc: romanceTarget(state, target)?.id ?? null } } : state;
  if (!meets(judged, event.conditions, content)) return 0;
  // 10.9: in ngục only ngục events come.
  if (state.law?.jail && !event.conditions.law?.jailed) return 0;
  let w = event.weight * themeMultiplier(state, content, event);
  // G.4, playtest 2026-10-12: kỳ ngộ come more often to the lucky.
  const ev = content.balance.events;
  if (event.luckAffected || ev.luckCategories.includes(event.category)) w *= Math.max(ev.luckMin, 1 + (state.aptitudes.luck - 50) * ev.luckPerPoint);
  if (event.category === 'sect' && state.sect.id) w *= ev.sectMemberMul;
  // Playtest 2026-10-12: each time it already happened this life, it grows rarer.
  const seen = state.events.seen?.[event.id] ?? (last !== undefined ? 1 : 0);
  if (seen > 0) w *= content.balance.events.repeatDecay ** seen;
  // 10.7: what a quẻ named comes more readily.
  w *= omenMul(state, content, event.id);
  // 10.13: festival events in a real festival week.
  w *= festivalBoost(state, content, event);
  return Math.max(0, w);
}

/**
 * Playtest 2026-10-12: a secluded year may be broken by a kỳ ngộ or trouble (events with the
 * theme "be_quan"); the seclusion then ends (seclusion.ts).
 */
export function rollSeclusionEvent(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  if (!rng.chance(content.balance.seclusion.interruptChance)) return { ...state, rng: rng.getState() };
  const pool = content.events.filter((e) => e.themes.includes('be_quan')).map((e) => ({ e, w: eventWeight(state, content, e) })).filter((x) => x.w > 0);
  if (pool.length === 0) return { ...state, rng: rng.getState() };
  const picked = rng.weighted(pool, (x) => x.w).e.id;
  return { ...state, rng: rng.getState(), events: { ...state.events, pending: picked, npc: null } };
}

/** Chance this year brings an event (playtest 2026-10-12: most years do). */
export function popupChance(state: GameState, content: Content): number {
  const ev = content.balance.events;
  const realms = content.cultivation.realms.realms;
  const high = realms.findIndex((r) => r.id === state.cult.realm) >= realms.findIndex((r) => r.id === ev.highRealmFrom);
  return high ? ev.popupChanceHighRealm : ev.popupChanceLowRealm;
}

/** Roll this year's event (after age +1). Follow-ups that are due come first. */
export function rollYearEvent(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  // Tử Khí Đông Lai (trigger.everyNYears): every N years of age an event of that theme is sure to come;
  // 10.10: it comes before a due follow-up (a tang lễ…), which then waits a year.
  const sureHook = lifeHooks(state, content)
    .find((h) => h.hook === 'trigger.everyNYears' && h.years && h.tag && age > 0 && age % h.years === 0 && hookActive(h, state, content));
  const due = sureHook ? undefined : state.events.followUps.find((f) => f.atAge <= age && findEvent(content, f.event));
  let picked: string | null = null;
  let followUps = state.events.followUps;

  let npc: string | null = null;
  // Task 4.10: an urgent event (đại hạn) skips the roll as soon as it is eligible.
  const urgent = due ? undefined : content.events.find((e) => e.urgent && eventWeight(state, content, e) > 0);
  const sure = due || urgent ? undefined : sureHook;
  const visit = due || urgent || sure ? null : npcEvent(state, content, rng);
  if (due) {
    picked = due.event;
    followUps = followUps.filter((f) => f !== due);
  } else if (urgent) {
    picked = urgent.id;
  } else if (visit) {
    picked = visit.event;
    npc = visit.npc;
    // 9.R9: a cố nhân's reunion comes once.
    if (visit.trigger === 'reunion') state = markReunion(state, visit.npc);
    if (visit.trigger === 'visit') state = markVisit(state, visit.npc, visit.event);
  } else if (sure || rng.chance(popupChance(state, content))) {
    // "be_quan" events only break into a seclusion (rollSeclusionEvent).
    const all = content.events
      .filter((e) => !e.themes.includes('be_quan'))
      .map((e) => ({ e, w: eventWeight(state, content, e) }))
      .filter((x) => x.w > 0);
    const themed = sure ? all.filter((x) => x.e.themes.includes(sure.tag!)) : [];
    const pool = themed.length > 0 ? themed : all;
    if (pool.length > 0) {
      const e = rng.weighted(pool, (x) => x.w).e;
      picked = e.id;
      // Task 3.6: a romance event is about the lover or partner.
      const target = e.conditions.romance?.target;
      if (target) npc = romanceTarget(state, target)?.id ?? null;
    }
  }

  // Task 5.5: an event of the khí vận chi tử's story is about them.
  const pickedEvent = picked ? findEvent(content, picked) : undefined;
  if (pickedEvent && isChosenEvent(pickedEvent)) npc = chosenDisciple(state)?.id ?? npc;

  return {
    ...state,
    rng: rng.getState(),
    events: { ...state.events, followUps, pending: picked, npc },
  };
}

/** 6c.6: some repay event (Báo ân…) already happened within balance.npcs.repayGapYears. */
function repaidRecently(state: GameState, content: Content): boolean {
  const gap = content.balance.npcs.repayGapYears;
  return content.events.some((e) => e.npcTrigger === 'repay' && state.events.history[e.id] !== undefined && state.character.age - state.events.history[e.id] < gap);
}

/** 9.0.3: some shared (bond) event already happened within balance.npcs.bondGapYears. */
function bondedRecently(state: GameState, content: Content): boolean {
  const gap = content.balance.npcs.bondGapYears;
  return content.events.some((e) => e.npcTrigger === 'bond' && state.events.history[e.id] !== undefined && state.character.age - state.events.history[e.id] < gap);
}

/** Task 3.4: an NPC whose ledger calls for a visit, and an event for it whose conditions hold. */
function npcEvent(state: GameState, content: Content, rng: Rng): { npc: string; event: string; trigger: NpcTrigger } | null {
  for (const call of npcCalls(state, content, rng)) {
    // 6c.6: kindness repaid is a moment, not a yearly chore.
    if (call.trigger === 'repay' && repaidRecently(state, content)) continue;
    if (call.trigger === 'bond' && bondedRecently(state, content)) continue;
    const withNpc = { ...state, events: { ...state.events, npc: call.id } };
    const pool = content.events.filter((e) => e.npcTrigger === call.trigger && e.weight > 0 && !hiddenByOptions(state, e) && meets(withNpc, e.conditions, content));
    if (pool.length === 0) continue;
    return { npc: call.id, event: rng.weighted(pool, (e) => e.weight).id, trigger: call.trigger };
  }
  // 9.6: no ledger calls; someone may still come on their own.
  const v = pickVisit(state, content, (e) => !hiddenByOptions(state, e));
  return v ? { ...v, trigger: 'visit' } : null;
}

export interface ChoiceView {
  index: number;
  text: string;
  /** Hidden choice unlocked by a trait: shown highlighted. */
  hidden: boolean;
  /** Trait that unlocked it (for the label/colour). */
  traitId: string | null;
  /** Visible but its requirement is not met (e.g. not enough silver). */
  disabled: boolean;
  check: { stat: string; difficulty: number; chance: number } | null;
}

export function checkChance(state: GameState, content: Content, stat: string, difficulty: number, resist?: 'charmResist' | 'heartDemonResist'): number {
  const c = content.balance.events.check;
  const ease = resist ? hookSum(state, content, resist) * c.resistPoints : 0;
  const p = c.base + (readValue(state, stat) - difficulty + ease) * c.perPoint;
  return Math.max(c.min, Math.min(c.max, p));
}

/** Choices to show for the pending event: hidden ones only when unlocked. */
export function visibleChoices(state: GameState, content: Content, event: GameEvent): ChoiceView[] {
  const out: ChoiceView[] = [];
  event.choices.forEach((c, index) => {
    const ok = meets(state, c.requires, content);
    if (c.hidden && !ok) return;
    out.push({
      index,
      text: fillTemplate(c.text, state, content),
      hidden: c.hidden,
      traitId: c.hidden
        ? c.requires?.traitsAny?.find((t) => state.traits.includes(t)) ?? c.requires?.talentsAny?.find((t) => state.talents.includes(t)) ?? null
        : null,
      disabled: !ok,
      check: c.check ? { ...c.check, chance: checkChance(state, content, c.check.stat, c.check.difficulty, c.check.resist) } : null,
    });
  });
  // Task 3.9: variants of one choice (same text, exclusive requires) show only the one that applies.
  return out.filter((v) => !v.disabled || !out.some((o) => o !== v && !o.disabled && o.text === v.text));
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** `ordinary` (not a rare event): aptitude gains shrink as they climb (6b.9). */
function applyEffects(state: GameState, effects: Outcome['effects'], rng: Rng, content?: Content, ordinary = false): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  const money = { ...state.money };
  const social = { ...state.social };
  const flags = { ...state.flags };
  let followUps = state.events.followUps;

  for (const [key, value] of Object.entries(effects)) {
    if (typeof value !== 'number') continue;
    if (key.startsWith('stat.')) {
      const k = key.slice(5);
      if (k in stats) {
        const cur = stats[k as keyof typeof stats];
        stats[k as keyof typeof stats] = ordinary && content ? ordinaryStat(k, cur, value, content, rng) : clamp(cur + value);
      }
      else if (k in aptitudes) {
        const cur = aptitudes[k as keyof typeof aptitudes];
        aptitudes[k as keyof typeof aptitudes] = ordinary && content ? ordinaryAptitude(k, cur, value, content, rng) : clamp(cur + value);
      }
    } else if (key === 'silver' || key === 'spiritStones') {
      money[key] = Math.max(0, money[key] + value);
    } else if (key === 'karma') {
      social.karma = Math.max(-100, Math.min(100, social.karma + value));
    }
  }
  for (const f of effects.setFlags ?? []) flags[f] = true;
  for (const f of effects.clearFlags ?? []) delete flags[f];
  // 9.S5: points on a thành thần path.
  let merit = state.merit;
  if (effects.merit) {
    const points = { ...merit?.points };
    for (const [k, v] of Object.entries(effects.merit)) points[k] = Math.max(0, (points[k] ?? 0) + v);
    merit = { points, marks: merit?.marks ?? [] };
  }
  if (effects.followUp) {
    const [a, b] = effects.followUp.afterYears;
    followUps = [...followUps, { event: effects.followUp.event, atAge: state.character.age + rng.int(a, b) }];
  }
  // addItems / removeItems / addTraits: inventory and later traits come in GĐ 2–4.

  return { ...state, stats, aptitudes, money, social, flags, merit, events: { ...state.events, followUps } };
}

export interface ChoiceResult {
  state: GameState;
  text: string;
  tone: Tone;
  /** Skill check outcome, when the choice had one. */
  success: boolean | null;
}

/** 9.3: the event's title for the log; with someone in it, their name too, so a yearly visit reads as who came. */
function echoTitle(title: string, state: GameState, content: Content): string {
  const npc = state.events.npc ? state.npcs?.find((n) => n.id === state.events.npc) : undefined;
  const filled = fillTemplate(title, state, content);
  return npc && !filled.includes(npc.name) ? `${filled} (${npc.name})` : filled;
}

/** Player picks a choice of the pending event. */
export function resolveChoice(given: GameState, content: Content, choiceIndex: number): ChoiceResult {
  const eventId = given.events.pending;
  const event = eventId ? findEvent(content, eventId) : undefined;
  const choice = event?.choices[choiceIndex];
  // Task 3.6: a romance event that came as a follow-up is still about the lover/partner.
  const target = event?.conditions.romance?.target;
  const state = target && !given.events.npc
    ? { ...given, events: { ...given.events, npc: romanceTarget(given, target)?.id ?? null } }
    : given;
  if (!event || !choice) return { state: given, text: '', tone: 'normal', success: null };
  if (!meets(state, choice.requires, content)) return { state: given, text: '', tone: 'normal', success: null };

  const rng = Rng.fromState(state.rng);
  let outcome: Outcome;
  let success: boolean | null = null;
  let sure = false;
  if (choice.check) {
    // 9.R3a: a line written in the Thiên mệnh thư makes this check go the player's way.
    sure = !!state.flags[SURE_CHECK_FLAG];
    success = sure || rng.chance(checkChance(state, content, choice.check.stat, choice.check.difficulty, choice.check.resist));
    outcome = (success ? choice.success : choice.fail)!;
  } else {
    outcome = choice.result!;
  }

  const flagged = sure ? { ...state, flags: { ...state.flags, [SURE_CHECK_FLAG]: false } } : state;
  // 9.3: an outcome with variants says it another way each time.
  const worded = outcomeText(flagged, content, `ev.${event.id}.${choiceIndex}.${success === false ? 'f' : 's'}`, outcome, rng);
  let next = applyEffects(worded.state, outcome.effects, rng, content, !event.tags.includes('rare'));
  let text = worded.text;
  const tone: Tone = event.tags.includes('rare') ? 'rare' : success === true ? 'good' : success === false ? 'bad' : 'normal';
  next = {
    ...next,
    rng: rng.getState(),
    events: {
      ...next.events,
      pending: null,
      history: { ...next.events.history, [event.id]: state.character.age },
      seen: { ...next.events.seen, [event.id]: (next.events.seen?.[event.id] ?? 0) + 1 },
    },
  };
  const extra = applyExtras(next, content, outcome.effects, text);
  next = extra.state;
  // Filled after the effects so {npc} names someone just met.
  text = fillTemplate(extra.text, next, content);
  // 9.3: the first time, the choice is echoed on its own line; a returning event says title and outcome in one.
  const again = (state.events.seen?.[event.id] ?? 0) > 0;
  const lines: LogLine[] = again
    ? [{ text: `${echoTitle(event.title, state, content)}: ${text}`, tone }]
    : [
      { text: `${echoTitle(event.title, state, content)}: ${fillTemplate(choice.text, state, content)}.`, tone: 'normal' },
      { text, tone },
    ];
  const log = next.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  next = { ...next, log };
  // 10.9–10.10: an end chosen in the event (xử trảm, quy ẩn, xuất gia…).
  if (outcome.effects.die && next.alive) next = checkDeath(next, content, outcome.effects.die);
  if (outcome.fight) next = startBattle(next, content, outcome.fight, event.title);
  // 9.6: kỷ niệm with the NPC of the event.
  next = remember(next, content, next.events.npc, echoTitle(event.title, state, content));
  next = { ...next, events: { ...next.events, npc: null } };
  return { state: next, text, tone, success };
}

/** `after` minus the lines (by text) that were added to the same year entry since `before`. */
function dropAdded(before: GameState['log'], after: GameState['log'], texts: string[]): GameState['log'] {
  const i = after.length - 1;
  if (i < 0 || before.length !== after.length) return after;
  const kept = before[i]?.lines.length ?? 0;
  const lines = after[i].lines;
  const out = after.slice();
  out[i] = { ...after[i], lines: [...lines.slice(0, kept), ...lines.slice(kept).filter((l) => !texts.includes(l.text))] };
  return out;
}

/** Effects beyond plain numbers (root test, sect, items, techniques…); returns the state and the text with any extra sentences. */
function applyExtras(state: GameState, content: Content, fx: Outcome['effects'], text: string): { state: GameState; text: string } {
  let next = state;
  // Task 3.4: someone new becomes the event's NPC; then the ledger changes for that NPC.
  if (fx.meetNpc) {
    const { role, kind, realm, stage, root, affinity, favor, grudge, peer, opposite } = fx.meetNpc;
    // Someone met to be courted, wed, or in a mature event is always of age (PLAN H).
    const minAge = fx.romance?.pursue || fx.romance?.marry || fx.romance?.concubine || fx.meetNpc.adult ? content.balance.romance.minAge : undefined;
    // Playtest 2: someone to court is of the player's generation, not 10–15 years older.
    const peerAge = peer || !!fx.romance?.pursue || !!fx.romance?.marry;
    const gender = opposite ? (next.character.gender === 'nam' ? 'nu' : 'nam') : undefined;
    const met = createNpc(next, content, { role, kind, realm, stage, root, minAge, peer: peerAge, gender, affinity: affinity === undefined ? undefined : 50 + affinity, favor, grudge });
    next = { ...met.state, events: { ...met.state.events, npc: met.id } };
  }
  const npcId = next.events.npc;
  if (fx.romance) next = applyRomance(next, content, npcId, fx.romance);
  if (fx.npc && npcId) {
    const { affinity, favor, grudge, reveal, kill, role, sworn } = fx.npc;
    next = changeNpc(next, content, npcId, { affinity, favor, grudge, reveal });
    if (sworn) next = { ...next, npcs: next.npcs.map((n) => (n.id === npcId ? { ...n, sworn: next.character.age, kind: 'huynh_de' } : n)) };
    if (role) next = { ...next, npcs: next.npcs.map((n) => (n.id === npcId ? { ...n, role } : n)) };
    if (kill) next = killNpc(next, content, npcId);
  }
  // 6b.12 (lỗi #11): these systems log their own line; the event's text already carries it, so drop the copy.
  if (fx.testRoot) {
    const before = next.log;
    const revealed = revealRoot(next, content);
    const started = startCultivating(revealed.state, content);
    const said = [revealed.line, started.line].filter((l) => l !== null).map((l) => l.text);
    next = { ...started.state, log: dropAdded(before, started.state.log, said) };
    for (const line of said) text = `${text} ${line}`;
  }
  if (fx.joinSect) {
    const before = next.log;
    const joined = joinSect(next, content, fx.joinSect);
    // 9.R4c: the manual a sect hands a rooted newcomer brings them into the first realm.
    if (joined.joined) joined.state = enterFirstRealm(joined.state, content);
    const manual = content.cultivation.realms.texts.sectManual;
    const said = manual && joined.text.endsWith(` ${manual}`) ? [joined.text.slice(0, -manual.length - 1), manual] : [joined.text];
    next = { ...joined.state, log: joined.text ? dropAdded(before, joined.state.log, said) : joined.state.log };
    if (joined.text) text = `${text} ${joined.text}`;
  }
  if (fx.sectContribution) next = addContribution(next, fx.sectContribution);
  if (fx.gainMaster) next = grantMaster(next, content);
  if (fx.cultProgress) next = addProgress(next, fx.cultProgress);
  if (fx.speedBuff) next = addSpeedBuff(next, fx.speedBuff.mul, fx.speedBuff.years);
  if (fx.nextBreakthroughBonus) next = { ...next, cult: { ...next.cult, nextBonus: next.cult.nextBonus + fx.nextBreakthroughBonus } };
  if (fx.reducePeakFails) next = reducePeakFails(next, fx.reducePeakFails);
  for (const [craft, n] of Object.entries(fx.craftXp ?? {})) next = addCraftXp(next, content, craft, n);
  if (fx.reputation) {
    const rep = { ...next.social.reputation };
    for (const [k, v] of Object.entries(fx.reputation)) if (k !== 'giang_ho') rep[k as keyof typeof rep] = Math.max(-100, Math.min(100, rep[k as keyof typeof rep] + v));
    next = { ...next, social: { ...next.social, reputation: rep } };
    // 11.1: giang hồ reputation is hiệp danh (+) and ác danh (−).
    if (fx.reputation.giang_ho) next = addNetRenown(next, content, fx.reputation.giang_ho);
  }
  next = removeItems(addItems(next, fx.addItems ?? []), fx.removeItems ?? []);
  // A kill (plain, or of the event's NPC) breaks Phật đạo precepts (task 3.12).
  if (fx.kill || fx.npc?.kill) {
    const broke = breakPrecept(next, content);
    next = broke.state;
    if (broke.text) text = `${text} ${broke.text}`;
  }
  if (fx.pathAffinity) next = addPathAffinity(next, fx.pathAffinity);
  // Task 5.3: the founded sect.
  // Task 5.5: a khí vận chi tử comes to the player.
  if (fx.chosenOne) next = takeChosen(next, content, fx.chosenOne);
  // Task 5.6: the master's role.
  if (fx.chosenRole) next = setChosenRole(next, content, fx.chosenRole);
  // Task 5b.2: Kim Thủ Chỉ gained or lost.
  if (fx.loseGoldenFinger) next = loseGoldenFinger(next, content);
  if (fx.goldenFinger) next = gainGoldenFinger(next, content, fx.goldenFinger);
  // Task 5b.7: the past life's sect (claimed: it becomes this life's ownSect before fx.ownSect applies).
  if (fx.succeedSect) next = succeedSect(next, content);
  if (fx.pastSect) {
    const r = applyPastSect(next, content, fx.pastSect);
    next = r.state;
    if (r.line) text = `${text} ${r.line.text}`;
  }
  if (fx.ownSect && next.ownSect) {
    const o = next.ownSect;
    next = { ...next, ownSect: { ...o, members: Math.max(0, o.members + (fx.ownSect.members ?? 0)), treasury: Math.max(0, o.treasury + (fx.ownSect.treasury ?? 0)), growthBonus: (o.growthBonus ?? 0) + (fx.ownSect.growthBonus ?? 0), prestige: Math.max(0, Math.min(100, (o.prestige ?? content.balance.founding.prestige.start) + (fx.ownSect.prestige ?? 0))) } };
  }
  // Task 4.1: the door closes now; the UI runs the years (runSeclusion).
  if (fx.seclusionYears && next.cult.realm !== 'pham_nhan') {
    const age = next.character.age;
    next = { ...next, seclusion: { until: age + fx.seclusionYears, since: age, fixed: true } };
  }
  // Events add at most balance.lifespan.eventCapPct above the realm's base lifespan (never cut what is already there).
  const lifespanCap = (cur: number) => {
    const base = content.balance.realms[next.cult.realm]?.lifespan ?? content.balance.lifespan.mortalBase;
    return Math.max(cur, Math.round(base * (1 + content.balance.lifespan.eventCapPct)));
  };
  // Task 3.9.
  if (fx.lifespanYears) {
    const cur = next.cult.lifespan;
    const lifespan = fx.lifespanYears > 0 ? Math.min(lifespanCap(cur), cur + fx.lifespanYears) : cur + fx.lifespanYears;
    next = { ...next, cult: { ...next.cult, lifespan: Math.max(next.character.age + 1, lifespan) } };
  }
  // Task 4.10: a share of the lifespan, so a pill or a new body is worth as much to a Nguyên Anh as to a Luyện Khí.
  if (fx.lifespanPct) {
    const cur = next.cult.lifespan;
    const cap = lifespanCap(cur);
    const lifespan = fx.lifespanPct > 0 ? Math.min(cap, cur + Math.round(cur * fx.lifespanPct)) : cur + Math.round(cur * fx.lifespanPct);
    next = { ...next, cult: { ...next.cult, lifespan: Math.max(next.character.age + 1, lifespan) } };
  }
  if (fx.heartDemon) {
    // Task 3.10: heartDemonResist shrinks new tâm ma (a negative resist, Ma Tâm Chủng, makes it grow).
    const gain = fx.heartDemon > 0 ? Math.max(0, Math.round(fx.heartDemon * (1 - hookSum(next, content, 'heartDemonResist')))) : fx.heartDemon;
    next = { ...next, cult: { ...next.cult, heartDemon: Math.max(0, next.cult.heartDemon + gain) } };
  }
  if (fx.relativeDies) {
    const roles: string[] = fx.relativeDies === 'parent' ? ['father', 'mother'] : [fx.relativeDies];
    const parent = next.family.filter((r) => r.alive && roles.includes(r.role)).sort((a, b) => b.age - a.age)[0];
    if (parent) next = { ...next, family: next.family.map((r) => (r.id === parent.id ? { ...r, lifespan: r.age + 1 } : r)) };
  }
  if (fx.martialYears) next = addMartialYears(next, fx.martialYears);
  // 10.1 Học đường, học nghề.
  if (fx.enrollSchool) next = enrollSchool(next, content, fx.enrollSchool);
  if (fx.leaveSchool) next = leaveSchool(next);
  if (fx.grade) next = addGrade(next, fx.grade);
  if (fx.startTrade) next = startTrade(next, content, fx.startTrade);
  if (fx.tradeLevel) next = addTradeLevel(next, content, fx.tradeLevel);
  // 10.2: lều chõng đi thi (the trường thi card opens).
  if (fx.sitExam) next = beginExam(next, content);
  // 10.3 Việc làm.
  if (fx.quitJob) next = quitJob(next, content, fx.quitJob);
  if (fx.takeJob) next = takeJob(next, content, fx.takeJob)?.state ?? next;
  if (fx.perf) next = addPerf(next, fx.perf);
  if (fx.jobPromote) next = promoteJob(next, content);
  // 10.4 Tài sản.
  if (fx.sellAsset) next = sellAsset(next, content, fx.sellAsset)?.state ?? next;
  if (fx.buyAsset) next = buyAsset(next, content, fx.buyAsset)?.state ?? next;
  if (fx.loseAsset) next = loseAsset(next, content, fx.loseAsset);
  if (fx.shopStrategy) next = setStrategy(next, content, fx.shopStrategy);
  if (fx.sowCrop) next = sowCrop(next, content, fx.sowCrop);
  if (fx.borrow) next = borrow(next, content, fx.borrow)?.state ?? next;
  if (fx.repayDebts) next = repayDebts(next, content)?.state ?? next;
  // 10.7 Giải trí.
  if (fx.art) next = addArt(next, content, fx.art);
  if (fx.adoptPet) next = adoptPet(next, content, fx.adoptPet);
  if (fx.gambled) next = noteGamble(next);
  if (fx.omen) next = castOmen(next, content);
  // 10.8 Sức khỏe.
  if (fx.catchDisease) next = catchDisease(next, content, fx.catchDisease);
  if (fx.cure) next = cureAilment(next, content, fx.cure);
  if (fx.injure) next = injure(next, content, fx.injure);
  if (fx.drank) next = noteDrink(next);
  // 10.9 Phạm pháp.
  if (fx.crime) next = commitCrime(next, content, fx.crime);
  if (fx.trial && next.law?.trial) next = { ...next, law: { ...next.law, trial: { ...next.law.trial, score: next.law.trial.score + fx.trial } } };
  if (fx.bribe) next = bribe(next, content);
  if (fx.wanted) next = addWanted(next, content, fx.wanted);
  if (fx.imprison) next = imprison(next, content, next.law?.lastCrime ?? 'tu_toi', fx.imprison);
  if (fx.jailYears) next = addJailYears(next, fx.jailYears);
  if (fx.escape) next = tryEscape(next, content);
  if (fx.fleeLaw) next = fleeLaw(next, content);
  if (fx.arrest) next = arrest(next, content);
  if (fx.sentence) next = sentence(next, content);
  // 10.11 Gia tộc.
  if (fx.shareEstate) next = shareEstate(next, content, fx.shareEstate);
  if (fx.chooseHeir) next = chooseHeir(next, content, fx.chooseHeir);
  if (fx.kinRule) next = setRule(next, content, fx.kinRule);
  if (fx.fame || fx.infamy) next = addRenown(next, content, fx.fame ?? 0, fx.infamy ?? 0);
  if (fx.joinFaction) next = joinFaction(next, content, fx.joinFaction);
  if (fx.factionMission) next = factionMission(next, content, fx.factionMission === 'success');
  if (fx.factionMerit) next = addMerit(next, content, fx.factionMerit);
  if (fx.factionTeach) next = factionTeach(next, content);
  if (fx.leaveFaction) next = leaveFaction(next, content, fx.leaveFaction);
  if (fx.hideFromHunt) next = hideFromHunt(next, content);
  // 11.3 Võ học phàm tục.
  if (fx.learnArt) next = learnArt(next, content, fx.learnArt);
  if (fx.practiseArt) next = practiseArt(next, content);
  if (fx.buyWeapon) next = buyWeapon(next, content, fx.buyWeapon);
  if (fx.gainWeapon) next = gainWeapon(next, content, fx.gainWeapon);
  if (fx.wound) next = addWound(next, content, fx.wound);
  // 11.5 Võ lâm đại hội.
  if (fx.wulinTournament) next = wulinTournament(next, content);
  if (fx.wulinPrestige) next = addPrestige(next, content, fx.wulinPrestige);
  if (fx.wulinResign) next = wulinResign(next, content);
  // 12.3 Binh nghiệp.
  if (fx.armyJoin) next = armyJoin(next, content, fx.armyJoin);
  if (fx.armyMerit) next = addArmyMerit(next, fx.armyMerit);
  if (fx.armyBattle) next = armyBattle(next, content);
  if (fx.armyLeave) next = armyLeave(next, content, fx.armyLeave);
  // 12.2 Quan trường.
  if (fx.officeJoin) next = officeJoin(next, content, fx.officeJoin);
  if (fx.officeStyle) next = setOfficeStyle(next, content, fx.officeStyle);
  if (fx.officeFaction) next = setOfficeFaction(next, content, fx.officeFaction);
  if (fx.officeMerit) next = addOfficeMerit(next, content, fx.officeMerit);
  if (fx.officeEvidence) next = addOfficeEvidence(next, content, fx.officeEvidence);
  if (fx.officeDefend) next = officeDefend(next, content, fx.officeDefend);
  if (fx.officeResign) next = officeResign(next, content);
  if (fx.worship) next = worship(next);
  if (fx.repairShrine) next = repairShrine(next, content);
  if (fx.childrenAffinity) next = childrenAffinity(next, fx.childrenAffinity);
  // 10.10: moving far: old acquaintances (not family) cool, the life is tha hương.
  if (fx.moveHome) {
    const d = content.balance.leaving?.moveAffinity ?? 0;
    const home = new Set([next.romance.partner, next.romance.lover, ...(next.romance.concubines ?? [])]);
    next = { ...next, flags: { ...next.flags, tha_huong: true }, npcs: next.npcs.map((n) => (n.alive && !home.has(n.id) ? { ...n, affinity: Math.max(0, Math.min(100, n.affinity + d)) } : n)) };
  }
  if (fx.martialBonus) next = { ...next, martial: { ...next.martial, bonus: next.martial.bonus + fx.martialBonus } };
  if (fx.martialPromote) next = martialPromote(next, content);
  if (fx.martialAscend) next = martialAscend(next, content);
  if (fx.martialAttempt) {
    const tried = martialAttempt(next, content);
    next = tried.state;
    if (tried.text) text = `${text} ${tried.text}`;
  }
  if (fx.leaveCareer) next = leaveCareer(next);
  if (fx.joinCareer) next = forceJoinCareer(next, content, fx.joinCareer);
  if (fx.careerPromote) next = promoteCareer(next, content);
  if (fx.gainTechnique) {
    const got = gainScroll(next, content, fx.gainTechnique);
    if (got) { next = got.state; text = `${text} ${got.text}`; }
  }
  if (fx.gainFittingTechnique) {
    const rng = Rng.fromState(next.rng);
    const tech = fittingTechnique(next, content, rng);
    next = { ...next, rng: rng.getState() };
    const got = tech ? gainScroll(next, content, tech.id) : null;
    if (got) { next = got.state; text = `${text} ${got.text}`; }
  }
  if (fx.sectPromote) next = promoteSect(next, content);
  if (fx.leaveSect) next = leaveSect(next, content)?.state ?? next;
  if (fx.learnTechnique) {
    const learned = learnTechnique(next, content, fx.learnTechnique);
    if (learned) {
      // A rootless technique (Phật duyên) brings a mortal into the first realm.
      next = enterFirstRealm(learned.state, content);
      text = `${text} ${learned.text}`;
    }
  }
  if (fx.grantRoot) {
    const granted = grantRoot(next, content);
    next = granted.state;
    // A death is the whole story: no success line before it (playtest 2026-10-12).
    if (granted.text) text = next.alive ? `${text} ${granted.text}` : granted.text;
  }
  if (fx.awakenBody) {
    const awakened = awakenBody(next, content, fx.awakenBody);
    next = awakened.state;
    if (awakened.text) text = `${text} ${awakened.text}`;
  }
  // Task 4.6: the next step opens at once (not after a fight; that goes in win/lose).
  if (fx.chain && next.alive && findEvent(content, fx.chain)) next = { ...next, events: { ...next.events, pending: fx.chain } };
  return { state: next, text };
}

/** Apply an outcome that does not come from a pending event (e.g. the end of a fight). */
export function applyOutcome(state: GameState, content: Content, outcome: { text: string; effects: Outcome['effects'] }, rng: Rng): { state: GameState; text: string } {
  const r = applyExtras(applyEffects(state, outcome.effects, rng, content, true), content, outcome.effects, outcome.text);
  return { state: r.state, text: fillTemplate(r.text, r.state, content) };
}
