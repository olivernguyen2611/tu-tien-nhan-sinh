// 9.S2 Hệ thống: a voice in the head bound by a special origin (special-origins `system`). Yearly điểm danh,
// tasks with a deadline (goal = event conditions), a shop paid in points (negative cost = sell lifespan,
// luck… for points), levels by points that act all life. 9.S2b: a trap system drops clues, then betrays
// at a realm or age unless cut off first. Own seed stream `${seed}:sys:${age}`. Content in systems.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook, SystemDef } from '../core/schemas';
import type { GameState, LogLine, Tone } from '../core/types';
import { applyOutcome } from './events/engine';
import { meets, type Conditions } from './events/conditions';

type Sys = NonNullable<GameState['system']>;

export const systemDef = (content: Content, id: string | undefined) => (content.systems ?? []).find((s) => s.id === id);

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

const say = (def: SystemDef, text: string) => `${def.voice} ${text}`;

/** Level index reached with these points. */
export const levelFor = (def: SystemDef, points: number) => Math.max(0, def.levels.reduce((n, l, i) => (points >= l.points ? i : n), 0));

/** Bind a system to the life (from a special origin). */
export function bindSystem(state: GameState, content: Content, id: string): GameState {
  const def = systemDef(content, id);
  if (!def || state.system) return state;
  const sys: Sys = { id, points: 0, level: 0, task: null, checkin: null, bought: {}, done: [], gone: false, clues: 0 };
  return pushLines({ ...state, system: sys }, [{ text: say(def, def.text), tone: 'rare' }]);
}

const live = (state: GameState, content: Content): [Sys, SystemDef] | null => {
  const sys = state.system;
  const def = systemDef(content, sys?.id);
  return sys && def && !sys.gone && state.alive ? [sys, def] : null;
};

/** Hooks of the system's current level (lifeHooks); gone once cut off. */
export function systemHooks(state: GameState, content: Content): EffectHook[] {
  const l = live(state, content);
  return l ? l[1].levels.slice(0, l[0].level + 1).flatMap((x) => x.effects) : [];
}

function gain(state: GameState, def: SystemDef, points: number): GameState {
  const sys = state.system!;
  const total = Math.max(0, sys.points + points);
  const level = Math.max(sys.level, levelFor(def, total));
  let s: GameState = { ...state, system: { ...sys, points: total, level } };
  for (let i = sys.level + 1; i <= level; i++) s = pushLines(s, [{ text: say(def, `Thăng cấp: ${def.levels[i].name}.`), tone: 'rare' }]);
  return s;
}

function outcome(state: GameState, content: Content, def: SystemDef, o: { text: string; effects: SystemDef['quit']['effects'] }, rng: Rng, tone: Tone): GameState {
  const r = applyOutcome(state, content, o, rng);
  return pushLines(r.state, [{ text: say(def, r.text), tone }]);
}

