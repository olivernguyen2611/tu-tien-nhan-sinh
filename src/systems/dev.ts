// Developer mode: cheats for play-testing. Pure functions on GameState, like
// every other system; the UI panel only calls these. Every change is logged
// with a [Dev] mark so a tested life is never mistaken for a real one.
import { bringBack } from './karmaLedger';
import { originDef, rollSpecialOrigin } from './specialOrigin';
import { applyOutcome } from './events/engine';
import { levelFor, systemDef } from './heThong';
import type { Content } from '../core/content';
import { APTITUDES, FightSchema, MORTAL_STATS } from '../core/schemas';
import { advanceYear } from '../core/state';
import type { GameState, KarmaTieKind, LogLine, SpiritRoot } from '../core/types';
import { startBattle } from './combat';
import { STAT_LABELS } from './deltas';
import { addItems } from './items';
import { gainScroll, learnTechnique } from './technique';
import { createNpc, npcById } from './npcs';
import { applyRomance, romanceBlocked } from './romance';
import { awakenBody, enterRealm, rootName, startCultivating } from './cultivation';
import { checkDeath } from './time';
import { gainGoldenFinger, loseGoldenFinger, fingerDef } from './goldenFinger';
import { takeChosen } from './chosen';
import { suggestSectName } from './ownSect';
import { clanName } from './clan';
import { sectById } from './sect';
import { startWorldEvent } from './worldEvents';
import { hoaCanhGift } from './martial';
import { finishStep, questForStage } from './martialQuest';
import { Rng } from '../core/rng';
import type { DeathCause } from '../core/types';
import type { SaveMeta } from './save';

export type DevStat = (typeof MORTAL_STATS)[number] | (typeof APTITUDES)[number];
export const DEV_STATS: DevStat[] = [...MORTAL_STATS, ...APTITUDES];

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

function devLog(state: GameState, text: string): GameState {
  const line: LogLine = { text: `[Dev] ${text}`, tone: 'normal' };
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  else log.push({ age: state.character.age, lines: [line] });
  return { ...state, log };
}

/** Add `delta` to a stat or aptitude (clamped 0–100). */
export function devAddStat(state: GameState, stat: DevStat, delta: number): GameState {
  if ((MORTAL_STATS as readonly string[]).includes(stat)) {
    const k = stat as (typeof MORTAL_STATS)[number];
    return devLog({ ...state, stats: { ...state.stats, [k]: clamp(state.stats[k] + delta) } }, `${STAT_LABELS[stat]} ${delta > 0 ? '+' : ''}${delta}`);
  }
  const k = stat as (typeof APTITUDES)[number];
  return devLog({ ...state, aptitudes: { ...state.aptitudes, [k]: clamp(state.aptitudes[k] + delta) } }, `${STAT_LABELS[stat]} ${delta > 0 ? '+' : ''}${delta}`);
}

export function devAddMoney(state: GameState, silver: number, spiritStones: number): GameState {
  const money = {
    silver: Math.max(0, state.money.silver + silver),
    spiritStones: Math.max(0, state.money.spiritStones + spiritStones),
  };
  return devLog({ ...state, money }, `bạc ${silver >= 0 ? '+' : ''}${silver}, linh thạch ${spiritStones >= 0 ? '+' : ''}${spiritStones}`);
}

export function devAddKarma(state: GameState, delta: number): GameState {
  return devLog({ ...state, social: { ...state.social, karma: clamp(state.social.karma + delta, -100, 100) } }, `nhân quả ${delta > 0 ? '+' : ''}${delta}`);
}

/** Open any event now, ignoring its conditions. */
export function devTriggerEvent(state: GameState, content: Content, eventId: string): GameState {
  const event = content.events.find((e) => e.id === eventId);
  if (!state.alive || !event) return state;
  // An NPC-driven event needs its NPC: take the first living one with a matching ledger, else anyone alive.
  const cfg = content.balance.npcs;
  const alive = state.npcs.filter((n) => n.alive);
  const fits = alive.find((n) => (event.npcTrigger === 'revenge' ? n.grudge >= cfg.revengeAt : event.npcTrigger === 'repay' ? n.favor >= cfg.repayAt : true));
  const npc = event.npcTrigger ? (fits ?? alive[0])?.id ?? null : null;
  return devLog({ ...state, events: { ...state.events, pending: eventId, npc } }, `gọi sự kiện ${eventId}`);
}

