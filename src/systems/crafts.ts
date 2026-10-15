// Bách nghệ (task 2.12, realms-roots-paths.md D): levels 0–100 grown by practice,
// one practice a year. Mortals may learn the crafts marked "mortal" (Luyện Đan,
// Linh Thực); the rest need a cultivator. Jobs give starting levels.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { hookSum } from './cultivation';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function craftDef(content: Content, id: string) {
  return content.cultivation.aptitudes.crafts.find((c) => c.id === id);
}

/** "Học đồ luyện đan", "Đan Sư", "Đại Đan Sư"… */
export function craftTitle(content: Content, craftId: string, level: number): string {
  const craft = craftDef(content, craftId);
  if (!craft) return craftId;
  let title = content.cultivation.aptitudes.craftTitles[0].title;
  for (const t of content.cultivation.aptitudes.craftTitles) if (level >= t.minLevel) title = t.title;
  return title.replaceAll('{craft}', craft.name.toLocaleLowerCase('vi')).replaceAll('{prefix}', craft.prefix);
}

export interface CraftView {
  id: string;
  name: string;
  level: number;
  title: string;
  cost: number;
  /** Why it cannot be practised now; null = it can. */
  blocked: string | null;
}

/** Crafts this life can see: the mortal ones always, all of them once cultivating. */
export function craftViews(state: GameState, content: Content): CraftView[] {
  const cultivator = state.cult.realm !== 'pham_nhan';
  const cfg = content.balance.crafts;
  return content.cultivation.aptitudes.crafts
    .filter((c) => c.mortal || cultivator || (state.crafts.skills[c.id]?.level ?? 0) > 0)
    .map((c) => {
      const level = state.crafts.skills[c.id]?.level ?? 0;
      const cost = cfg.practiceCost[c.id] ?? 0;
      let blocked: string | null = null;
      if (!state.alive) blocked = 'Đã hết một đời.';
      else if (state.character.age < cfg.minAge) blocked = `Đủ ${cfg.minAge} tuổi mới học được.`;
      else if (!c.mortal && !cultivator) blocked = 'Cần có tu vi mới học được.';
      else if (state.crafts.lastPractice === state.character.age) blocked = 'Năm nay đã luyện một nghề rồi.';
      else if (level >= 100) blocked = 'Đã tới đỉnh.';
      else if (state.money.silver < cost) blocked = `Cần ${cost} lượng bạc mua nguyên liệu.`;
      return { id: c.id, name: c.name, level, title: craftTitle(content, c.id, level), cost, blocked };
    });
}

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

/** First touch of a craft: roll its aptitude (plus craft.<id>.affinity hooks). */
function skillOf(state: GameState, content: Content, id: string, rng: Rng) {
  const known = state.crafts.skills[id];
  if (known) return known;
  const [lo, hi] = content.balance.crafts.startAffinity;
  return { level: 0, affinity: clamp(rng.int(lo, hi) + hookSum(state, content, `craft.${id}.affinity`) + hookSum(state, content, 'craft.all.affinity')) };
}

/** Practise a craft for this year. Returns null when it cannot be done now. */
export function practiceCraft(state: GameState, content: Content, craftId: string): { state: GameState; text: string } | null {
  const view = craftViews(state, content).find((v) => v.id === craftId);
  const craft = craftDef(content, craftId);
  if (!view || view.blocked || !craft) return null;
  const cfg = content.balance.crafts;
  const texts = content.cultivation.aptitudes;
  const rng = Rng.fromState(state.rng);
  const skill = skillOf(state, content, craftId, rng);
  const gain = Math.max(1, Math.round(cfg.practiceBase * (0.5 + skill.affinity / 100) * (0.5 + state.aptitudes.comprehension / 100)));
  const level = Math.min(100, skill.level + gain);
  const affinity = clamp(skill.affinity + cfg.affinityPerPractice);

  const name = craft.name.toLocaleLowerCase('vi');
  const lines: LogLine[] = [{ text: texts.practiceText.replaceAll('{craft}', name).replaceAll('{from}', String(skill.level)).replaceAll('{to}', String(level)), tone: 'normal' }];
  const before = craftTitle(content, craftId, skill.level);
  const after = craftTitle(content, craftId, level);
  if (after !== before) lines.push({ text: texts.titleUpText.replaceAll('{title}', after), tone: 'good' });

  const next: GameState = {
    ...state,
    rng: rng.getState(),
    money: { ...state.money, silver: state.money.silver - view.cost },
    crafts: { skills: { ...state.crafts.skills, [craftId]: { level, affinity } }, lastPractice: state.character.age },
  };
  return { state: { ...next, log: addLines(next, lines) }, text: lines.map((l) => l.text).join(' ') };
}

/**
 * Jobs set starting levels (balance.crafts): mortal ones as soon as the job flag
 * is set, cultivator ones once the life cultivates. Runs each year; idempotent.
 */
export function applyJobCrafts(state: GameState, content: Content): GameState {
  const cfg = content.balance.crafts;
  const tables = state.cult.realm === 'pham_nhan' ? [cfg.mortalStartLevel] : [cfg.mortalStartLevel, cfg.cultivatorStartLevel];
  const rng = Rng.fromState(state.rng);
  let s = state;
  const lines: LogLine[] = [];
  for (const table of tables) {
    for (const [flag, levels] of Object.entries(table)) {
      if (!s.flags[flag]) continue;
      for (const [craftId, start] of Object.entries(levels)) {
        const skill = skillOf(s, content, craftId, rng);
        if (skill.level >= start) continue;
        s = { ...s, crafts: { ...s.crafts, skills: { ...s.crafts.skills, [craftId]: { ...skill, level: start } } } };
        const craft = craftDef(content, craftId);
        lines.push({ text: content.cultivation.aptitudes.jobStartText.replaceAll('{craft}', craft?.name ?? craftId).replaceAll('{to}', String(start)), tone: 'good' });
      }
    }
  }
  if (s === state) return state;
  return { ...s, rng: rng.getState(), log: addLines(s, lines) };
}

/** Craft levels from an event (task 2.8); the craft's aptitude is rolled if new. */
export function addCraftXp(state: GameState, content: Content, craftId: string, levels: number): GameState {
  if (!craftDef(content, craftId) || levels === 0) return state;
  const rng = Rng.fromState(state.rng);
  const skill = skillOf(state, content, craftId, rng);
  const level = Math.max(0, Math.min(100, skill.level + levels));
  return { ...state, rng: rng.getState(), crafts: { ...state.crafts, skills: { ...state.crafts.skills, [craftId]: { ...skill, level } } } };
}