/** One year: the task is checked, a new one may be given, a trap drops a clue or betrays. */
export function systemYear(state: GameState, content: Content): GameState {
  const l = live(state, content);
  if (!l) return state;
  let [sys, def] = l;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:sys:${age}`);
  let s = state;
  // 9.S2b: the trap springs.
  const at = def.trap?.betrayAt;
  if (def.trap && at && ((at.age !== undefined && age >= at.age) || (at.realm && meets(s, { realm: { min: at.realm } } as Conditions, content)))) {
    s = outcome(s, content, def, def.trap.betray, rng, 'bad');
    return { ...s, system: { ...s.system!, gone: true, task: null } };
  }
  if (def.trap && rng.chance(def.trap.clueChance)) {
    const clue = def.trap.clues[Math.min(sys.clues, def.trap.clues.length - 1)];
    s = pushLines({ ...s, system: { ...sys, clues: sys.clues + 1 } }, [{ text: clue, tone: 'normal' }]);
    sys = s.system!;
  }
  if (sys.task) {
    const task = def.tasks.find((t) => t.id === sys.task!.id);
    if (!task) s = { ...s, system: { ...sys, task: null } };
    else if (meets(s, task.goal as Conditions, content)) {
      s = outcome({ ...s, system: { ...sys, task: null, done: [...sys.done, task.id] } }, content, def, task.reward, rng, 'good');
      s = gain(s, def, task.points);
    } else if (age > sys.task.until) {
      s = outcome({ ...s, system: { ...sys, task: null } }, content, def, task.fail, rng, 'bad');
    }
    return s;
  }
  const open = def.tasks.filter((t) => sys.level >= t.minLevel && !sys.done.includes(t.id) && meets(s, t.when as Conditions, content) && !meets(s, t.goal as Conditions, content));
  if (open.length > 0 && rng.chance(def.taskChance)) {
    const t = rng.pick(open);
    s = pushLines({ ...s, system: { ...sys, task: { id: t.id, until: age + t.years } } }, [{ text: say(def, `Nhiệm vụ: ${t.text} (hạn ${t.years} năm).`), tone: 'rare' }]);
  }
  return s;
}

export interface SystemActionView { id: string; name: string; text: string; cost: number; blocked: string | null }

/** What the panel offers this year: điểm danh, each shop line, đoạn tuyệt. */
export function systemActions(state: GameState, content: Content): SystemActionView[] {
  const l = live(state, content);
  if (!l) return [];
  const [sys, def] = l;
  const age = state.character.age;
  const minAge = content.balance.goldenFinger.actionMinAge;
  const young = age < minAge ? 'Còn nhỏ quá, chưa hiểu chuyện.' : null;
  const views: SystemActionView[] = [];
  if (def.checkin) views.push({ id: 'checkin', name: 'Điểm danh', text: `Mỗi năm một lần, nhận ${def.checkin.points} điểm và một phần thưởng ngẫu nhiên.`, cost: 0, blocked: young ?? (sys.checkin === age ? 'Năm nay đã điểm danh.' : null) });
  for (const item of def.shop) {
    const last = sys.bought[item.id];
    const wait = last === undefined ? 0 : last + item.cooldownYears - age;
    views.push({
      id: `shop:${item.id}`, name: item.name, text: item.text, cost: item.cost,
      blocked: young ?? (sys.level < item.minLevel ? `Cần cấp "${def.levels[item.minLevel].name}".`
        : item.cost > sys.points ? `Thiếu ${item.cost - sys.points} điểm.`
        : wait > 0 ? (item.cooldownYears === 1 ? 'Năm nay đã đổi rồi.' : `Còn ${wait} năm nữa.`) : null),
    });
  }
  views.push({ id: 'quit', name: 'Đoạn tuyệt', text: 'Cắt đứt với hệ thống, mất hết điểm và cấp. Không thể quay lại.', cost: 0, blocked: young });
  return views;
}

/** Use one panel action. */
export function doSystemAction(state: GameState, content: Content, actionId: string): { state: GameState; text: string; tone: Tone } | null {
  const l = live(state, content);
  const view = systemActions(state, content).find((v) => v.id === actionId);
  if (!l || !view || view.blocked) return null;
  const [sys, def] = l;
  const rng = Rng.fromState(state.rng);
  const age = state.character.age;
  let s: GameState;
  let tone: Tone = 'rare';
  if (actionId === 'checkin' && def.checkin) {
    const pool = def.checkin.rewards.filter((r) => sys.level >= r.minLevel);
    const reward = rng.weighted(pool, (r) => r.weight);
    s = outcome({ ...state, system: { ...sys, checkin: age } }, content, def, reward, rng, 'good');
    s = gain(s, def, def.checkin.points);
  } else if (actionId === 'quit') {
    s = outcome({ ...state, system: { ...sys, gone: true, task: null } }, content, def, def.quit, rng, 'normal');
    tone = 'normal';
  } else {
    const item = def.shop.find((x) => `shop:${x.id}` === actionId)!;
    s = outcome({ ...state, system: { ...sys, bought: { ...sys.bought, [item.id]: age } } }, content, def, item.result, rng, 'rare');
    s = gain(s, def, -item.cost);
  }
  const lines = s.log[s.log.length - 1]?.lines ?? [];
  return { state: { ...s, rng: rng.getState() }, text: lines[lines.length - 1]?.text ?? '', tone };
}
