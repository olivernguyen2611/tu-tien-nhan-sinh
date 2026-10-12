// NPCs with their own fate (task 3.4): people met outside the family age,
// cultivate, break through, die, and keep a ledger of favor and grudge
// (sổ ân oán) towards the player. Numbers in balance.npcs; personalities in
// npc-traits.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { makeName } from './names';
import { hookSum } from './cultivation';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export interface NpcSpec {
  role: string;
  /** Defaults: random gender and name, age near the player's. */
  name?: string;
  gender?: Npc['gender'];
  age?: number;
  /** Never younger than this (task 3.6: someone met in a romance event is an adult). */
  minAge?: number;
  /** Playtest 2: about the player's age (balance.npcs.peerAgeOffset) instead of the wider ageOffset. */
  peer?: boolean;
  /** Realm id; a rooted NPC with no realm starts where the player's generation usually is. */
  realm?: string;
  stage?: number;
  root?: boolean;
  affinity?: number;
  favor?: number;
  grudge?: number;
  heirOf?: string | null;
  /** Family name to keep (an heir carries the dead one's surname). */
  surname?: string;
}

function realmList(content: Content) {
  return content.cultivation.realms.realms;
}

/** Old-age limit for an NPC at a realm (balance.realms lifespan, mortals use balance.lifespan). */
function lifespanFor(content: Content, realm: string, rng: Rng): number {
  const r = content.balance.realms[realm];
  if (r?.lifespan) return r.lifespan + rng.int(-(r.lifespanVariance ?? 0), r.lifespanVariance ?? 0);
  const l = content.balance.lifespan;
  return l.mortalBase + rng.int(-l.mortalVariance, l.mortalVariance);
}

/** Meet someone new. Returns the state and the new NPC's id. */
export function createNpc(state: GameState, content: Content, spec: NpcSpec): { state: GameState; id: string } {
  const cfg = content.balance.npcs;
  const traits = content.npcTraits;
  const rng = Rng.fromState(state.rng);
  const gender = spec.gender ?? (rng.chance(0.5) ? 'nam' : 'nu');
  const taken = [state.character.name, ...state.family.map((r) => r.name), ...state.npcs.map((n) => n.name)];
  const name = spec.name ?? makeName(rng, content.names, gender, { taken, surname: spec.surname });
  const offset = spec.peer ? cfg.peerAgeOffset : cfg.ageOffset;
  const age = Math.max(cfg.minAge, spec.minAge ?? 0, spec.age ?? state.character.age + rng.int(offset[0], offset[1]));
  const root = spec.root ?? (spec.realm !== undefined && spec.realm !== 'pham_nhan' ? true : rng.chance(cfg.rootChance));
  const realm = spec.realm ?? (root && age >= 16 ? realmList(content)[1]?.id ?? 'pham_nhan' : 'pham_nhan');
  const nature = traits.nature.length > 0 ? rng.pick(traits.nature) : null;
  const surface = nature?.surface ?? (traits.surface.length > 0 ? rng.pick(traits.surface).id : null);
  const npc: Npc = {
    id: `npc${state.npcs.length + 1}_${rng.int(1000, 9999)}`,
    name, gender, age,
    lifespan: Math.max(age + 1, lifespanFor(content, realm, rng)),
    alive: true,
    role: spec.role,
    root,
    aptitude: rng.int(cfg.aptitude[0], cfg.aptitude[1]),
    realm,
    stage: spec.stage ?? 0,
    progress: 0,
    surface,
    nature: nature?.id ?? null,
    natureKnown: nature !== null && (nature.surface !== undefined || nature.honest),
    goal: traits.goals.length > 0 ? rng.pick(traits.goals).id : null,
    // Quý nhân duyên or a face that scares children: how strangers first take to the player.
    affinity: clamp((spec.affinity ?? 50) + hookSum(state, content, 'npcAffinityStart')),
    favor: clamp(spec.favor ?? 0),
    grudge: clamp(spec.grudge ?? 0),
    heirOf: spec.heirOf ?? null,
  };
  const npcs = forgetExtra([...state.npcs, npc], cfg.max);
  return { state: { ...state, rng: rng.getState(), npcs }, id: npc.id };
}

/** Over the limit, forget the least important: dead first, then the one closest to a stranger. */
function forgetExtra(npcs: Npc[], max: number): Npc[] {
  const out = npcs.slice();
  while (out.length > max) {
    // Disciples and a khí vận chi tử are never forgotten.
    const weight = (n: Npc) => (n.alive ? 1000 : 0) + (n.disciple || n.chosen ? 5000 : 0) + Math.abs(n.affinity - 50) + n.favor + n.grudge;
    let low = 0;
    for (let i = 1; i < out.length - 1; i++) if (weight(out[i]) < weight(out[low])) low = i;
    out.splice(low, 1);
  }
  return out;
}

