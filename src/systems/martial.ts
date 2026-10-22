// Martial path for mortals (task 3.11, mortal-path.md 2b): seven stages from
// Tam lưu to Ngũ khí triều nguyên. Every training year may break through: the
// chance comes from Căn cốt and Ngộ tính, and grows with the years trained up to
// the step's typical years (playtest 2026-10-12: no fixed countdown). The last two stages
// need a kỳ ngộ (event effect). Ngũ khí triều nguyên becomes a Ngũ linh căn.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { startCultivating } from './cultivation';
import { learnTechnique } from './technique';
import { addRenown } from './jianghu';

const value = (state: GameState, key: string) =>
  key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** "Nhất lưu", or null before Tam lưu. */
export function martialName(state: GameState, content: Content): string | null {
  return state.martial.stage >= 0 ? content.martial.stages[state.martial.stage]?.name ?? null : null;
}

/** 9.V2: tiểu cảnh inside the stage (0 sơ nhập, 1 tiểu thành, 2 đại thành), by years since reaching it. */
export function martialSubStage(state: GameState, content: Content): number {
  const per = content.balance.martial.subStageYears?.[state.martial.stage];
  if (state.martial.stage < 0 || !per) return 0;
  const years = state.character.age - (state.martial.reachedAt ?? state.character.age);
  return Math.max(0, Math.min(2, Math.floor(years / per)));
}

/** "Hóa cảnh tiểu thành", or null before Tam lưu. */
export function martialLabel(state: GameState, content: Content): string | null {
  const name = martialName(state, content);
  const sub = content.martial.subStages?.[martialSubStage(state, content)];
  return name && sub ? `${name} ${sub}` : name;
}

/** Combat power of a mortal from the martial stage (for task 3.3); each tiểu cảnh adds combat.stagePct (9.V2). */
export function martialPower(state: GameState, content: Content): number {
  if (state.martial.stage < 0) return 0;
  const base = content.balance.martial.combatPower[state.martial.stage] ?? 0;
  return base * (1 + content.balance.combat.stagePct * martialSubStage(state, content));
}

function hasTeacher(state: GameState, content: Content): boolean {
  const t = content.martial.teacher;
  return t.flags.some((f) => state.flags[f]) || (!!state.career.id && t.careers.includes(state.career.id)) || t.origins.includes(state.character.originId);
}

export interface MartialView {
  stage: string | null;
  /** The stage training leads to, or null when the next one needs a kỳ ngộ / the path is done. */
  next: string | null;
  years: number;
  need: number;
  chance: number;
  /** Chance that training this year breaks through. */
  yearChance: number;
  /** Why "Luyện võ" cannot be done now. */
  blocked: string | null;
  /** Why the next breakthrough cannot be tried even with enough years. */
  gate: string | null;
}

/** This year's chance: the full check scaled by years trained so far against the step's typical years. */
export function martialYearChance(state: GameState, content: Content, years = state.martial.years): number {
  const step = content.balance.martial.steps[state.martial.stage + 1];
  if (!step) return 0;
  return martialChance(state, content) * content.balance.martial.yearMul * Math.min(1, years / step.years);
}

export function martialChance(state: GameState, content: Content): number {
  const cfg = content.balance.martial;
  const step = cfg.steps[state.martial.stage + 1];
  if (!step) return 0;
  const avg = step.stats.reduce((sum, k) => sum + value(state, k), 0) / step.stats.length;
  let p = cfg.chanceBase + (avg - step.difficulty) * cfg.chancePerPoint + state.martial.bonus / 100;
  p = Math.max(cfg.chanceMin, Math.min(cfg.chanceMax, p));
  return state.character.age > cfg.oldAge ? p * cfg.oldAgeMul : p;
}

function gateReason(state: GameState, content: Content): string | null {
  const step = content.balance.martial.steps[state.martial.stage + 1];
  if (!step) return null;
  if (step.needsTeacher && !hasTeacher(state, content)) return 'Cần bí kíp hoặc sư phụ (võ quán, Thiếu Lâm…).';
  if (step.minPhysique !== undefined && state.aptitudes.physique < step.minPhysique) return `Cần Căn cốt ${step.minPhysique}.`;
  return null;
}

