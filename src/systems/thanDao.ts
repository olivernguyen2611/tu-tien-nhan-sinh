// 9.S5 Đường thành thần / thành tiên cuối đời: Công đức, Hương hỏa, Long khí, Văn đạo. Not a cultivation realm:
// points earned by how the life is lived (yearly sources) and by events (`merit`), milestones on the way,
// and once past the threshold (and old enough) an event that lets the life end as a god or immortal (a flag
// read by endings.json). Close to the end of life with only half the points: the miss event.
// Any life, mortal or cultivator. Content in worlds/<id>/than-dao.json.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { applyOutcome } from './events/engine';
import { meets, type Conditions } from './events/conditions';

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

export interface MeritView { id: string; name: string; text: string; points: number; threshold: number; done: boolean }

/** Paths this life has started on (points > 0). */
export function meritViews(state: GameState, content: Content): MeritView[] {
  return (content.thanDao?.paths ?? []).filter((p) => (state.merit?.points[p.id] ?? 0) > 0).map((p) => ({
    id: p.id, name: p.name, text: p.text, points: Math.floor(state.merit!.points[p.id]), threshold: p.threshold,
    done: !!state.merit?.marks.includes(`${p.id}:ascend`),
  }));
}

/** One year: points from how the life is lived, milestones, and the ascend or miss event when due. */
export function thanDaoYear(state: GameState, content: Content): GameState {
  const file = content.thanDao;
  if (!file || !state.alive) return state;
  const age = state.character.age;
  const points = { ...state.merit?.points };
  for (const p of file.paths) {
    const add = p.sources.reduce((n, src) => n + (meets(state, src.when as Conditions, content) ? src.add : 0), 0);
    if (add !== 0) points[p.id] = Math.max(0, (points[p.id] ?? 0) + add);
  }
  if (!state.merit && Object.keys(points).length === 0) return state;
  let s: GameState = { ...state, merit: { points, marks: state.merit?.marks ?? [] } };
  const rng = new Rng(`${state.seed}:than:${age}`);
  for (const p of file.paths) {
    const v = points[p.id] ?? 0;
    const marks = s.merit!.marks;
    for (const m of p.milestones) {
      const key = `${p.id}:${m.at}`;
      if (v < m.at || marks.includes(key)) continue;
      s = { ...s, merit: { ...s.merit!, marks: [...s.merit!.marks, key] } };
      const r = applyOutcome(s, content, m, rng);
      s = pushLines(r.state, [{ text: `${p.name}: ${r.text}`, tone: 'rare' }]);
    }
    const done = (k: string) => s.merit!.marks.includes(`${p.id}:${k}`);
    const mark = (k: string, event: string) => ({ ...s, merit: { ...s.merit!, marks: [...s.merit!.marks, `${p.id}:${k}`] }, events: { ...s.events, followUps: [{ event, atAge: age }, ...s.events.followUps] } });
    if (done('ascend') || done('miss')) continue;
    if (v >= p.threshold && age >= p.minAge) s = mark('ascend', p.ascendEvent);
    else if (v >= p.threshold / 2 && s.cult.lifespan - age <= file.missWindow) s = mark('miss', p.missEvent);
  }
  return s;
}
