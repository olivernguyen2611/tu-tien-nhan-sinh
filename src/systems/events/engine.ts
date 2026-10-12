// EventEngine (PLAN.md task 1.5): each year pick at most one event, the player
// chooses, the outcome is applied. Pure functions over GameState + Content.
import type { Content } from '../../core/content';
import { Rng } from '../../core/rng';
import type { GameEvent } from '../../core/schemas';
import { fillTemplate } from '../../core/state';
import { extremeThemeMultiplier } from '../extremes';
import type { GameState, LogLine, Tone } from '../../core/types';
import { meets, readValue } from './conditions';
import { addProgress, addSpeedBuff, enterFirstRealm, grantRoot, hookActive, hookSum, lifeHooks, reducePeakFails, revealRoot, startCultivating } from '../cultivation';
import { gainScroll, learnTechnique } from '../technique';
import { addItems, removeItems } from '../items';
import { addCraftXp } from '../crafts';
import { forceJoinCareer, leaveCareer, promoteCareer } from '../career';
import { addMartialYears, martialAttempt, martialPromote } from '../martial';
import { addPathAffinity } from '../paths';
import { regionThemeMultiplier } from '../regions';
import { chosenDisciple, isChosenEvent, setChosenRole, takeChosen } from '../chosen';
import { addContribution, breakPrecept, grantMaster, joinSect, leaveSect, promoteSect } from '../sect';
import { startBattle } from '../combat';
import { changeNpc, createNpc, killNpc, npcCalls } from '../npcs';
import { applyRomance, romanceTarget } from '../romance';
import { gainGoldenFinger, loseGoldenFinger } from '../goldenFinger';
import { applyPastSect } from '../pastSect';

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
  return mul * extremeThemeMultiplier(state, content, event.themes) * regionThemeMultiplier(state, content, event.themes);
}

/** Weight of an event for this life right now; 0 = cannot happen. */
export function eventWeight(state: GameState, content: Content, event: GameEvent): number {
  if (event.npcTrigger) return 0;
  if (event.weight <= 0) return 0; // follow-up only
  const last = state.events.history[event.id];
  if (last !== undefined) {
    if (event.oncePerLife) return 0;
    if (event.cooldownYears > 0 && state.character.age - last < event.cooldownYears) return 0;
  }
  // Task 3.6: a romance event is judged with its lover/partner as the event's NPC.
  const target = event.conditions.romance?.target;
  const judged = target ? { ...state, events: { ...state.events, npc: romanceTarget(state, target)?.id ?? null } } : state;
  if (!meets(judged, event.conditions, content)) return 0;
  let w = event.weight * themeMultiplier(state, content, event);
  if (event.luckAffected) w *= 1 + (state.aptitudes.luck - 50) / 100; // G.4
  return Math.max(0, w);
}