export function npcById(state: GameState, id: string | null | undefined): Npc | undefined {
  return id ? state.npcs.find((n) => n.id === id) : undefined;
}

/** Change one NPC (affinity, favor, grudge…), clamped; reveals the nature once close enough. */
export function changeNpc(state: GameState, content: Content, id: string, d: { affinity?: number; favor?: number; grudge?: number; reveal?: boolean }): GameState {
  const reveal = content.balance.npcs.revealAffinity;
  return {
    ...state,
    npcs: state.npcs.map((n) => {
      if (n.id !== id) return n;
      const gain = d.affinity ?? 0;
      const affinity = clamp(n.affinity + (gain > 0 ? gain * (natureOf(content, n)?.affinityMul ?? 1) : gain));
      return {
        ...n,
        affinity,
        favor: clamp(n.favor + (d.favor ?? 0)),
        grudge: clamp(n.grudge + (d.grudge ?? 0)),
        natureKnown: n.natureKnown || !!d.reveal || affinity >= reveal,
      };
    }),
  };
}

function natureOf(content: Content, n: Npc) {
  return content.npcTraits.nature.find((x) => x.id === n.nature);
}

/** The face they show hides a different nature, not yet seen through. */
export function isMasked(content: Content, n: Npc): boolean {
  return !n.natureKnown && !!n.surface && (natureOf(content, n)?.masks ?? []).includes(n.surface);
}

/** NPC the current event is about. */
export function actor(state: GameState): Npc | undefined {
  return npcById(state, state.events.npc);
}

export type NpcTrigger = 'revenge' | 'repay' | 'reveal';

/**
 * This year's NPC-driven visit, if any: someone with a grudge comes for revenge,
 * someone owing a kindness repays it, a masked friend shows their true face.
 * Returns the NPCs whose roll came up, most pressing first.
 */
export function npcCalls(state: GameState, content: Content, rng: Rng): { trigger: NpcTrigger; id: string }[] {
  const cfg = content.balance.npcs;
  const order = realmList(content).map((r) => r.id);
  const out: { trigger: NpcTrigger; id: string }[] = [];
  for (const n of state.npcs) {
    if (!n.alive) continue;
    const nat = natureOf(content, n);
    if (n.grudge >= cfg.revengeAt) {
      const stronger = order.indexOf(n.realm) > order.indexOf(state.cult.realm) ? cfg.revengeStrongerMul : 1;
      if (rng.chance(Math.min(1, cfg.revengeChance * stronger * (nat?.revengeMul ?? 1)))) out.push({ trigger: 'revenge', id: n.id });
    }
    if (n.favor >= cfg.repayAt && rng.chance(Math.min(1, cfg.repayChance * (nat?.repayMul ?? 1)))) out.push({ trigger: 'repay', id: n.id });
    if (isMasked(content, n) && rng.chance(cfg.revealChance)) out.push({ trigger: 'reveal', id: n.id });
  }
  const rank: Record<NpcTrigger, number> = { revenge: 0, reveal: 1, repay: 2 };
  return out.sort((a, b) => rank[a.trigger] - rank[b.trigger]);
}

/** Is the NPC someone whose news the player hears about? */
function close(content: Content, n: Npc): boolean {
  return n.affinity >= content.balance.npcs.newsAffinity || n.grudge >= content.balance.npcs.revengeAt;
}

