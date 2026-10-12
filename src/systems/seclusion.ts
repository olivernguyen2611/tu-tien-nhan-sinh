// Bế quan (task 4.1): close the door for some years. Cultivation runs ×1.5
// (PLAN G.1) and no ordinary event comes (only a rare "be_quan" kỳ ngộ that opens the door), but the years pass: family
// age and may die, lover and đạo lữ grow distant. The door opens early when
// the realm's peak is reached or lifespan runs short.
import type { Content } from '../core/content';
import { advanceYear } from '../core/state';
import type { GameState, LogLine } from '../core/types';
import { changeNpc } from './npcs';

export interface SeclusionView {
  options: number[];
  blocked: string | null;
}

function atPeak(state: GameState, content: Content): boolean {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  return !!realm && state.cult.stage >= realm.stages.length - 1 && state.cult.progress >= 100;
}

export function seclusionView(state: GameState, content: Content): SeclusionView {
  const options = content.balance.seclusion.options[state.cult.realm] ?? [];
  if (!state.alive || options.length === 0) return { options: [], blocked: 'Chưa vào Luyện Khí' };
  if (state.events.pending || state.fate || state.combat) return { options, blocked: 'Còn việc chưa xong' };
  if (atPeak(state, content)) return { options, blocked: 'Tu vi đã viên mãn, cần đột phá' };
  return { options, blocked: null };
}

function line(state: GameState, l: LogLine): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, l] };
  return { ...state, log };
}

const fill = (text: string, state: GameState, content: Content, years: number) => {
  const realm = content.cultivation.realms.realms.find((r) => r.id === state.cult.realm);
  return text
    .replace(/\{years\}/g, String(years))
    .replace(/\{realm\}/g, realm?.name ?? '')
    .replace(/\{stage\}/g, realm?.stages[state.cult.stage] ?? '');
};

/** Start a seclusion of `years` (one of the options), and run it. */
export function seclude(state: GameState, content: Content, years: number): GameState {
  const view = seclusionView(state, content);
  if (view.blocked || !view.options.includes(years)) return state;
  return startSeclusion(state, content, years);
}

/** Close the door (also used by the seclusionYears event effect) and run the years. */
export function startSeclusion(state: GameState, content: Content, years: number): GameState {
  if (!state.alive || state.cult.realm === 'pham_nhan') return state;
  const age = state.character.age;
  const s = line({ ...state, seclusion: { until: age + years, since: age } }, { text: fill(content.cultivation.realms.texts.seclusionStart, state, content, years), tone: 'normal' });
  return runSeclusion(s, content);
}

/** Pass the years of a seclusion in progress; open the door when it ends or must end early. */
export function runSeclusion(state: GameState, content: Content): GameState {
  if (!state.seclusion) return state;
  const { since, until, fixed } = state.seclusion;
  const texts = content.cultivation.realms.texts;
  const cfg = content.balance.seclusion;
  let s = state;
  let early: string | null = null;
  while (s.alive && s.character.age < until) {
    const next = advanceYear(s, content);
    // A talent choice or a fight came up: the door stays shut until it is dealt with.
    if (next === s) return s;
    s = next;
    for (const id of [s.romance.lover, s.romance.partner]) if (id) s = changeNpc(s, content, id, { affinity: cfg.lonelyAffinity });
    if (s.fate || s.combat) return s;
    // Playtest 2026-10-12: a kỳ ngộ or trouble broke in; the door opens to answer it.
    if (s.events.pending) {
      return line({ ...s, seclusion: null }, { text: fill(texts.seclusionInterrupted, s, content, s.character.age - since), tone: 'rare' });
    }
    if (!fixed && atPeak(s, content)) { early = texts.seclusionPeak; break; }
    if (s.cult.lifespan - s.character.age <= cfg.lifespanStop) { early = texts.seclusionLifespan; break; }
  }
  if (!s.alive) return { ...s, seclusion: null };
  if (early) s = line(s, { text: early, tone: 'normal' });
  return line({ ...s, seclusion: null }, { text: fill(texts.seclusionEnd, s, content, s.character.age - since), tone: 'good' });
}
