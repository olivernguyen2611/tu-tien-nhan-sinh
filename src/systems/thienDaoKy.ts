// 9.R10 Thiên Đạo Ký: a finished life told in 8–12 short paragraphs, built from templates
// (thien-dao-ky.json) and what the life left: path, peak, love, kin, ân oán, dấu ấn, thời cuộc, death, ending.
// No AI: each section shows its first line whose check holds; a list of texts is picked by the seed.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState } from '../core/types';
import { lifeMeets } from './achievements';
import { careerLabel } from './career';
import { lifeEnding } from './chronicle';
import { realmLabel } from './cultivation';
import { martialName } from './martial';
import { lifeHighlights } from './rebirth';
import { sectLabel } from './sect';
import { lifeSummary } from './time';

/** Every {key} a Thiên Đạo Ký line can use, for this life. */
export function kyValues(state: GameState, content: Content, lives: number): Record<string, string> {
  const summary = lifeSummary(state, content);
  const ending = (content.endings ?? []).find((e) => e.id === lifeEnding(state, content, lives));
  const partner = state.npcs.find((n) => n.id === state.romance.partner);
  const world = state.world;
  const seen = [...Object.keys(world?.cooldown ?? {}), ...(world?.active ? [world.active.id] : [])];
  const worldNames = (content.worldEvents ?? []).filter((e) => seen.includes(e.id)).map((e) => e.name);
  // Dấu ấn quoted as the life remembers them (short ones only, at most two).
  const highlights = lifeHighlights(state, 6, content).map((h) => h.replace(/^\d+ tuổi: /, '').replace(/[.。]$/, '')).filter((h) => h.length <= 90).slice(0, 2);
  const count = (n: number) => (n > 0 ? String(n) : '');
  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  return {
    name: state.character.name,
    hometown: state.character.hometown,
    origin: lower(content.origins.find((o) => o.id === state.character.originId)?.name ?? 'thường dân'),
    age: String(state.death?.age ?? state.character.age),
    realm: realmLabel(state, content),
    martial: martialName(state, content) ?? 'võ giả',
    sect: (sectLabel(state, content) ?? 'tông môn').split(' · ')[0],
    career: lower((careerLabel(state, content) ?? 'nghề mọn').split(' · ')[0]),
    partner: partner?.name ?? 'người ấy',
    children: count(state.family.filter((r) => r.role === 'child').length),
    disciples: count(state.npcs.filter((n) => n.disciple).length),
    enemies: count(state.npcs.filter((n) => n.grudge >= content.balance.npcs.revengeAt).length),
    friends: count(state.npcs.filter((n) => n.favor >= content.balance.npcs.repayAt || n.affinity >= content.balance.npcs.bondAt).length),
    highlights: highlights.join('”, “'),
    worldEvents: worldNames.slice(0, 3).join(', '),
    cause: summary?.causeText ?? '',
    epitaph: summary?.epitaph ?? '',
    ending: ending?.name ?? '',
    endingText: ending?.text ?? '',
  };
}

/** The Thiên Đạo Ký of a finished life (empty while alive or without templates). */
export function thienDaoKy(state: GameState, content: Content, lives: number): string[] {
  const ky = content.thienDaoKy;
  if (!ky || state.alive) return [];
  const v = kyValues(state, content, lives);
  const out: string[] = [];
  for (const section of ky.sections) {
    // A line about something this life never had (no children, no {worldEvents}…) is passed over.
    const filled = (t: string) => [...t.matchAll(/\{(\w+)\}/g)].every((m) => (v[m[1]] ?? '') !== '');
    const line = section.lines.find((l) => lifeMeets(state, content, l.when, lives) && (typeof l.text === 'string' ? [l.text] : l.text).every(filled));
    if (!line) continue;
    const text = typeof line.text === 'string' ? line.text : new Rng(`${state.seed}:ky:${section.id}`).pick(line.text);
    out.push(text.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? `{${k}}`));
  }
  return out;
}

export const KY_KEYS = ['name', 'hometown', 'origin', 'age', 'realm', 'martial', 'sect', 'career', 'partner', 'children', 'disciples', 'enemies', 'friends', 'highlights', 'worldEvents', 'cause', 'epitaph', 'ending', 'endingText'];
