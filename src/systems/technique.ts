// Main cultivation method (task 2.4, docs/design/techniques.md): grade, element
// match and lineage set the speed multiplier (PLAN G.1, K.3.1); the grade caps
// how far it can take you; switching costs part of the current bar.
import type { Content } from '../core/content';
import type { Technique } from '../core/schemas';
import type { GameState, LogLine, SpiritRoot } from '../core/types';
import { adoptLineage } from './paths';

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function techniqueById(content: Content, id: string | null): Technique | undefined {
  return id ? content.techniques.find((t) => t.id === id) : undefined;
}

export function currentTechnique(state: GameState, content: Content): Technique | undefined {
  return techniqueById(content, state.cult.technique);
}

/** Does the technique fit this root? A mismatch slows cultivation (×mismatchMul). */
export function techniqueMatches(tech: Technique, root: SpiritRoot | null, content: Content): boolean {
  if (!root || tech.elements === 'root' || tech.elements === 'any' || tech.elements === 'none') return true;
  // No usable root (Phật duyên): nothing to clash with.
  if ((content.balance.roots.gradeSpeed[root.grade] ?? 0) <= 0) return true;
  if (root.body) return !!content.cultivation.roots.bodies.find((b) => b.id === root.body)?.anyTechnique;
  const basic = new Set(content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id));
  if (tech.elements === 'five') return root.elements.some((e) => basic.has(e));
  return root.elements.some((e) => (tech.elements as string[]).includes(e));
}

/** Grade × element match × lineage (PLAN G.1); 1 without a technique. */
export function techniqueMul(state: GameState, content: Content): number {
  const tech = currentTechnique(state, content);
  if (!tech) return 1;
  const cfg = content.balance.techniques;
  const match = techniqueMatches(tech, state.cult.root, content) ? 1 : cfg.mismatchMul;
  return (cfg.gradeMul[tech.grade] ?? 1) * match * (cfg.lineageMul[tech.lineage] ?? 1);
}

/** Highest realm this technique reaches, or null for no limit. */
export function techniqueMaxRealm(tech: Technique, content: Content): string | null {
  return tech.maxRealm ?? content.balance.techniques.gradeMaxRealm[tech.grade] ?? null;
}

/** "{technique} chỉ tu tới …" when the current technique cannot lead into `targetRealm`. */
export function techniqueCapReason(state: GameState, content: Content, targetRealm: string): string | null {
  const tech = currentTechnique(state, content);
  if (!tech) return null;
  const max = techniqueMaxRealm(tech, content);
  if (!max) return null;
  const order = content.cultivation.realms.realms.map((r) => r.id);
  if (order.indexOf(targetRealm) <= order.indexOf(max)) return null;
  const realm = content.cultivation.realms.realms.find((r) => r.id === max)?.name ?? max;
  return content.cultivation.realms.texts.techniqueCap.replaceAll('{technique}', tech.name).replaceAll('{realm}', realm);
}

const usableRoot = (state: GameState, content: Content) =>
  !!state.cult.root && (content.balance.roots.gradeSpeed[state.cult.root.grade] ?? 0) > 0;

/** Why this technique cannot be learned now, or null. */
export function learnBlocked(state: GameState, content: Content, tech: Technique): string | null {
  const r = tech.requires;
  // Quỷ tu (task 4.12) read the ghost-only method and need no root: they cultivate on âm khí.
  const ghost = !!state.flags.quy_tu;
  if (r.ghostOnly && !ghost) return 'Chỉ quỷ tu mới đọc được.';
  if (!usableRoot(state, content) && !r.rootless && !ghost) return 'Không có linh căn thì không tu được công pháp này.';
  if (r.minDaoHeart !== undefined && state.aptitudes.daoHeart < r.minDaoHeart) return `Cần Đạo tâm ${r.minDaoHeart}.`;
  if (r.minRootElements !== undefined && (state.cult.root?.elements.length ?? 0) < r.minRootElements) return `Cần linh căn từ ${r.minRootElements} hệ trở lên.`;
  return null;
}

