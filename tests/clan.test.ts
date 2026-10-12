import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { buyProperty, clanBlocked, clanYear, familyTree, foundClan } from '../src/systems/clan';
import { continueAsHeir } from '../src/systems/heir';
import { inheritRoot } from '../src/systems/romance';
import { checkDeath } from '../src/systems/time';
import { migrate } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.clan;

function parent(children = 1, realm = 'truc_co'): GameState {
  const b = createLife({ seed: 'clan', name: 'Lâm Vân' }, content);
  const kids = Array.from({ length: children }, (_, i) => ({ id: `child_${i}`, role: 'child' as const, gender: 'nam' as const, name: `Lâm Con ${i}`, age: 10, alive: true, lifespan: 70, affinity: 70, lastActions: {}, root: null }));
  return {
    ...b,
    character: { ...b.character, age: 60 },
    money: { silver: 1000, spiritStones: 1000 },
    family: [...b.family, ...kids],
    log: [...b.log, { age: 60, lines: [] }],
    cult: { ...b.cult, realm, root: { grade: 'song', elements: ['kim', 'hoa'], body: null } },
  };
}

describe('gia tộc tu tiên (task 5.4)', () => {
  it('needs Trúc Cơ, a child and the cost; named after the surname', () => {
    expect(clanBlocked(parent(1, 'luyen_khi'), content)).toContain('Trúc Cơ');
    expect(clanBlocked(parent(0), content)).toContain('con');
    const r = foundClan(parent(), content, ['trong_tu_luyen'])!;
    expect(r.state.clan).toMatchObject({ name: 'Lâm gia', founder: 'Lâm Vân', rules: ['trong_tu_luyen'] });
    expect(r.state.money.spiritStones).toBe(1000 - cfg.cost);
    expect(foundClan(parent(), content, content.clan.rules.map((x) => x.id))).toBeNull();
  });

  it('sản nghiệp: bought with money, bring income each year (× gia quy)', () => {
    let s = foundClan(parent(), content, ['trong_thuong_nghiep'])!.state;
    s = buyProperty(s, content, 'ruong_tot')!.state;
    s = buyProperty(s, content, 'linh_dien_gia_toc')!.state;
    expect(s.money.silver).toBe(1000 - 100);
    const y = clanYear(s, content);
    expect(y.money.silver - s.money.silver).toBe(Math.round(15 * 1.5));
    expect(y.money.spiritStones - s.money.spiritStones).toBe(Math.round(8 * 1.5));
  });

  it('Trọng tu luyện gives children born into the clan better roots on average', () => {
    const plain = parent();
    const clan = foundClan(parent(), content, ['trong_tu_luyen'])!.state;
    const speed = (g: string) => content.balance.roots.gradeSpeed[g] ?? 0;
    const avg = (s: GameState) => {
      let sum = 0;
      for (let i = 0; i < 300; i++) sum += speed(inheritRoot(s, content, null, new Rng(`k${i}`)).grade);
      return sum / 300;
    };
    expect(avg(clan)).toBeGreaterThan(avg(plain) + 0.05);
  });

  it('the clan passes to the heir; tộc phả lists the generations', () => {
    const s = foundClan(parent(), content, ['doc_dinh_truyen_thua'])!.state;
    const dead = checkDeath({ ...s, family: s.family.map((r) => (r.role === 'child' ? { ...r, age: 20 } : r)) }, content, 'old_age');
    const h = continueAsHeir(dead, content, 'child_0');
    expect(h.clan!.name).toBe('Lâm gia');
    expect(h.money.spiritStones).toBe(Math.round(dead.money.spiritStones * Math.min(1, content.balance.heir.inheritMoney + 0.2)));
    expect(familyTree(h, content).map((m) => m.name)).toEqual(['Lâm Vân', 'Lâm Con 0']);
  });

  it('old saves have no clan', () => {
    const { clan: _c, ...old } = parent();
    expect(migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: old as unknown as GameState }).life.clan).toBeNull();
  });
});