export function martialView(state: GameState, content: Content): MartialView {
  const cfg = content.balance.martial;
  const step = cfg.steps[state.martial.stage + 1];
  const nextStage = content.martial.stages[state.martial.stage + 1];
  let blocked: string | null = null;
  if (!state.alive) blocked = 'Đã hết một đời.';
  else if (state.cult.realm !== 'pham_nhan') blocked = 'Đã bước vào tu tiên.';
  else if (state.character.age < cfg.minAge) blocked = `Đủ ${cfg.minAge} tuổi mới luyện võ được.`;
  else if (!step) blocked = nextStage ? `Muốn lên ${nextStage.name} cần kỳ ngộ.` : 'Võ đạo đã tới tận cùng.';
  else if (state.martial.lastTrain === state.character.age) blocked = 'Năm nay đã luyện rồi.';
  return {
    stage: martialLabel(state, content),
    next: step ? nextStage?.name ?? null : null,
    years: state.martial.years,
    need: step?.years ?? 0,
    chance: martialChance(state, content),
    yearChance: step && !gateReason(state, content) ? martialYearChance(state, content, state.martial.years + 1) : 0,
    blocked,
    gate: gateReason(state, content),
  };
}

/** Reach the next stage (training or an event): lifespan grows. The last stage is the end of the path (9.V2): no auto-ascend. */
export function martialPromote(state: GameState, content: Content): GameState {
  const stage = state.martial.stage + 1;
  const def = content.martial.stages[stage];
  if (!def || state.cult.realm !== 'pham_nhan') return state;
  const add = content.balance.martial.lifespan[stage] ?? 0;
  let s: GameState = {
    ...state,
    martial: { ...state.martial, stage, years: 0, bonus: 0, reachedAt: state.character.age, quest: null },
    cult: { ...state.cult, lifespan: state.cult.lifespan + add },
  };
  s = { ...s, log: addLines(s, [{ text: content.martial.texts.promote.replaceAll('{stage}', def.name).replaceAll('{description}', def.description), tone: 'good' }]) };
  // 11.1: a new stage is talked about in the giang hồ.
  if (content.balance.jianghu) s = addRenown(s, content, content.balance.jianghu.stageFame * (stage + 1), 0);
  if (stage === content.martial.gift.stage) s = hoaCanhGift(s, content);
  if (stage === content.martial.stages.length - 1 && content.martial.texts.peak) s = { ...s, log: addLines(s, [{ text: content.martial.texts.peak, tone: 'rare' }]) };
  return s;
}

/**
 * Hóa cảnh: a cao nhân gives a technique this rootless body cannot cultivate (it waits in the scrolls
 * until Ngũ khí) and a mortal manual in its place: more combat power and a little lifespan.
 */
export function hoaCanhGift(state: GameState, content: Content): GameState {
  const { gift, manual } = content.martial;
  const scrolls = state.cult.scrolls.includes(gift.technique) || state.cult.technique === gift.technique ? state.cult.scrolls : [...state.cult.scrolls, gift.technique];
  const s: GameState = {
    ...state,
    flags: { ...state.flags, [gift.flag]: true },
    aptitudes: { ...state.aptitudes, physique: Math.min(100, state.aptitudes.physique + manual.physique) },
    martial: { ...state.martial, manual: manual.id },
    cult: { ...state.cult, scrolls, lifespan: state.cult.lifespan + manual.lifespan },
  };
  return { ...s, log: addLines(s, [{ text: gift.giftText, tone: 'rare' }, { text: gift.manualText.replaceAll('{manual}', manual.name), tone: 'good' }]) };
}

/** The mortal manual taken up at Hóa cảnh while the life is still a mortal, else null. */
export function mortalManual(state: GameState, content: Content): Content['martial']['manual'] | null {
  return state.martial.manual && state.cult.realm === 'pham_nhan' ? content.martial.manual : null;
}

/**
 * 9.V2 Tiên Võ đồng tu (event effect martialAscend): a Ngũ khí martial artist who met a tiên duyên and holds
 * the cao nhân's kinh steps into cultivation. Martial power is kept (combatPower takes the larger).
 */
export function martialAscend(state: GameState, content: Content): GameState {
  const last = content.martial.stages.length - 1;
  if (state.martial.stage !== last || state.cult.realm !== 'pham_nhan') return state;
  return ascend(state, content);
}

/**
 * Ngũ khí triều nguyên: the five qi become the Ngũ khí root (above an ordinary Ngũ linh căn) and the
 * body becomes Tiên Võ thể; the life steps into Luyện Khí. Only a mortal ever gets here (a rootless
 * one: the root is innate, and this is the path's own reward).
 */