/**
 * Take up a technique. Switching loses balance.techniques.switchLossPct of the bar;
 * the lineage follows the technique; lifespanPct moves with the technique; one-time
 * stat hooks are given only the first time a technique is learned.
 */
export function learnTechnique(state: GameState, content: Content, techId: string, opts: { quiet?: boolean } = {}): { state: GameState; text: string } | null {
  const tech = techniqueById(content, techId);
  if (!tech || state.cult.technique === techId || learnBlocked(state, content, tech)) return null;
  const texts = content.cultivation.realms.texts;
  const names = content.cultivation.realms;
  const old = currentTechnique(state, content);
  const pct = (t: Technique | undefined) => (t?.effects ?? []).reduce((sum, e) => sum + (e.hook === 'lifespanPct' ? e.add ?? 0 : 0), 0);
  const lifespan = Math.max(state.character.age + 1, Math.round((state.cult.lifespan / (1 + pct(old))) * (1 + pct(tech))));
  const progress = old ? Math.max(0, state.cult.progress * (1 - content.balance.techniques.switchLossPct / 100)) : state.cult.progress;

  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  if (!state.cult.learned.includes(techId)) {
    for (const e of tech.effects) {
      if (!e.hook.startsWith('stat.') || e.add === undefined) continue;
      const k = e.hook.slice(5);
      if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + e.add);
      else if (k in aptitudes) aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + e.add);
    }
  }
  const fill = (t: string) => t
    .replaceAll('{technique}', tech.name)
    .replaceAll('{old}', old?.name ?? '')
    .replaceAll('{grade}', names.gradeNames[tech.grade] ?? tech.grade)
    .replaceAll('{lineage}', names.lineageNames[tech.lineage] ?? tech.lineage);
  const text = fill(old ? texts.switchTechnique : texts.learnTechnique);
  const next: GameState = {
    ...state,
    stats,
    aptitudes,
    cult: {
      ...state.cult,
      technique: techId,
      lineage: tech.lineage,
      learned: state.cult.learned.includes(techId) ? state.cult.learned : [...state.cult.learned, techId],
      scrolls: state.cult.scrolls.filter((s) => s !== techId),
      lifespan,
      progress,
    },
  };
  const adopted = adoptLineage(next, content);
  if (opts.quiet) return { state: adopted, text };
  const line: LogLine = { text, tone: 'good' };
  const log = adopted.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, line] };
  return { state: { ...adopted, log }, text };
}

/** "Hoàng phẩm · Tiên đạo · hợp linh căn · tới Trúc Cơ" for the Tu luyện sheet. */
export function techniqueSummary(state: GameState, content: Content): string | null {
  const tech = currentTechnique(state, content);
  if (!tech) return null;
  const names = content.cultivation.realms;
  const max = techniqueMaxRealm(tech, content);
  const maxName = max ? names.realms.find((r) => r.id === max)?.name : null;
  return [
    `${names.gradeNames[tech.grade] ?? tech.grade} phẩm`,
    names.lineageNames[tech.lineage] ?? tech.lineage,
    techniqueMatches(tech, state.cult.root, content) ? 'hợp linh căn' : 'không hợp linh căn',
    maxName ? `tu tới ${maxName}` : 'không giới hạn cảnh giới',
  ].join(' · ');
}

/** Keep a technique scroll to practise later (task 2.8). */
export function gainScroll(state: GameState, content: Content, techId: string): { state: GameState; text: string } | null {
  const tech = techniqueById(content, techId);
  if (!tech || state.cult.scrolls.includes(techId) || state.cult.technique === techId) return null;
  const text = `Ngươi có được bí tịch ${tech.name} (${content.cultivation.realms.gradeNames[tech.grade] ?? tech.grade} phẩm). Mở Tu luyện để tu.`;
  const next: GameState = { ...state, cult: { ...state.cult, scrolls: [...state.cult.scrolls, techId] } };
  const log = next.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'rare' }] };
  return { state: { ...next, log }, text };
}
