import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { codexOf, codexProgress, EMPTY_CODEX, mergeCodex, storyText } from '../src/systems/codex';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { takeChosen, setChosenRole } from '../src/systems/chosen';
import { readMeta, recordCodex, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const born = (seed: string, offered?: string[], finger?: string) => {
  const r = rollDestiny(createLife({ seed, goldenFinger: finger }, content), content);
  return confirmDestiny(offered ? { ...r, destiny: { ...r.destiny, offered } } : r, content);
};
const dead = (s: GameState): GameState => ({ ...s, alive: false, death: { age: s.character.age, cause: 'old_age', epitaph: '' } });

describe('Thiên Thư (task 5b.4)', () => {
  it('nothing before the destiny is confirmed', () => {
    expect(codexOf(createLife({ seed: 'x' }, content), content)).toEqual(EMPTY_CODEX);
  });

  it('records traits, combos and the Kim Thủ Chỉ; merging keeps each once', () => {
    const s = born('a', ['khoai_cuoc', 'phong_cot', 'thiet_vi'], 'doc_tam');
    const c = codexOf(s, content);
    expect(c.traits).toEqual(['khoai_cuoc', 'phong_cot', 'thiet_vi']);
    expect(c.combos).toEqual(['truy_phong']);
    expect(c.fingers).toEqual(['doc_tam']);
    const twice = mergeCodex(c, codexOf(born('b', ['khoai_cuoc', 'kheo_mom', 'mat_tinh']), content));
    expect(twice.traits).toEqual(['khoai_cuoc', 'phong_cot', 'thiet_vi', 'kheo_mom', 'mat_tinh']);
    expect(codexProgress(twice, content).traits).toEqual([5, content.traits.length]);
  });

  it('a finished life tells its khí vận chi tử tale', () => {
    let s = born('c');
    s = takeChosen({ ...s, character: { ...s.character, age: 120 }, log: [...s.log, { age: 120, lines: [] }] }, content, 'xuyen_khong');
    s = setChosenRole(s, content, 'protect');
    expect(codexOf(s, content).stories).toEqual([]);
    const story = codexOf(dead(s), content).stories[0];
    expect(story.ending).toBe('protect');
    expect(storyText(story, content)).toContain(story.npc);
    const killed = { ...s, npcs: s.npcs.map((n) => (n.chosen ? { ...n, alive: false, chosen: { ...n.chosen, role: 'exploit' as const } } : n)) };
    expect(codexOf(dead(killed), content).stories[0].ending).toBe('exploit_won');
  });

  it('meta keeps the Thiên Thư', () => {
    const store = fakeStore();
    recordCodex(store, codexOf(born('d', ['khoai_cuoc', 'phong_cot', 'thiet_vi']), content));
    recordCodex(store, codexOf(born('e', ['thiet_vi', 'an_khoe', 'mat_ca']), content));
    const m = readMeta(store).codex;
    expect(m.combos).toEqual(['truy_phong', 'thiet_vi_vo_song']);
    expect(m.traits).toHaveLength(5);
  });
});