/** Meet a test NPC (task 3.4): a friend, an enemy with a grudge, or someone owing a kindness. */
export function devMeetNpc(state: GameState, content: Content, kind: 'friend' | 'enemy' | 'debtor'): GameState {
  if (!state.alive) return state;
  const spec = kind === 'enemy' ? { role: 'kẻ thù', affinity: 10, grudge: 40 }
    : kind === 'debtor' ? { role: 'người mang ơn', affinity: 70, favor: 40 }
    : { role: 'bằng hữu', affinity: 75 };
  const met = createNpc(state, content, { ...spec, realm: state.cult.realm, stage: state.cult.stage });
  const n = met.state.npcs.find((x) => x.id === met.id)!;
  return devLog(met.state, `gặp ${spec.role} ${n.name}`);
}

/** Skip `years` years; events that come up are dismissed unanswered. */
export function devSkipYears(state: GameState, content: Content, years: number): GameState {
  let s = devLog(state, `bỏ qua ${years} năm`);
  for (let i = 0; i < years && s.alive; i++) {
    s = advanceYear({ ...s, combat: null, events: { ...s.events, pending: null } }, content);
  }
  return { ...s, events: { ...s.events, pending: null } };
}

/** Full health. */
export function devHeal(state: GameState): GameState {
  return devLog({ ...state, stats: { ...state.stats, health: 100 } }, 'hồi đầy sức khỏe');
}

/** Start a test fight against a foe one realm below, the same realm, or one above. */
export function devStartFight(state: GameState, content: Content, realm: 'below' | 'same' | 'above', intent: 'teach' | 'rob' | 'kill'): GameState {
  if (!state.alive || state.combat) return state;
  const fight = FightSchema.parse({
    foe: { name: 'Hình nhân thử võ', realm, element: 'random', intent },
    win: { text: 'Hình nhân đổ xuống, mạt cưa bay đầy sân.', effects: { 'stat.happiness': 1 } },
    lose: { text: 'Bị hình nhân đánh bại, mất mặt vô cùng.', effects: { 'stat.happiness': -1 } },
  });
  return startBattle(devLog(state, `đánh thử (${realm}, ${intent})`), content, fight, 'Dev');
}

/** Put one item in the bag. */
export function devGiveItem(state: GameState, content: Content, itemId: string): GameState {
  const item = content.items.find((i) => i.id === itemId);
  if (!state.alive || !item) return state;
  return devLog(addItems(state, [itemId]), `nhận ${item.name}`);
}

/** One of every item in the game (the whole catalog), for testing recipes, sales and carried effects. */
export function devGiveAllItems(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  return devLog(addItems(state, content.items.map((i) => i.id)), `nhận mỗi vật phẩm một món (${content.items.length} món)`);
}

/** Learn a technique now, ignoring root, sect and Đạo tâm requirements. */
export function devLearnTechnique(state: GameState, content: Content, techId: string): GameState {
  if (!state.alive) return state;
  const learned = learnTechnique(state, content, techId, { force: true });
  return learned ? devLog(learned.state, `học ${content.techniques.find((t) => t.id === techId)?.name ?? techId}`) : state;
}

/** Keep every technique as a scroll to study later from the Tu luyện sheet. */
export function devGiveAllScrolls(state: GameState, content: Content): GameState {
  if (!state.alive) return state;
  let s = state;
  let n = 0;
  for (const t of content.techniques) {
    const got = gainScroll(s, content, t.id);
    if (got) { s = got.state; n++; }
  }
  return devLog(s, `nhận ${n} bí tịch công pháp`);
}

/** Forget this year's and this life's item use (kháng thuốc, once-per-life). */
export function devResetItemUse(state: GameState): GameState {
  return devLog({ ...state, itemUse: { ...state.itemUse, lastAge: {}, spent: [] } }, 'xóa kháng thuốc');
}

// ---------- Task 5b dev overhaul: realm, death, destiny, Kim Thủ Chỉ, sect, clan, flags ----------