function ascend(state: GameState, content: Content): GameState {
  const basic = content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id);
  const { rootGrade, bodyId } = content.martial.ascend;
  const withRoot: GameState = {
    ...state,
    flags: { ...state.flags, vo_dao_nhap_tien: true },
    martial: { ...state.martial, manual: null },
    cult: { ...state.cult, root: { grade: rootGrade, elements: basic }, bodyId },
  };
  const logged = { ...withRoot, log: addLines(withRoot, [{ text: content.martial.texts.ascend, tone: 'rare' }]) };
  // The cao nhân of Hóa cảnh returns: now there is a root, the kinh can be cultivated (9.R4c: it is the entry technique).
  let s = logged;
  const { gift } = content.martial;
  const tech = content.techniques.find((t) => t.id === gift.technique);
  const learned = tech ? learnTechnique(s, content, gift.technique, { quiet: true, force: true }) : null;
  if (learned && tech) s = { ...learned.state, log: addLines(learned.state, [{ text: gift.reunionText.replaceAll('{technique}', tech.name), tone: 'rare' }]) };
  return startCultivating(s, content).state;
}

/** Train for a year; with enough years, try the next stage. Null when it cannot be done now. */
export function trainMartial(state: GameState, content: Content): { state: GameState; text: string } | null {
  const view = martialView(state, content);
  if (view.blocked) return null;
  const texts = content.martial.texts;
  const years = state.martial.years + 1;
  let s: GameState = { ...state, martial: { ...state.martial, years, lastTrain: state.character.age } };
  const train = typeof texts.train === 'string' ? [texts.train] : texts.train;
  const lines: LogLine[] = [{ text: train[years % train.length].replaceAll('{years}', String(years)).replaceAll('{next}', view.next ?? ''), tone: 'normal' }];
  if (!view.gate) {
    const rng = Rng.fromState(s.rng);
    const ok = rng.chance(martialYearChance(s, content, years));
    s = { ...s, rng: rng.getState() };
    if (ok) {
      s = { ...s, log: addLines(s, lines) };
      const promoted = martialPromote(s, content);
      return { state: promoted, text: promoted.log.at(-1)!.lines.slice(-1)[0].text };
    }
    // 9.V2: forcing a hard step past its typical years may go wrong (tẩu hỏa), rarely costing a stage.
    const step = content.balance.martial.steps[state.martial.stage + 1];
    if (step?.deviation && years >= view.need) {
      const r2 = Rng.fromState(s.rng);
      if (r2.chance(step.deviation.chance)) {
        s = { ...s, stats: { ...s.stats, health: Math.max(0, s.stats.health + step.deviation.health) } };
        if (content.martial.texts.deviation) lines.push({ text: content.martial.texts.deviation, tone: 'bad' });
        if (state.martial.stage > 0 && r2.chance(step.deviation.cripple)) {
          const down = state.martial.stage - 1;
          s = { ...s, martial: { ...s.martial, stage: down, years: 0, reachedAt: state.character.age } };
          if (content.martial.texts.crippled) lines.push({ text: content.martial.texts.crippled.replaceAll('{stage}', content.martial.stages[down].name), tone: 'bad' });
        }
      }
      s = { ...s, rng: r2.getState() };
    }
    // Past twice the typical years, say so (once in a while), so a weak trainee knows why.
    if (years >= view.need * 2 && years % view.need === 0) lines.push({ text: texts.fail.replaceAll('{next}', view.next ?? ''), tone: 'bad' });
  }
  return { state: { ...s, log: addLines(s, lines) }, text: lines.map((l) => l.text).join(' ') };
}

/** One attempt at the next stage now (event effect), using the training check. */
export function martialAttempt(state: GameState, content: Content): { state: GameState; text: string } {
  const view = martialView(state, content);
  if (state.cult.realm !== 'pham_nhan' || !view.next || view.gate) return { state, text: '' };
  const rng = Rng.fromState(state.rng);
  const ok = rng.chance(martialChance(state, content));
  const s: GameState = { ...state, rng: rng.getState() };
  if (ok) {
    const promoted = martialPromote(s, content);
    return { state: promoted, text: promoted.log.at(-1)!.lines.slice(-1)[0].text };
  }
  const text = content.martial.texts.fail.replaceAll('{next}', view.next);
  return { state: { ...s, log: addLines(s, [{ text, tone: 'bad' }]) }, text };
}

/** Extra years of training from an event. */
export function addMartialYears(state: GameState, years: number): GameState {
  return { ...state, martial: { ...state.martial, years: state.martial.years + years } };
}