/** Roll this year's event (after age +1). Follow-ups that are due come first. */
export function rollYearEvent(state: GameState, content: Content): GameState {
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  const due = state.events.followUps.find((f) => f.atAge <= age && findEvent(content, f.event));
  let picked: string | null = null;
  let followUps = state.events.followUps;

  let npc: string | null = null;
  // Task 4.10: an urgent event (đại hạn) skips the roll as soon as it is eligible.
  const urgent = due ? undefined : content.events.find((e) => e.urgent && eventWeight(state, content, e) > 0);
  // Tử Khí Đông Lai (trigger.everyNYears): every N years of age an event of that theme is sure to come.
  const sure = due || urgent ? undefined : lifeHooks(state, content)
    .find((h) => h.hook === 'trigger.everyNYears' && h.years && h.tag && age > 0 && age % h.years === 0 && hookActive(h, state, content));
  const visit = due || urgent || sure ? null : npcEvent(state, content, rng);
  if (due) {
    picked = due.event;
    followUps = followUps.filter((f) => f !== due);
  } else if (urgent) {
    picked = urgent.id;
  } else if (visit) {
    picked = visit.event;
    npc = visit.npc;
  } else if (sure || rng.chance(content.balance.events.popupChanceLowRealm)) {
    const all = content.events
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

/** Task 3.4: an NPC whose ledger calls for a visit, and an event for it whose conditions hold. */
function npcEvent(state: GameState, content: Content, rng: Rng): { npc: string; event: string } | null {
  for (const call of npcCalls(state, content, rng)) {
    const withNpc = { ...state, events: { ...state.events, npc: call.id } };
    const pool = content.events.filter((e) => e.npcTrigger === call.trigger && e.weight > 0 && meets(withNpc, e.conditions, content));
    if (pool.length === 0) continue;
    return { npc: call.id, event: rng.weighted(pool, (e) => e.weight).id };
  }
  return null;
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

export function checkChance(state: GameState, content: Content, stat: string, difficulty: number): number {
  const c = content.balance.events.check;
  const p = c.base + (readValue(state, stat) - difficulty) * c.perPoint;
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
      check: c.check ? { ...c.check, chance: checkChance(state, content, c.check.stat, c.check.difficulty) } : null,
    });
  });
  // Task 3.9: variants of one choice (same text, exclusive requires) show only the one that applies.
  return out.filter((v) => !v.disabled || !out.some((o) => o !== v && !o.disabled && o.text === v.text));
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function applyEffects(state: GameState, effects: Outcome['effects'], rng: Rng): GameState {
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
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + value);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + value);
    } else if (key === 'silver' || key === 'spiritStones') {
      money[key] = Math.max(0, money[key] + value);
    } else if (key === 'karma') {
      social.karma = Math.max(-100, Math.min(100, social.karma + value));
    }
  }
  for (const f of effects.setFlags ?? []) flags[f] = true;
  for (const f of effects.clearFlags ?? []) delete flags[f];
  if (effects.followUp) {
    const [a, b] = effects.followUp.afterYears;
    followUps = [...followUps, { event: effects.followUp.event, atAge: state.character.age + rng.int(a, b) }];
  }
  // addItems / removeItems / addTraits: inventory and later traits come in GĐ 2–4.

  return { ...state, stats, aptitudes, money, social, flags, events: { ...state.events, followUps } };
}

export interface ChoiceResult {
  state: GameState;
  text: string;
  tone: Tone;
  /** Skill check outcome, when the choice had one. */
  success: boolean | null;
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
  if (choice.check) {
    success = rng.chance(checkChance(state, content, choice.check.stat, choice.check.difficulty));
    outcome = (success ? choice.success : choice.fail)!;
  } else {
    outcome = choice.result!;
  }

  let next = applyEffects(state, outcome.effects, rng);
  let text = outcome.text;
  const tone: Tone = event.tags.includes('rare') ? 'rare' : success === true ? 'good' : success === false ? 'bad' : 'normal';
  next = {
    ...next,
    rng: rng.getState(),
    events: {
      ...next.events,
      pending: null,
      history: { ...next.events.history, [event.id]: state.character.age },
    },
  };
  const extra = applyExtras(next, content, outcome.effects, text);
  next = extra.state;
  // Filled after the effects so {npc} names someone just met.
  text = fillTemplate(extra.text, next, content);
  const lines: LogLine[] = [
    { text: `${event.title}: ${fillTemplate(choice.text, state, content)}.`, tone: 'normal' },
    { text, tone },
  ];
  const log = next.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  next = { ...next, log };
  if (outcome.fight) next = startBattle(next, content, outcome.fight, event.title);
  next = { ...next, events: { ...next.events, npc: null } };
  return { state: next, text, tone, success };
}

