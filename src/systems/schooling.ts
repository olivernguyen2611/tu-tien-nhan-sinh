// 10.1 Tuổi thơ và học hành: giai đoạn tuổi, học đường (học lực 0–100, thầy đồ và bạn học là người quen
// thật), học nghề dưới tay một người thầy. Schools, trades and texts: content/schooling.json; numbers:
// balance.schooling. The yearly part rolls on its own stream (seed:school:age).
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { createNpc } from './npcs';

type School = NonNullable<GameState['school']>;
type Trade = NonNullable<GameState['trade']>;

const EMPTY_SCHOOL: School = { at: null, since: null, grade: 0, teacher: null, ever: false };
const EMPTY_TRADE: Trade = { id: null, level: 0, years: 0, master: null, learning: false };
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fill = (t: string, ctx: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => String(ctx[k] ?? m));

export const schoolOf = (state: GameState): School => state.school ?? EMPTY_SCHOOL;
export const tradeOf = (state: GameState): Trade => state.trade ?? EMPTY_TRADE;

/** Giai đoạn tuổi of an age (sơ sinh, nhi đồng, thiếu niên, trưởng thành). */
export function lifeStage(content: Content, age: number): { id: string; name: string } | null {
  const stages = content.schooling?.stages ?? [];
  return stages.find((s) => s.maxAge === undefined || age <= s.maxAge) ?? null;
}

export function schoolDef(content: Content, id: string | null | undefined) {
  return content.schooling?.schools.find((s) => s.id === id);
}

export function tradeDef(content: Content, id: string | null | undefined) {
  return content.schooling?.trades.find((t) => t.id === id);
}

/** Months the school or the apprenticeship takes this year. */
export function schoolMonths(state: GameState, content: Content): number {
  const school = schoolDef(content, schoolOf(state).at)?.months ?? 0;
  const trade = tradeOf(state).learning ? content.balance.schooling?.tradeMonths ?? 0 : 0;
  return school + trade;
}

function pushLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return log;
}

/** Meet someone on a side stream: the life's own rng stays where it was. */
function meetAside(state: GameState, content: Content, rng: Rng, spec: Parameters<typeof createNpc>[2]): { state: GameState; id: string } {
  const met = createNpc({ ...state, rng: rng.getState() }, content, spec);
  return { state: { ...met.state, rng: state.rng }, id: met.id };
}

/** Enter a school: a teacher (thầy đồ) and classmates become real acquaintances. */
export function enrollSchool(state: GameState, content: Content, schoolId: string): GameState {
  const def = schoolDef(content, schoolId);
  const cfg = content.balance.schooling;
  if (!def || !cfg || schoolOf(state).at === def.id) return state;
  const rng = new Rng(`${state.seed}:school-in:${state.character.age}`);
  const teacher = meetAside(state, content, rng, { role: def.teacherRole, kind: 'thay', age: state.character.age + rng.int(30, 50), affinity: 50, root: false });
  let s = teacher.state;
  for (let i = 0; i < cfg.classmates; i++) {
    s = meetAside(s, content, rng, { role: def.classmateRole, kind: 'ban_huu', peer: true, affinity: rng.int(40, 60), root: false }).state;
  }
  const name = s.npcs.find((n) => n.id === teacher.id)?.name ?? '';
  const school: School = { ...schoolOf(s), at: def.id, since: s.character.age, teacher: teacher.id, ever: true };
  s = { ...s, school, flags: { ...s.flags, di_hoc: true } };
  const text = content.schooling?.texts.enroll;
  return text ? { ...s, log: pushLines(s, [{ text: fill(text, { school: def.name, teacher: name }), tone: 'good' }]) } : s;
}

export function leaveSchool(state: GameState): GameState {
  return { ...state, school: { ...schoolOf(state), at: null, since: null } };
}

