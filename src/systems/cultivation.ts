// Cultivation (GĐ 2). Task 2.2: the spirit-root test and how a root is shown.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, SpiritRoot } from '../core/types';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** One roll: grade by weight, then its elements (or a special body). */
function rollOnce(rng: Rng, content: Content): SpiritRoot {
  const cfg = content.balance.roots;
  const { grades, elements, bodies } = content.cultivation.roots;
  const grade = rng.weighted(grades, (g) => cfg.gradeWeights[g.id] ?? 0);
  const count = cfg.elementCount[grade.id] ?? 0;
  if (grade.special === 'body') return { grade: grade.id, elements: [], body: rng.weighted(bodies, (b) => cfg.bodyWeights[b.id] ?? 0).id };
  const kind = elements.filter((e) => e.variant === (grade.special === 'variant')).map((e) => e.id);
  return { grade: grade.id, elements: pickElements(rng, kind, count), body: null };
}

/** `count` distinct elements, kept in content order (Kim Mộc Thủy Hỏa Thổ). */
function pickElements(rng: Rng, from: string[], count: number): string[] {
  const pool = from.slice();
  const picked: string[] = [];
  while (picked.length < Math.min(count, from.length)) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return from.filter((e) => picked.includes(e));
}

/** Roll `rolls` times and keep the root with the highest cultivation speed. */
export function rollRoot(rng: Rng, content: Content, rolls = 1): SpiritRoot {
  const speed = (r: SpiritRoot) => content.balance.roots.gradeSpeed[r.grade] ?? 0;
  let best = rollOnce(rng, content);
  for (let i = 1; i < rolls; i++) {
    const next = rollOnce(rng, content);
    if (speed(next) > speed(best)) best = next;
  }
  return best;
}

/** Age at which this life meets the root test: from its own seed so other rolls stay unchanged. */
export function rootTestAge(seed: string, content: Content): number {
  const [lo, hi] = content.balance.roots.testAge;
  return new Rng(`${seed}:root-test`).int(lo, hi);
}

/** "Song linh căn (Kim, Hỏa)", "Cửu Dương Thể"… */
export function rootName(root: SpiritRoot, content: Content): string {
  const { grades, elements, bodies } = content.cultivation.roots;
  if (root.body) return bodies.find((b) => b.id === root.body)?.name ?? root.body;
  const grade = grades.find((g) => g.id === root.grade)?.name ?? root.grade;
  // Ngũ linh căn already says "all five".
  if (root.elements.length === 0 || root.elements.length >= 5) return grade;
  const names = root.elements.map((id) => elements.find((e) => e.id === id)?.name ?? id);
  return `${grade} (${names.join(', ')})`;
}

/** What the profile shows for the root. */
export function rootLabel(state: GameState, content: Content): string {
  return state.cult.root ? rootName(state.cult.root, content) : 'Chưa thử';
}

export function rootDescription(root: SpiritRoot, content: Content): string {
  const { grades, bodies } = content.cultivation.roots;
  if (root.body) return bodies.find((b) => b.id === root.body)?.description ?? '';
  return grades.find((g) => g.id === root.grade)?.description ?? '';
}

/**
 * Reveal the spirit root (once per life). A special body's stat and lifespan
 * hooks apply now; its other hooks are read by their systems later.
 */
export function revealRoot(state: GameState, content: Content): { state: GameState; line: LogLine | null } {
  if (state.cult.root) return { state, line: null };
  const rng = Rng.fromState(state.rng);
  const origin = content.origins.find((o) => o.id === state.character.originId);
  const rolls = origin?.cultivatorClan ? content.balance.roots.clanDescendantRolls : 1;
  const root = rollRoot(rng, content, rolls);

  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  let lifespan = state.cult.lifespan;
  const body = root.body ? content.cultivation.roots.bodies.find((b) => b.id === root.body) : undefined;
  for (const e of body?.effects ?? []) {
    if (e.add === undefined) continue;
    if (e.hook.startsWith('stat.')) {
      const k = e.hook.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    } else if (e.hook === 'lifespanPct') {
      // Never below next year, so the reveal itself does not kill.
      lifespan = Math.max(state.character.age + 1, Math.round(lifespan * (1 + e.add)));
    }
  }

  const speed = content.balance.roots.gradeSpeed[root.grade] ?? 0;
  const text = content.cultivation.roots.revealText
    .replace('{root}', rootName(root, content))
    .replace('{description}', rootDescription(root, content));
  const line: LogLine = { text, tone: speed === 0 ? 'bad' : speed >= 1.6 ? 'rare' : speed >= 1 ? 'good' : 'normal' };

  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return {
    state: { ...state, rng: rng.getState(), stats, aptitudes, cult: { ...state.cult, root, lifespan }, log },
    line,
  };
}