/** Jump to a major realm (first stage). A mortal gets a usable root (Song linh căn) and starts cultivating first. */
export function devSetRealm(state: GameState, content: Content, realmId: string): GameState {
  const realms = content.cultivation.realms.realms;
  const target = realms.findIndex((r) => r.id === realmId);
  if (!state.alive || target < 0) return state;
  let s = state;
  if (target === 0) {
    s = { ...s, cult: { ...s.cult, realm: realms[0].id, stage: 0, progress: 0 } };
  } else {
    if (s.cult.realm === realms[0].id) {
      const root = s.cult.root && (content.balance.roots.gradeSpeed[s.cult.root.grade] ?? 0) > 0 ? s.cult.root : { grade: 'song', elements: ['kim', 'moc'] };
      s = startCultivating({ ...s, cult: { ...s.cult, root } }, content).state;
    }
    const rng = Rng.fromState(s.rng);
    let at = realms.findIndex((r) => r.id === s.cult.realm);
    if (at > target) s = { ...s, cult: { ...s.cult, realm: realmId, stage: 0, progress: 0 } };
    while (at < target) s = enterRealm(s, content, realms[++at].id, rng);
    s = { ...s, rng: rng.getState() };
  }
  return devLog(s, `cảnh giới → ${realms[target].name}`);
}

/** Next stage of the current realm (stops at the peak); the bar empties. */
export function devNextStage(state: GameState, content: Content): GameState {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  if (!state.alive || !realm || state.cult.stage >= realm.stages.length - 1) return state;
  return devLog({ ...state, cult: { ...state.cult, stage: state.cult.stage + 1, progress: 0 } }, `lên ${realm.name} ${realm.stages[state.cult.stage + 1]}`);
}

/** Fill the cultivation bar (the next year tries the next stage, or the peak waits for a big breakthrough). */
export function devFillProgress(state: GameState): GameState {
  if (!state.alive || state.cult.realm === 'pham_nhan') return state;
  return devLog({ ...state, cult: { ...state.cult, progress: 100 } }, 'đầy thanh tu vi');
}

export function devAddLifespan(state: GameState, years: number): GameState {
  if (!state.alive) return state;
  return devLog({ ...state, cult: { ...state.cult, lifespan: Math.max(state.character.age + 1, state.cult.lifespan + years) } }, `thọ nguyên ${years > 0 ? '+' : ''}${years}`);
}

/** Tâm ma back to zero. */
export function devClearHeartDemon(state: GameState): GameState {
  return devLog({ ...state, cult: { ...state.cult, heartDemon: 0 } }, 'xóa tâm ma');
}

/** End the life now, for this cause (death screen, badges, obituary, rebirth, ghost path). */
export function devKill(state: GameState, content: Content, cause: DeathCause): GameState {
  if (!state.alive) return state;
  return checkDeath(devLog(state, `chết ngay (${cause})`), content, cause);
}

/** Add or remove a Tiên Thiên Khí Vận after birth (tổ hợp ẩn follow; one-time stat gains are not given). */
export function devToggleTrait(state: GameState, content: Content, traitId: string): GameState {
  const t = content.traits.find((x) => x.id === traitId);
  if (!state.alive || !t) return state;
  const has = state.traits.includes(traitId);
  const traits = has ? state.traits.filter((x) => x !== traitId) : [...state.traits, traitId];
  return devLog({ ...state, traits }, `${has ? 'bỏ' : 'thêm'} khí vận ${t.name}`);
}

/** Replace the Kim Thủ Chỉ (null: take it away). It awakens as far as the realm allows. */
export function devSetGoldenFinger(state: GameState, content: Content, id: string | null): GameState {
  if (!state.alive) return state;
  const s = state.goldenFinger ? loseGoldenFinger(state, content) : state;
  if (!id) return devLog(s, 'bỏ Kim Thủ Chỉ');
  const f = fingerDef(content, id);
  return f ? devLog(gainGoldenFinger(s, content, id), `Kim Thủ Chỉ → ${f.name}`) : state;
}

/** Force the Kim Thủ Chỉ to a level, whatever the realm (hooks of that level; one-time gains are not given). */
export function devSetFingerLevel(state: GameState, content: Content, level: number): GameState {
  const g = state.goldenFinger;
  const f = fingerDef(content, g?.id);
  if (!state.alive || !g || !f) return state;
  const lv = Math.max(1, Math.min(f.levels.length, level));
  const flags = { ...state.flags };
  for (const l of f.levels.slice(0, lv)) for (const fl of l.setFlags) flags[fl] = true;
  return devLog({ ...state, flags, goldenFinger: { ...g, level: lv } }, `${f.name} cấp ${lv}`);
}