/** Take up a trade under a master (thầy dạy nghề). */
export function startTrade(state: GameState, content: Content, tradeId: string): GameState {
  const def = tradeDef(content, tradeId);
  if (!def || tradeOf(state).id === def.id) return state;
  const rng = new Rng(`${state.seed}:trade-in:${state.character.age}`);
  const master = meetAside(state, content, rng, { role: def.masterRole, kind: 'thay', age: state.character.age + rng.int(20, 40), affinity: 50, root: false });
  const name = master.state.npcs.find((n) => n.id === master.id)?.name ?? '';
  const s: GameState = { ...master.state, trade: { id: def.id, level: 0, years: 0, master: master.id, learning: true } };
  const text = content.schooling?.texts.tradeStart;
  return text ? { ...s, log: pushLines(s, [{ text: fill(text, { trade: def.name, master: name, level: def.levels[0] }), tone: 'good' }]) } : s;
}

/** Gain (or lose) levels of the trade; the last level ends the apprenticeship. */
export function addTradeLevel(state: GameState, content: Content, delta: number): GameState {
  const t = tradeOf(state);
  const def = tradeDef(content, t.id);
  if (!def || delta === 0) return state;
  const level = Math.max(0, Math.min(def.levels.length - 1, t.level + delta));
  if (level === t.level) return state;
  let s: GameState = { ...state, trade: { ...t, level, years: 0, learning: t.learning && level < def.levels.length - 1 } };
  // A thợ chính counts as knowing the trade (balance.crafts start levels read the flag).
  if (def.flag && level >= 2) s = { ...s, flags: { ...s.flags, [def.flag]: true } };
  const text = content.schooling?.texts.tradeLevel;
  return delta > 0 && text ? { ...s, log: pushLines(s, [{ text: fill(text, { trade: def.name, level: def.levels[level] }), tone: 'good' }]) } : s;
}

export function addGrade(state: GameState, delta: number): GameState {
  const sc = schoolOf(state);
  return { ...state, school: { ...sc, grade: clamp(Math.round((sc.grade + delta) * 10) / 10) } };
}

/** One year of school and apprenticeship. */
export function schoolYear(state: GameState, content: Content): GameState {
  const cfg = content.balance.schooling;
  const file = content.schooling;
  if (!cfg || !file || !state.alive) return state;
  const age = state.character.age;
  let s = state;
  const lines: LogLine[] = [];
  const sc = schoolOf(s);
  const def = schoolDef(content, sc.at);
  if (def) {
    if (age >= cfg.leaveAge) {
      s = leaveSchool(s);
      lines.push({ text: fill(file.texts.leave, { school: def.name, grade: Math.round(sc.grade) }), tone: 'normal' });
    } else if (s.money.silver < def.fee) {
      s = leaveSchool(s);
      lines.push({ text: fill(file.texts.dropOut, { school: def.name }), tone: 'bad' });
    } else {
      const gain = cfg.gradeBase + s.stats.intellect * cfg.intellectWeight;
      s = addGrade({ ...s, money: { ...s.money, silver: s.money.silver - def.fee } }, gain);
    }
  }
  const t = tradeOf(s);
  const tdef = tradeDef(content, t.id);
  if (tdef && t.learning) {
    const years = t.years + 1;
    s = { ...s, trade: { ...t, years } };
    const need = cfg.tradeYears[Math.min(t.level, cfg.tradeYears.length - 1)];
    const rng = new Rng(`${s.seed}:school:${age}`);
    const chance = cfg.tradeChance.base + (s.aptitudes.physique + s.aptitudes.comprehension) * cfg.tradeChance.weight;
    if (years >= need && rng.chance(Math.min(0.95, chance))) s = addTradeLevel(s, content, 1);
  }
  return lines.length ? { ...s, log: pushLines(s, lines) } : s;
}

/** "Trường làng, học lực 42" / "Nghề rèn: Thợ phụ" for the profile. */
export function schoolLine(state: GameState, content: Content): string | null {
  const sc = schoolOf(state);
  const def = schoolDef(content, sc.at);
  if (def) return `${def.name}, học lực ${Math.round(sc.grade)}`;
  return sc.ever ? `Đã thôi học, học lực ${Math.round(sc.grade)}` : null;
}

export function tradeLine(state: GameState, content: Content): string | null {
  const t = tradeOf(state);
  const def = tradeDef(content, t.id);
  return def ? `${def.name}: ${def.levels[t.level]}${t.learning ? ' (đang theo thầy)' : ''}` : null;
}