/** One year for every NPC: age, cultivate, break through, die; ân oán fade. */
export function ageNpcs(state: GameState, content: Content): GameState {
  if (state.npcs.length === 0) return state;
  const cfg = content.balance.npcs;
  const rng = Rng.fromState(state.rng);
  const realms = realmList(content);
  const lines: LogLine[] = [];
  const out: Npc[] = [];

  for (const n0 of state.npcs) {
    if (!n0.alive) { out.push(n0); continue; }
    const nat = natureOf(content, n0);
    let n: Npc = {
      ...n0,
      age: n0.age + 1,
      favor: clamp(n0.favor - cfg.fadePerYear),
      grudge: clamp(n0.grudge - cfg.fadePerYear * (nat?.grudgeFade ?? 1)),
    };

    // Cultivation: rooted NPCs start at 16 and climb stage by stage.
    if (n.root) {
      if (n.realm === 'pham_nhan' && n.age >= 16) n = { ...n, realm: realms[1]?.id ?? n.realm, stage: 0, progress: 0 };
      const speed = content.balance.realms[n.realm]?.speedPct ?? 0;
      // Hào quang (task 5.5): a khí vận chi tử climbs faster.
      const halo = n.chosen ? content.balance.chosen.progressMul : 1;
      // Task 5c.8: a technique handed down by a master speeds the disciple by its grade.
      const techGrade = n.technique ? content.techniques.find((t) => t.id === n.technique)?.grade : undefined;
      const handed = 1 + (techGrade ? content.balance.disciples.acts.techniqueSpeed[techGrade] ?? 0 : 0);
      n = { ...n, progress: n.progress + speed * (cfg.speedBase + n.aptitude / cfg.speedDivisor) * (nat?.speedMul ?? 1) * halo * handed };
      while (n.progress >= 100) {
        const ri = realms.findIndex((r) => r.id === n.realm);
        const stages = realms[ri]?.stages.length ?? 1;
        if (n.stage + 1 < stages) {
          n = { ...n, stage: n.stage + 1, progress: n.progress - 100 };
          continue;
        }
        const next = realms[ri + 1];
        const chance = next ? (content.balance.realms[next.id]?.breakthroughChance ?? 0) + (n.chosen ? content.balance.chosen.breakthroughBonus : 0) : 0;
        if (next && rng.chance(chance)) {
          const lifespan = Math.max(n.lifespan, lifespanFor(content, next.id, rng));
          n = { ...n, realm: next.id, stage: 0, progress: 0, lifespan };
          if (close(content, n)) lines.push({ text: `Nghe tin ${n.role} ${n.name} đột phá ${next.name}.`, tone: n.grudge > 0 ? 'bad' : 'good' });
        } else {
          n = { ...n, progress: 50 };
        }
        break;
      }
    }

    // Hào quang: a khí vận chi tử always finds a way out of a mishap.
    const sudden = !n.chosen && rng.chance(cfg.deathPerYear + (nat?.riskPerYear ?? 0));
    if (n.age >= n.lifespan || sudden) {
      n = { ...n, alive: false };
      if (close(content, n)) {
        const how = sudden ? 'gặp nạn qua đời' : `qua đời, hưởng thọ ${n.age} tuổi`;
        // The spouse or lover is not "người quen" (playtest 2026-10-12).
        const who = state.romance.partner === n.id ? 'bạn đời' : state.romance.lover === n.id ? 'người thương' : n.role;
        lines.push({ text: `Nghe tin ${who} ${n.name} ${how}.`, tone: n.grudge > 0 ? 'normal' : 'bad' });
      }
    }
    out.push(n);
  }

  let s: GameState = { ...state, rng: rng.getState(), npcs: forgetExtra(out, cfg.max) };
  if (lines.length > 0) {
    const log = s.log.slice();
    const last = log[log.length - 1];
    log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
    s = { ...s, log };
  }
  return s;
}

/** The player killed an NPC: they die, and kin takes up part of the grudge (task 3.4, ân oán truyền đời). */
export function killNpc(state: GameState, content: Content, id: string): GameState {
  const victim = npcById(state, id);
  if (!victim || !victim.alive) return state;
  const s: GameState = { ...state, npcs: state.npcs.map((n) => (n.id === id ? { ...n, alive: false } : n)) };
  const cfg = content.balance.npcs;
  return createNpc(s, content, {
    role: 'hậu duệ',
    name: undefined,
    age: Math.max(cfg.minAge, victim.age - 20),
    root: victim.root,
    affinity: 0,
    grudge: cfg.revengeAt + victim.grudge * cfg.inheritShare,
    heirOf: victim.id,
    surname: victim.name.split(' ')[0],
  }).state;
}

/** Labels for the relations panel; readMind (Kim Thủ Chỉ Đọc tâm, task 5b.2) sees every nature. */
export function npcLabel(content: Content, n: Npc, readMind = false): { surface: string | null; nature: string | null; goal: string | null; realm: string } {
  const t = content.npcTraits;
  const realm = realmList(content).find((r) => r.id === n.realm);
  const stageName = realm && n.realm !== 'pham_nhan' ? ` ${realm.stages[n.stage] ?? ''}`.trimEnd() : '';
  return {
    surface: t.surface.find((x) => x.id === n.surface)?.name ?? null,
    nature: n.natureKnown || readMind ? t.nature.find((x) => x.id === n.nature)?.name ?? null : null,
    goal: t.goals.find((x) => x.id === n.goal)?.name ?? null,
    realm: `${realm?.name ?? ''}${stageName}`,
  };
}
