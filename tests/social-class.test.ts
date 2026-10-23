import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { activityViews } from '../src/systems/activities';
import { meets } from '../src/systems/events/conditions';
import { classDef, classOf, setClass } from '../src/systems/socialClass';
import { standingAllows, standingMul } from '../src/systems/standing';

const content = loadContent();
const life = (origin: string, age = 20) => {
  const s = createLife({ seed: 'giai-cap', originId: origin }, content);
  return { ...s, character: { ...s.character, age } };
};

describe('Giai cấp (15.1)', () => {
  it('every origin belongs to a class of its world; the classes are ranked', () => {
    for (const o of content.origins) expect(classDef(content, o.class), o.id).toBeDefined();
    expect(classOf(life('hoang_tu'), content)).toBe('hoang_toc');
    expect(classOf(life('hoang_than'), content)).toBe('hoang_toc');
    expect(classOf(life('co_nhi'), content)).toBe('ban_dan');
    expect(classDef(content, 'hoang_toc')!.rank).toBeGreaterThan(classDef(content, 'nong_gia')!.rank);
  });

  it('a life can rise or fall into another class, and back', () => {
    const s = life('hoang_tu');
    const fallen = setClass(s, content, 'ban_dan');
    expect(classOf(fallen, content)).toBe('ban_dan');
    expect(classOf(setClass(fallen, content, 'hoang_toc'), content)).toBe('hoang_toc');
    expect(setClass(fallen, content, 'hoang_toc').character.classId).toBeUndefined();
    expect(setClass(s, content, 'khong_co')).toBe(s);
  });

  it('conditions classes / notClasses', () => {
    const prince = life('hoang_tu');
    const farmer = life('nong_dan');
    expect(meets(prince, { classes: ['hoang_toc'] } as never, content)).toBe(true);
    expect(meets(farmer, { classes: ['hoang_toc'] } as never, content)).toBe(false);
    expect(meets(prince, { notClasses: ['hoang_toc', 'quyen_quy'] } as never, content)).toBe(false);
    expect(meets(farmer, { notClasses: ['hoang_toc', 'quyen_quy'] } as never, content)).toBe(true);
  });

  it('an activity shows its giai cấp look (byClass); balance.classes closes activities and mutes events', () => {
    const a = content.activities!.find((x) => x.id === 'tra_quan')!;
    const patched: Content = {
      ...content,
      activities: content.activities!.map((x) => (x.id === a.id ? { ...x, byClass: { hoang_toc: { name: 'Nghe kể chuyện trong cung' } } } : x)),
      balance: { ...content.balance, classes: { hoang_toc: { mul: 0, categories: ['work'], themes: [], ids: [], activityGroups: [], activityIds: ['xem_boi'] } } },
    };
    const prince = life('hoang_tu');
    const farmer = life('nong_dan');
    expect(activityViews(prince, patched).find((v) => v.id === a.id)!.name).toBe('Nghe kể chuyện trong cung');
    expect(activityViews(farmer, patched).find((v) => v.id === a.id)!.name).toBe(a.name);
    const boi = patched.activities!.find((x) => x.id === 'xem_boi')!;
    expect(standingAllows(prince, patched, boi)).toBe(false);
    expect(standingAllows(farmer, patched, boi)).toBe(true);
    // An activity that names its classes stays open to them.
    expect(standingAllows(prince, patched, { ...boi, conditions: { classes: ['hoang_toc'] } as never })).toBe(true);
    expect(standingMul(prince, patched, { id: 'x', category: 'work', themes: [] })).toBe(0);
    expect(standingMul(farmer, patched, { id: 'x', category: 'work', themes: [] })).toBe(1);
  });
});
