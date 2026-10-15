import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { bodyLabel, rollRoot, rootLabel, rootUsable, startCultivating } from '../src/systems/cultivation';
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

  it('a special body leaves the root alone and adds its own effects', () => {
    const s = devSetBody(adult(), content, 'cuu_duong_the');
    expect(s.cult.bodyId).toBe('cuu_duong_the');
    expect(s.cult.root).toEqual({ grade: 'song', elements: ['kim', 'hoa'] });
    expect(bodyLabel(s, content)).toBe('Cửu Dương Thể');
    expect(rootLabel(s, content)).toContain('Song linh căn');
    expect(startCultivating(s, content).state.cult.realm).not.toBe('pham_nhan');
  });

  it('a body does not make a rootless mortal able to cultivate', () => {
    const s = devSetBody({ ...adult(), cult: { ...adult().cult, root: { grade: 'none', elements: [] } } }, content, 'cuu_duong_the');
    expect(rootUsable(s, content)).toBe(false);
  });

  it('setting a root keeps the body; clearing the body keeps the root', () => {
    const withBody = devSetBody(adult(), content, 'cuu_duong_the');
    expect(devSetRoot(withBody, content, { grade: 'don', elements: ['kim'] }).cult.bodyId).toBe('cuu_duong_the');
    const cleared = devSetBody(withBody, content, null);
    expect(cleared.cult.bodyId).toBeNull();
    expect(cleared.cult.root).toEqual(withBody.cult.root);
  });

  it('a child can inherit the parent body, with a root rolled apart from it', () => {
    const parent = devSetBody(adult(), content, 'cuu_duong_the');
    const boosted = { ...content, balance: { ...content.balance, romance: { ...content.balance.romance, bodyInheritChance: 1 } } };
    const got = inheritRoot(parent, boosted, null, new Rng('inh'));
    expect(got.bodyId).toBe('cuu_duong_the');
    expect(got.root.grade).not.toBe('the_chat');
  });

  it('a variant root is never mixed with ordinary elements', () => {
    const variants = new Set(content.cultivation.roots.elements.filter((e) => e.variant).map((e) => e.id));
    const rng = new Rng('variant-only');
    let seen = 0;
    for (let i = 0; i < 6000; i++) {
      const { root } = rollRoot(rng, content);
      if (root.grade !== 'bien_di') continue;
      seen++;
      expect(root.elements).toHaveLength(1);
      expect(variants.has(root.elements[0])).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('old saves: root.body moves to cult.bodyId and the body-born get an ordinary root back (v3), children too', () => {
    const base = adult();
    const old = {
      ...base,
      cult: { ...base.cult, bodyId: undefined, root: { grade: 'the_chat', elements: [], body: 'ban_thach_thanh_cot' } },
      family: [{ id: 'c', role: 'child', gender: 'nam', name: 'A', age: 9, alive: true, lifespan: 60, affinity: 50, lastActions: {}, root: { grade: 'the_chat', elements: [], body: 'kim_cuong_than' } }],
    } as unknown as GameState;
    const m = migrate(makeSave(old, 1)).life;
    expect(m.cult.bodyId).toBe('ban_thach_thanh_cot');
    expect(['tam', 'song']).toContain(m.cult.root?.grade);
    expect(m.cult.root!.elements.length).toBeGreaterThanOrEqual(2);
    expect(m.family[0].bodyId).toBe('kim_cuong_than');
    expect(['tam', 'song']).toContain(m.family[0].root?.grade);
    // A martial ascender of the old kind (plain Ngũ linh căn) becomes Ngũ khí + Tiên Võ thể.
    const ascender = { ...adult(), flags: { vo_dao_nhap_tien: true }, cult: { ...adult().cult, root: { grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'] } } } as unknown as GameState;
    expect(migrate(makeSave(ascender, 1)).life.cult).toMatchObject({ root: { grade: 'ngu_khi' }, bodyId: 'tien_vo_the' });
    // Same seed, same root: migrating twice does not change it.
    expect(migrate(makeSave(old, 1)).life.cult.root).toEqual(m.cult.root);
  });
});
