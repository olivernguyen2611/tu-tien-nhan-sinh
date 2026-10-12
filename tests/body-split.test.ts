import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { bodyLabel, rootLabel, startCultivating } from '../src/systems/cultivation';
import { devSetBody, devSetRoot } from '../src/systems/dev';
import { inheritRoot } from '../src/systems/romance';
import { Rng } from '../src/core/rng';
import { makeSave, migrate } from '../src/systems/save';

const content = loadContent();
const adult = (): GameState => {
  const b = createLife({ seed: 'body-split' }, content);
  return { ...b, character: { ...b.character, age: 20 }, cult: { ...b.cult, root: { grade: 'song', elements: ['kim', 'hoa'] } } };
};

describe('linh căn and thể chất are separate', () => {
  it('an ordinary tested character has Phàm thể; an untested one has none yet', () => {
    expect(bodyLabel(adult(), content)).toBe('Phàm thể');
    expect(bodyLabel(createLife({ seed: 'x' }, content), content)).toBe('Chưa rõ');
  });

  it('a special body stands in for the root and the root line says so', () => {
    const s = devSetBody(adult(), content, 'cuu_duong_the');
    expect(s.cult.bodyId).toBe('cuu_duong_the');
    expect(s.cult.root).toEqual({ grade: 'the_chat', elements: [] });
    expect(bodyLabel(s, content)).toBe('Cửu Dương Thể');
    expect(rootLabel(s, content)).toContain('thể chất');
    expect(startCultivating(s, content).state.cult.realm).not.toBe('pham_nhan');
  });

  it('setting an elemental root drops the body; clearing the body leaves a usable root', () => {
    const withBody = devSetBody(adult(), content, 'cuu_duong_the');
    expect(devSetRoot(withBody, content, { grade: 'don', elements: ['kim'] }).cult.bodyId).toBeNull();
    const cleared = devSetBody(withBody, content, null);
    expect(cleared.cult.bodyId).toBeNull();
    expect(cleared.cult.root?.grade).not.toBe('the_chat');
  });

  it('a child can inherit the parent body, kept apart from the root', () => {
    const parent = devSetBody(adult(), content, 'cuu_duong_the');
    const boosted = { ...content, balance: { ...content.balance, romance: { ...content.balance.romance, bodyInheritChance: 1 } } };
    expect(inheritRoot(parent, boosted, null, new Rng('inh'))).toEqual({ root: { grade: 'the_chat', elements: [] }, bodyId: 'cuu_duong_the' });
  });

  it('old saves move root.body to cult.bodyId, children too', () => {
    const base = adult();
    const old = {
      ...base,
      cult: { ...base.cult, bodyId: undefined, root: { grade: 'the_chat', elements: [], body: 'ban_thach_thanh_cot' } },
      family: [{ id: 'c', role: 'child', gender: 'nam', name: 'A', age: 9, alive: true, lifespan: 60, affinity: 50, lastActions: {}, root: { grade: 'the_chat', elements: [], body: 'kim_cuong_than' } }],
    } as unknown as GameState;
    const m = migrate(makeSave(old, 1)).life;
    expect(m.cult.bodyId).toBe('ban_thach_thanh_cot');
    expect(m.cult.root).toEqual({ grade: 'the_chat', elements: [] });
    expect(m.family[0]).toMatchObject({ bodyId: 'kim_cuong_than', root: { grade: 'the_chat', elements: [] } });
  });
});
