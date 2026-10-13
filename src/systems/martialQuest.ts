// Martial quest chain (backlog 7): Hóa cảnh → Tam hoa tụ đỉnh → Ngũ khí triều nguyên each need a
// chain of steps, one a year, starting the year after the stage is reached. A step is a mini-game
// (Vòng đá ngũ hành, Điều tức quan tưởng) or a stat check; the last step promotes the martial
// stage. Numbers in balance.martial.quest, texts and steps in martial.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { MartialQuestDef, MartialStep } from '../core/schemas';
import type { GameState, LogLine, MartialQuest, MiniGame } from '../core/types';
import { itemById, removeItems } from './items';
import { martialPromote } from './martial';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

const value = (state: GameState, key: string) =>
  key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

export function questDef(content: Content, id: string): MartialQuestDef | undefined {
  return content.martial.quests.find((q) => q.id === id);
}

/** The chain that leads out of the martial stage the life stands at, if any. */
export function questForStage(state: GameState, content: Content): MartialQuestDef | undefined {
  return content.martial.quests.find((q) => q.fromStage === state.martial.stage);
}

const canQuest = (state: GameState) => state.alive && state.cult.realm === 'pham_nhan';

/**
 * Yearly: a chain begins the year after its stage was reached; a chain whose stage was left by
 * other means (a kỳ ngộ) is dropped. Nothing is random.
 */
export function martialQuestYear(state: GameState, content: Content): GameState {
  if (!canQuest(state)) return state;
  const m = state.martial;
  const def = questForStage(state, content);
  if (m.quest) {
    const own = questDef(content, m.quest.id);
    if (own && own.fromStage === m.stage) return state;
    return { ...state, martial: { ...m, quest: null } };
  }
  if (!def || m.done?.includes(def.id)) return state;
  if (state.character.age < (m.reachedAt ?? 0) + content.balance.martial.quest.startDelay) return state;
  const quest: MartialQuest = { id: def.id, step: 0, startedAt: state.character.age, lastTry: null, game: null };
  return { ...state, martial: { ...m, quest }, log: addLines(state, [{ text: def.start, tone: 'rare' }]) };
}

export interface QuestView {
  quest: MartialQuestDef;
  stepIndex: number;
  total: number;
  step: MartialStep;
  /** Why the step cannot be tried now. */
  blocked: string | null;
  /** The chance of a check step. */
  chance: number | null;
  aid: { item: string; name: string; text: string; have: boolean } | null;
  /** A mini-game in progress. */
  playing: boolean;
}

function checkChance(state: GameState, content: Content, step: MartialStep, aided: boolean): number | null {
  if (!step.check) return null;
  const c = content.balance.martial.quest;
  const avg = step.check.stats.reduce((sum, k) => sum + value(state, k), 0) / step.check.stats.length;
  const p = c.check.base + (avg - step.check.difficulty) * c.check.perPoint + (aided ? c.aidChance : 0);
  return Math.max(c.check.min, Math.min(c.check.max, p));
}

export function questView(state: GameState, content: Content): QuestView | null {
  const q = state.martial.quest;
  if (!q || !canQuest(state)) return null;
  const quest = questDef(content, q.id);
  const step = quest?.steps[q.step];
  if (!quest || !step) return null;
  const aid = step.aid ? { item: step.aid.item, name: itemById(content, step.aid.item)?.name ?? step.aid.item, text: step.aid.text, have: (state.inventory[step.aid.item] ?? 0) > 0 } : null;
  const blocked = q.game ? 'Đang trong ải.' : q.lastTry === state.character.age ? 'Năm nay đã thử một ải rồi, sang năm làm tiếp.' : null;
  return { quest, stepIndex: q.step, total: quest.steps.length, step, blocked, chance: checkChance(state, content, step, false), aid, playing: !!q.game };
}

// ---------- Mini-games ----------

const BASIC = (content: Content) => content.cultivation.roots.elements.filter((e) => !e.variant);

function newGame(content: Content, step: MartialStep, aided: boolean, rng: Rng): MiniGame {
  const cfg = content.balance.martial.quest;
  const level = cfg.levels[`${step.game}_${step.level ?? 1}`];
  const allowed = level.allowed + (aided ? cfg.aidAllowed : 0);
  if (step.game === 'ngu_hanh') {
    const basic = BASIC(content);
    const mode = rng.chance(0.5) ? 'sinh' : 'khac';
    const next = (id: string) => (mode === 'sinh' ? content.balance.coreForming.generates[id] : basic.find((e) => e.id === id)?.beats.find((b) => basic.some((x) => x.id === b)));
    const target = [rng.pick(basic).id];
    while (target.length < Math.min(level.length, basic.length)) target.push(next(target[target.length - 1])!);
    // The first stone is given. Nothing to memorise, so input is open at once.
    return { kind: 'ngu_hanh', mode, target, input: [target[0]], mistakes: 0, allowed, shown: false, aided };
  }
  const symbols = Object.keys(content.martial.games.symbols);
  const target = Array.from({ length: level.length }, () => rng.pick(symbols));
  return { kind: 'dieu_tuc', target, input: [], mistakes: 0, allowed, shown: true, aided };
}