/** A khí vận chi tử of this template becomes a disciple now. */
export function devTakeChosen(state: GameState, content: Content, templateId: string): GameState {
  if (!state.alive) return state;
  // takeChosen takes in one at a time; a dev test wants a new one on demand, so the old one is let go
  // (still an acquaintance, no longer the chosen one nor a disciple).
  const freed: GameState = { ...state, npcs: state.npcs.map((n) => (n.chosen ? { ...n, chosen: undefined, disciple: undefined } : n)) };
  const next = takeChosen(freed, content, templateId);
  if (next === freed) return state;
  return next === state ? state : devLog(next, `nhận khí vận chi tử (${templateId})`);
}

/** Found a sect for free, skipping realm and cost (members as at Kim Đan). */
export function devFoundSect(state: GameState, content: Content): GameState {
  if (!state.alive || state.ownSect) return state;
  const cfg = content.balance.founding;
  const name = suggestSectName(state, content);
  const members = cfg.startMembers[state.cult.realm] ?? cfg.startMembers[cfg.minRealm] ?? 10;
  const s: GameState = { ...state, ownSect: { name, lineage: state.cult.lineage ?? 'tien', rules: [], founded: state.character.age, members, treasury: 100, buildings: {} } };
  return devLog(s, `khai tông ${name}`);
}

/** Found the clan for free. */
export function devFoundClan(state: GameState, content: Content): GameState {
  if (!state.alive || state.clan) return state;
  const name = clanName(state, content);
  return devLog({ ...state, clan: { name, founded: state.character.age, founder: state.character.name, rules: [], properties: {} } }, `lập ${name}`);
}

/** Put the player in a sect of the world, skipping its entry rules. */
export function devJoinSect(state: GameState, content: Content, sectId: string): GameState {
  const sect = sectById(content, sectId);
  if (!state.alive || !sect) return state;
  return devLog({ ...state, sect: { ...state.sect, id: sectId, rank: 0, since: state.character.age, contribution: 0, master: null, left: state.sect.left.filter((x) => x !== sectId) } }, `vào ${sect.name}`);
}

/** 9.R7e: start a sự kiện thiên hạ now (replacing the one under way), or end it (id null). */
export function devWorldEvent(state: GameState, content: Content, id: string | null): GameState {
  if (!state.alive) return state;
  if (id === null) return state.world?.active ? devLog({ ...state, world: { ...state.world, active: null } }, 'dừng sự kiện thiên hạ') : state;
  const name = content.worldEvents?.find((e) => e.id === id)?.name;
  return name ? devLog(startWorldEvent(state, content, id), `bắt đầu ${name}`) : state;
}

/** Task 5b.7: a made-up sect of a past life, not met yet, to test its events. */
export function devPastSect(state: GameState): GameState {
  if (!state.alive) return state;
  return devLog({ ...state, pastSect: { name: 'Thử Nghiệm Tông', lineage: 'tien', founder: 'Tiền Bối Dev', members: 40, status: 'unknown' } }, 'có tông môn đời trước');
}

/** 9.R9: a made-up tie from a past life who comes back at once (their reunion event comes next year). */
export function devPastTie(state: GameState, content: Content, kind: KarmaTieKind): GameState {
  if (!state.alive) return state;
  const tie = { kind, name: 'Cố Nhân Dev', gender: state.character.gender === 'nam' ? 'nu' as const : 'nam' as const, self: 'Tiền Thân Dev', weight: 100, lives: 0, met: false };
  const s = { ...state, pastTies: [...(state.pastTies ?? []), tie] };
  return devLog(bringBack(s, content, s.pastTies.length - 1), `cố nhân kiếp trước (${kind})`);
}