/** Effects beyond plain numbers (root test, sect, items, techniques…); returns the state and the text with any extra sentences. */
function applyExtras(state: GameState, content: Content, fx: Outcome['effects'], text: string): { state: GameState; text: string } {
  let next = state;
  // Task 3.4: someone new becomes the event's NPC; then the ledger changes for that NPC.
  if (fx.meetNpc) {
    const { role, realm, stage, root, affinity, favor, grudge } = fx.meetNpc;
    // Someone met to be courted, wed, or in a mature event is always of age (PLAN H).
    const minAge = fx.romance?.pursue || fx.romance?.marry || fx.meetNpc.adult ? content.balance.romance.minAge : undefined;
    const met = createNpc(next, content, { role, realm, stage, root, minAge, affinity: affinity === undefined ? undefined : 50 + affinity, favor, grudge });
    next = { ...met.state, events: { ...met.state.events, npc: met.id } };
  }
  const npcId = next.events.npc;
  if (fx.romance) next = applyRomance(next, content, npcId, fx.romance);
  if (fx.npc && npcId) {
    const { affinity, favor, grudge, reveal, kill, role } = fx.npc;
    next = changeNpc(next, content, npcId, { affinity, favor, grudge, reveal });
    if (role) next = { ...next, npcs: next.npcs.map((n) => (n.id === npcId ? { ...n, role } : n)) };
    if (kill) next = killNpc(next, content, npcId);
  }
  if (fx.testRoot) {
    const revealed = revealRoot(next, content);
    const started = startCultivating(revealed.state, content);
    next = started.state;
    for (const line of [revealed.line, started.line]) if (line) text = `${text} ${line.text}`;
  }
  if (fx.joinSect) {
    const joined = joinSect(next, content, fx.joinSect);
    next = joined.state;
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
    for (const [k, v] of Object.entries(fx.reputation)) rep[k as keyof typeof rep] = Math.max(-100, Math.min(100, rep[k as keyof typeof rep] + v));
    next = { ...next, social: { ...next.social, reputation: rep } };
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
  if (fx.pastSect) {
    const r = applyPastSect(next, content, fx.pastSect);
    next = r.state;
    if (r.line) text = `${text} ${r.line.text}`;
  }
  if (fx.ownSect && next.ownSect) {
    const o = next.ownSect;
    next = { ...next, ownSect: { ...o, members: Math.max(0, o.members + (fx.ownSect.members ?? 0)), treasury: Math.max(0, o.treasury + (fx.ownSect.treasury ?? 0)), growthBonus: (o.growthBonus ?? 0) + (fx.ownSect.growthBonus ?? 0) } };
  }
  // Task 4.1: the door closes now; the UI runs the years (runSeclusion).
  if (fx.seclusionYears && next.cult.realm !== 'pham_nhan') {
    const age = next.character.age;
    next = { ...next, seclusion: { until: age + fx.seclusionYears, since: age, fixed: true } };
  }
  // Task 3.9.
  if (fx.lifespanYears) next = { ...next, cult: { ...next.cult, lifespan: Math.max(next.character.age + 1, next.cult.lifespan + fx.lifespanYears) } };
  // Task 4.10: a share of the lifespan, so a pill or a new body is worth as much to a Nguyên Anh as to a Luyện Khí.
  if (fx.lifespanPct) next = { ...next, cult: { ...next.cult, lifespan: Math.max(next.character.age + 1, next.cult.lifespan + Math.round(next.cult.lifespan * fx.lifespanPct)) } };
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
  if (fx.martialBonus) next = { ...next, martial: { ...next.martial, bonus: next.martial.bonus + fx.martialBonus } };
  if (fx.martialPromote) next = martialPromote(next, content);
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
    if (granted.text) text = `${text} ${granted.text}`;
  }
  // Task 4.6: the next step opens at once (not after a fight; that goes in win/lose).
  if (fx.chain && next.alive && findEvent(content, fx.chain)) next = { ...next, events: { ...next.events, pending: fx.chain } };
  return { state: next, text };
}

/** Apply an outcome that does not come from a pending event (e.g. the end of a fight). */
export function applyOutcome(state: GameState, content: Content, outcome: { text: string; effects: Outcome['effects'] }, rng: Rng): { state: GameState; text: string } {
  const r = applyExtras(applyEffects(state, outcome.effects, rng), content, outcome.effects, outcome.text);
  return { state: r.state, text: fillTemplate(r.text, r.state, content) };
}
