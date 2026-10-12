// Thiên Thư (task 5b.4): the collection kept across lives: Tiên Thiên Khí Vận seen, tổ hợp ẩn
// woken, Kim Thủ Chỉ owned, and the tales of khí vận chi tử witnessed. Pure: the save meta
// stores a Codex; codexOf reads what one life adds, mergeCodex folds it in.
import type { Content } from '../core/content';
import type { CodexFile } from '../core/schemas';
import type { GameState } from '../core/types';
import { activeCombos } from './destiny';
import { chosenDisciple } from './chosen';

export interface CodexStory {
  /** Seed of the life that saw it (one tale per life). */
  life: string;
  template: string;
  npc: string;
  master: string;
  ending: keyof CodexFile['stories'];
}

export interface Codex {
  traits: string[];
  combos: string[];
  fingers: string[];
  stories: CodexStory[];
}

export const EMPTY_CODEX: Codex = { traits: [], combos: [], fingers: [], stories: [] };
/** Tales kept; older ones drop off. */
const MAX_STORIES = 50;

/** How a khí vận chi tử's tale stands for this life. */
function storyEnding(state: GameState): CodexStory['ending'] | null {
  const n = chosenDisciple(state);
  if (!n?.chosen) return null;
  const role = n.chosen.role;
  if (role === 'exploit') return n.alive ? 'exploit' : 'exploit_won';
  if (!n.alive && role !== 'protect' && role !== 'ignore') return 'dead';
  return role ?? 'none';
}

/** What this life adds to the Thiên Thư (a confirmed destiny; the tale only once the life is over). */
export function codexOf(state: GameState, content: Content): Codex {
  if (!state.destiny.confirmed) return EMPTY_CODEX;
  const n = chosenDisciple(state);
  const ending = state.alive ? null : storyEnding(state);
  return {
    traits: state.traits.filter((t) => content.traits.some((x) => x.id === t)),
    combos: activeCombos(state, content).map((c) => c.id),
    fingers: state.goldenFinger ? [state.goldenFinger.id] : [],
    stories: n?.chosen && ending ? [{ life: state.seed, template: n.chosen.template, npc: n.name, master: state.character.name, ending }] : [],
  };
}

const union = (a: string[], b: string[]) => [...a, ...b.filter((x) => !a.includes(x))];

export function mergeCodex(a: Codex, b: Codex): Codex {
  const stories = [...a.stories.filter((s) => !b.stories.some((t) => t.life === s.life)), ...b.stories].slice(-MAX_STORIES);
  return { traits: union(a.traits, b.traits), combos: union(a.combos, b.combos), fingers: union(a.fingers, b.fingers), stories };
}

/** A tale as the Thiên Thư tells it. */
export function storyText(story: CodexStory, content: Content): string {
  return content.codex.stories[story.ending].replaceAll('{npc}', story.npc).replaceAll('{master}', story.master);
}

/** Found / total for each part, for the title of each tab. */
export function codexProgress(codex: Codex, content: Content) {
  return {
    traits: [codex.traits.filter((t) => content.traits.some((x) => x.id === t)).length, content.traits.length],
    combos: [codex.combos.filter((c) => content.traitCombos.combos.some((x) => x.id === c)).length, content.traitCombos.combos.length],
    fingers: [codex.fingers.filter((f) => content.goldenFingers.fingers.some((x) => x.id === f)).length, content.goldenFingers.fingers.length],
  } as const;
}