/** 9.S1: force a Tình tiết đặc biệt hiếm on this life (its gains and costs given now; shown on the next screen). */
export function devSpecial(state: GameState, content: Content, id: string): GameState {
  if (!state.alive || state.special?.ids.includes(id)) return state;
  const base = state.special ? { ...state, special: undefined } : state;
  const s = rollSpecialOrigin(base, content, 0, id);
  const merged = state.special ? { ...s, special: { ids: [...state.special.ids, id], seen: false } } : s;
  return devLog(merged, `thiên cơ biến động: ${originDef(content, id)?.name ?? id}`);
}

/** 9.S2: add points to the bound Hệ thống (levels follow). */
export function devSystemPoints(state: GameState, content: Content, points: number): GameState {
  const def = systemDef(content, state.system?.id);
  if (!state.system || !def) return state;
  const total = state.system.points + points;
  return devLog({ ...state, system: { ...state.system, points: total, level: Math.max(state.system.level, levelFor(def, total)) } }, `hệ thống +${points} điểm`);
}

/** 9.S2b: the trap springs now (or the system is cut off when it has none). */
export function devSystemBetray(state: GameState, content: Content): GameState {
  const def = systemDef(content, state.system?.id);
  if (!state.system || !def || state.system.gone) return state;
  if (!def.trap) return devLog({ ...state, system: { ...state.system, gone: true } }, 'hệ thống tắt');
  const r = applyOutcome(state, content, def.trap.betray, Rng.fromState(state.rng));
  return devLog({ ...r.state, system: { ...state.system, gone: true, task: null } }, `hệ thống phản bội: ${r.text}`);
}

/** 9.S3: the past drifts further (Trùng sinh). */
export function devDrift(state: GameState, add: number): GameState {
  if (!state.trungSinh) return state;
  return devLog({ ...state, trungSinh: { ...state.trungSinh, drift: Math.max(0, Math.min(100, state.trungSinh.drift + add)) } }, `lịch sử lệch ${add > 0 ? '+' : ''}${add}`);
}

/** 9.S5: points on a thành thần path. */
export function devMerit(state: GameState, id: string, add: number): GameState {
  const points = { ...state.merit?.points, [id]: Math.max(0, (state.merit?.points[id] ?? 0) + add) };
  return devLog({ ...state, merit: { points, marks: state.merit?.marks ?? [] } }, `${id} +${add}`);
}

/** Set or clear a flag. */
export function devSetFlag(state: GameState, flag: string, on: boolean): GameState {
  const id = flag.trim();
  if (!id) return state;
  const flags = { ...state.flags };
  if (on) flags[id] = true;
  else delete flags[id];
  return devLog({ ...state, flags }, `cờ ${id} ${on ? 'bật' : 'tắt'}`);
}

/** Events matching a filter (id, title or category), for the dev picker. */
export function devFindEvents(content: Content, query: string): Content['events'] {
  const q = query.trim().toLowerCase();
  if (!q) return content.events;
  return content.events.filter((e) => e.id.includes(q) || e.title.toLowerCase().includes(q) || e.category.includes(q));
}

// ---------- Save meta (Luân Hồi): pure functions on SaveMeta; the App writes them back ----------

export function devMetaPoints(meta: SaveMeta, delta: number): SaveMeta {
  return { ...meta, rebirthPoints: Math.max(0, meta.rebirthPoints + delta) };
}

/** Set a thiên phú luân hồi to a level (0 removes it). */
export function devMetaTalent(meta: SaveMeta, content: Content, id: string, level: number): SaveMeta {
  const t = content.rebirthTalents.talents.find((x) => x.id === id);
  if (!t) return meta;
  const rebirthTalents = { ...meta.rebirthTalents };
  const lv = Math.max(0, Math.min(t.levels.length, level));
  if (lv === 0) delete rebirthTalents[id];
  else rebirthTalents[id] = lv;
  return { ...meta, rebirthTalents };
}

/** Thiên Thư and every thành tựu (so every unlockable Kim Thủ Chỉ can be chosen). */
export function devMetaUnlockAll(meta: SaveMeta, content: Content): SaveMeta {
  return {
    ...meta,
    codex: {
      ...meta.codex,
      traits: content.traits.map((t) => t.id),
      combos: content.traitCombos.combos.map((c) => c.id),
      fingers: content.goldenFingers.fingers.map((f) => f.id),
    },
    achievements: { ...Object.fromEntries(content.achievements.achievements.map((a) => [a.id, { name: 'Dev', life: meta.livesPlayed }])), ...meta.achievements },
  };
}

