import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { hookSum } from '../src/systems/cultivation';
import { foundBlocked, foundSect, sectNameProblem, suggestSectName } from '../src/systems/ownSect';
import { migrate } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.founding;

function elder(realm = 'kim_dan', stones = 500): GameState {
  const b = createLife({ seed: 'founder' }, content);
  return {
    ...b,
    character: { ...b.character, age: 120 },
    money: { silver: 0, spiritStones: stones },
    log: [...b.log, { age: 120, lines: [] }],
    sect: { ...b.sect, id: 'bich_lac_tong', rank: 2, contribution: 50 },
    cult: { ...b.cult, realm, lineage: 'tien', technique: 'tang_phong_kiem_kinh', root: { grade: 'song', elements: ['kim', 'hoa'], body: null } },
  };
}

describe('khai tông lập phái (task 5.1)', () => {
  it('needs Kim Đan and the spirit stones', () => {
    expect(foundBlocked(elder('truc_co'), content)).toContain('Kim Đan');
    expect(foundBlocked(elder('kim_dan', 10), content)).toContain(`${cfg.cost}`);
    expect(foundBlocked(elder(), content)).toBeNull();
  });

  it('names: suggestions and length rules', () => {
    expect(suggestSectName(elder(), content).split(' ')).toHaveLength(3);
    expect(sectNameProblem('A', content)).toContain('ngắn');
    expect(sectNameProblem('Thanh Tiêu Tông', content)).toBeNull();
  });

  it('founding: leaves the old sect, pays, carries the lineage, applies the rules', () => {
    const s = elder();
    const r = foundSect(s, content, { name: '  Thanh Tiêu Tông ', rules: ['be_mon_tu_thu', 'cam_sat_sinh'] })!;
    const own = r.state.ownSect!;
    expect(own).toMatchObject({ name: 'Thanh Tiêu Tông', lineage: 'tien', rules: ['be_mon_tu_thu', 'cam_sat_sinh'], founded: 120, members: cfg.startMembers.kim_dan });
    expect(r.state.sect.id).toBeNull();
    expect(r.state.sect.left).toContain('bich_lac_tong');
    expect(r.state.money.spiritStones).toBe(500 - cfg.cost);
    expect(r.state.social.reputation.chinh).toBe(s.social.reputation.chinh + 5);
    expect(hookSum(r.state, content, 'cultivationSpeed') - hookSum(s, content, 'cultivationSpeed')).toBeCloseTo(0.05);
    expect(foundBlocked(r.state, content)).toBe('Đã khai tông rồi.');
    expect(foundSect(s, content, { name: 'X Y', rules: content.founding.rules.map((x) => x.id) })).toBeNull();
  });

  it('old saves have no sect of their own', () => {
    const { ownSect: _o, ...old } = elder();
    expect(migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: old as unknown as GameState }).life.ownSect).toBeNull();
  });
});