/** The symbols a game offers as buttons, in order. */
export function gameSymbols(game: MiniGame, content: Content): { id: string; name: string }[] {
  if (game.kind === 'ngu_hanh') return BASIC(content).map((e) => ({ id: e.id, name: e.name }));
  return Object.entries(content.martial.games.symbols).map(([id, name]) => ({ id, name }));
}

/** End the current step as won or lost (also used by developer mode). */
export function finishStep(state: GameState, content: Content, win: boolean): { state: GameState; text: string } {
  const q = state.martial.quest!;
  const def = questDef(content, q.id)!;
  const step = def.steps[q.step];
  const cfg = content.balance.martial.quest;
  const m = content.martial.games;
  const age = state.character.age;
  if (!win) {
    const text = `${m.lose} ${step.lose}`;
    const s: GameState = {
      ...state,
      stats: { ...state.stats, health: clamp(state.stats.health - cfg.loseHealth) },
      martial: { ...state.martial, quest: { ...q, game: null, lastTry: age } },
    };
    return { state: { ...s, log: addLines(s, [{ text, tone: 'bad' }]) }, text };
  }
  const last = q.step + 1 >= def.steps.length;
  let s: GameState = {
    ...state,
    aptitudes: { ...state.aptitudes, daoHeart: clamp(state.aptitudes.daoHeart + cfg.winDaoHeart) },
    martial: { ...state.martial, quest: { ...q, step: q.step + 1, game: null, lastTry: age } },
  };
  const lines: LogLine[] = [{ text: `${m.win} ${step.win}`, tone: 'good' }];
  if (last) lines.push({ text: def.done, tone: 'rare' });
  s = { ...s, log: addLines(s, lines) };
  if (last) {
    s = { ...s, martial: { ...s.martial, quest: null, done: [...(s.martial.done ?? []), def.id] } };
    s = martialPromote(s, content);
  }
  return { state: s, text: lines.map((l) => l.text).join(' ') };
}

/**
 * Do this year's step. A check resolves at once; a mini-game opens (`quest.game`) and ends through
 * `miniGameInput`. `useAid` spends the step's aid item if the life has one.
 */
export function beginQuestStep(state: GameState, content: Content, useAid: boolean): { state: GameState; text: string } | null {
  const view = questView(state, content);
  if (!view || view.blocked) return null;
  const q = state.martial.quest!;
  const aided = useAid && !!view.aid?.have;
  let s: GameState = aided ? removeItems(state, [view.aid!.item]) : state;
  const rng = Rng.fromState(s.rng);
  if (view.step.check) {
    const ok = rng.chance(checkChance(s, content, view.step, aided)!);
    s = { ...s, rng: rng.getState() };
    return finishStep(s, content, ok);
  }
  const game = newGame(content, view.step, aided, rng);
  s = { ...s, rng: rng.getState(), martial: { ...s.martial, quest: { ...q, game } } };
  return { state: s, text: '' };
}

/** The dieu_tuc pattern is hidden once the player says it is memorised. */
export function miniGameHide(state: GameState): GameState {
  const q = state.martial.quest;
  if (!q?.game || !q.game.shown) return state;
  return { ...state, martial: { ...state.martial, quest: { ...q, game: { ...q.game, shown: false } } } };
}

/** Enter one symbol: a wrong one costs a mistake; the game ends on the last symbol or too many mistakes. */
export function miniGameInput(state: GameState, content: Content, symbol: string): { state: GameState; done: boolean; text: string } {
  const q = state.martial.quest;
  const g = q?.game;
  if (!q || !g || g.shown) return { state, done: false, text: '' };
  const right = g.target[g.input.length] === symbol;
  const game: MiniGame = right ? { ...g, input: [...g.input, symbol] } : { ...g, mistakes: g.mistakes + 1 };
  const lost = game.mistakes > game.allowed;
  const won = game.input.length >= game.target.length;
  const next: GameState = { ...state, martial: { ...state.martial, quest: { ...q, game } } };
  if (!lost && !won) return { state: next, done: false, text: '' };
  const r = finishStep(next, content, won && !lost);
  return { ...r, done: true };
}

/** Walk away from the ải: counts as a failed try. */
export function miniGameQuit(state: GameState, content: Content): { state: GameState; text: string } {
  if (!state.martial.quest?.game) return { state, text: '' };
  return finishStep(state, content, false);
}