/** Bảo hiểm Kim Thủ Chỉ full: the next ordinary life is sure to be born with one. */
export function devMetaFingerPity(meta: SaveMeta, content: Content): SaveMeta {
  return { ...meta, fingerPity: content.balance.goldenFinger.pityLives };
}

// ---------- Playtest 2026-10-12: martial path, spirit root, marriage, event repeats ----------

/** Martial stage (-1 = none … 6); stages 5–6 skip their kỳ ngộ. A mortal only. */
export function devSetMartial(state: GameState, content: Content, stage: number): GameState {
  if (!state.alive || state.cult.realm !== 'pham_nhan') return state;
  let s: GameState = { ...state, martial: { ...state.martial, stage, years: 0, lastTrain: null, reachedAt: state.character.age, quest: null } };
  // Skipping to Hóa cảnh or beyond still brings the cao nhân's gift (once).
  if (stage >= content.martial.gift.stage && !s.flags[content.martial.gift.flag]) s = hoaCanhGift(s, content);
  return devLog(s, `võ đạo → ${stage < 0 ? 'chưa nhập môn' : content.martial.stages[stage]?.name ?? stage}`);
}

/** Backlog 7: begin the quest chain of the current martial stage now, with this year's try free. */
export function devStartMartialQuest(state: GameState, content: Content): GameState {
  const def = questForStage(state, content);
  if (!state.alive || state.cult.realm !== 'pham_nhan' || !def) return state;
  const quest = { id: def.id, step: 0, startedAt: state.character.age, lastTry: null, game: null };
  return devLog({ ...state, martial: { ...state.martial, quest } }, `chuỗi võ đạo → ${def.name}`);
}

/** Backlog 7: win (or lose) the current quest step at once, or free this year's try again. */
export function devQuestStep(state: GameState, content: Content, what: 'win' | 'lose' | 'retry'): GameState {
  const q = state.martial.quest;
  if (!state.alive || !q) return state;
  if (what === 'retry') return devLog({ ...state, martial: { ...state.martial, quest: { ...q, lastTry: null, game: null } } }, 'ải võ đạo: được thử lại');
  return devLog(finishStep(state, content, what === 'win').state, `ải võ đạo → ${what === 'win' ? 'qua' : 'hỏng'}`);
}

/** Backlog 2: every child and the đạo lữ can be bonded with again this year. */
export function devResetBond(state: GameState): GameState {
  const clear = (a: Record<string, number>) => Object.fromEntries(Object.entries(a).filter(([k]) => !k.startsWith('bond_')));
  return devLog({
    ...state,
    family: state.family.map((r) => ({ ...r, lastActions: clear(r.lastActions) })),
    npcs: state.npcs.map((n) => (n.lastBond ? { ...n, lastBond: {} } : n)),
  }, 'gia đạo: làm lại được trong năm');
}

/** Backlog 2: make every living child rootless again (to test a hậu thiên linh căn), or give them back an ordinary root. */
export function devChildrenRoot(state: GameState, content: Content, rootless: boolean): GameState {
  const root = rootless ? { grade: 'none', elements: [] } : { grade: 'song', elements: ['kim', 'hoa'] };
  return devLog({
    ...state,
    family: state.family.map((r) => (r.role === 'child' && r.alive ? { ...r, root, bodyId: null, acquired: false, rootTries: 0 } : r)),
  }, `con cái → ${rootless ? 'không linh căn' : content.cultivation.roots.grades.find((g) => g.id === 'song')?.name ?? 'song'}`);
}

/** Every root the dev panel can set: grades (elements from the first ones) and each variant. Bodies are set apart (`devSetBody`). */
export function devRootOptions(content: Content): { key: string; label: string; root: SpiritRoot; group: string }[] {
  const { grades, elements } = content.cultivation.roots;
  const basic = elements.filter((e) => !e.variant).map((e) => e.id);
  const out: { key: string; label: string; root: SpiritRoot; group: string }[] = [];
  for (const g of grades) {
    if (g.special) continue;
    const root = { grade: g.id, elements: basic.slice(0, content.balance.roots.elementCount[g.id] ?? 0) };
    out.push({ key: g.id, label: rootName(root, content), root, group: 'Linh căn thường' });
  }
  const martial = grades.find((g) => g.special === 'martial');
  if (martial) {
    const root = { grade: martial.id, elements: basic };
    out.push({ key: martial.id, label: rootName(root, content), root, group: 'Linh căn võ đạo' });
  }
  for (const e of elements.filter((x) => x.variant)) {
    const root = { grade: 'bien_di', elements: [e.id] };
    out.push({ key: `bien_di:${e.id}`, label: rootName(root, content), root, group: 'Biến dị linh căn' });
  }
  return out;
}

/** Replace the spirit root (a special body is a separate thing and stays). */
export function devSetRoot(state: GameState, content: Content, root: SpiritRoot): GameState {
  if (!state.alive) return state;
  return devLog({ ...state, cult: { ...state.cult, root } }, `linh căn → ${rootName(root, content)}`);
}

/** Set (or clear, with null) the special body without its one-time gains; the root is untouched. */
export function devSetBody(state: GameState, content: Content, bodyId: string | null): GameState {
  if (!state.alive || (bodyId && !content.cultivation.roots.bodies.some((b) => b.id === bodyId))) return state;
  return devLog({ ...state, cult: { ...state.cult, bodyId } }, `thể chất → ${bodyId ?? content.cultivation.roots.plainBody}`);
}

/** Awaken a special body at once (its one-time gains apply), even for a rootless or already-bodied character. */
export function devAwakenBody(state: GameState, content: Content, bodyId: string): GameState {
  if (!state.alive || !content.cultivation.roots.bodies.some((b) => b.id === bodyId)) return state;
  const base: GameState = state.cult.root && !state.cult.bodyId && (content.balance.roots.gradeSpeed[state.cult.root.grade] ?? 0) > 0
    ? state
    : { ...state, cult: { ...state.cult, root: { grade: 'song', elements: ['kim', 'moc'] }, bodyId: null } };
  return devLog(awakenBody(base, content, bodyId).state, `thức tỉnh thể chất → ${bodyId}`);
}

/** Wed a new adult at once (affinity 80), cultivating at the player's realm when the player does. */
export function devMarry(state: GameState, content: Content): GameState {
  if (!state.alive || state.romance.partner || romanceBlocked(state, content)) return state;
  const cultivating = state.cult.realm !== 'pham_nhan';
  const met = createNpc(state, content, {
    role: 'bằng hữu', age: Math.max(content.balance.romance.minAge, state.character.age), affinity: 80,
    gender: state.character.gender === 'nam' ? 'nu' : 'nam', root: cultivating, realm: cultivating ? state.cult.realm : undefined,
  });
  const s = applyRomance(met.state, content, met.id, { marry: { affinity: 80 } });
  return devLog(s, `thành thân với ${npcById(s, met.id)?.name ?? met.id}`);
}

/** Spouse affinity ± delta. */
export function devSpouseAffinity(state: GameState, delta: number): GameState {
  const id = state.romance.partner;
  if (!state.alive || !id) return state;
  const s = { ...state, npcs: state.npcs.map((n) => (n.id === id ? { ...n, affinity: clamp(n.affinity + delta) } : n)) };
  return devLog(s, `thiện cảm bạn đời ${delta > 0 ? '+' : ''}${delta} → ${npcById(s, id)?.affinity}`);
}

/** Forget which events happened (cooldowns, once-per-life, repeat decay). */
/** Playtest 2: every Kim Thủ Chỉ action usable again this year. */
export function devResetFingerCooldowns(state: GameState): GameState {
  if (!state.goldenFinger) return state;
  return devLog({ ...state, goldenFinger: { ...state.goldenFinger, used: {} } }, 'Kim Thủ Chỉ: dùng lại được');
}

export function devResetEventHistory(state: GameState): GameState {
  return devLog({ ...state, events: { ...state.events, history: {}, seen: {} } }, 'xóa lịch sử sự kiện');
}

/** 9.R6a: a life touched by developer mode is marked for good and earns no records. */
export function markDevLife(state: GameState): GameState {
  return state.devUsed ? state : { ...state, devUsed: true };
}

/** Whether this life may write thành tựu, thử thách tuần, điểm Luân Hồi, Thiên Thư and Sổ tri thức. */
export const countsForRecords = (state: GameState): boolean => !state.devUsed;
