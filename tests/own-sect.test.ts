import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife, fillTemplate } from '../src/core/state';
import { Rng } from '../src/core/rng';
import { EventFileSchema, FoeSpecSchema } from '../src/core/schemas';
import { meets } from '../src/systems/events/conditions';
import { resolveChoice } from '../src/systems/events/engine';
import { makeFoe } from '../src/systems/combat';
import type { GameState } from '../src/core/types';
import { hookSum } from '../src/systems/cultivation';
import { build, decide, donate, foundBlocked, foundSect, ownSectYear, sectNameProblem, suggestSectName } from '../src/systems/ownSect';
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
    cult: { ...b.cult, realm, lineage: 'tien', technique: 'tang_phong_kiem_kinh', root: { grade: 'song', elements: ['kim', 'hoa'] } },
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

describe('công trình và báo cáo tông môn (task 5.2)', () => {
  function founded(rules: string[] = []): GameState {
    return foundSect(elder(), content, { name: 'Thanh Tiêu Tông', rules })!.state;
  }

  it('a year: members come and go, the treasury fills, a report asks 1–3 decisions', () => {
    const s = founded();
    const next = advanceYear({ ...s, events: { ...s.events, pending: null } }, content);
    const own = next.ownSect!;
    expect(own.members).toBeGreaterThan(s.ownSect!.members);
    expect(own.treasury).toBeGreaterThan(0);
    expect(own.report!.age).toBe(next.character.age);
    expect(own.report!.decisions.length).toBeGreaterThanOrEqual(cfg.decisions[0]);
    expect(own.report!.decisions.length).toBeLessThanOrEqual(cfg.decisions[1]);
    expect(next.log.at(-1)!.lines.some((l) => l.text.startsWith('Báo cáo của Thanh Tiêu Tông'))).toBe(true);
  });

  it('tông quy shape recruitment: Mở cửa cho tán tu draws more than Bế môn tự thủ', () => {
    const open = ownSectYear({ ...founded(['mo_cua_tan_tu']), ownSect: { ...founded().ownSect!, rules: ['mo_cua_tan_tu'], members: 50 } }, content);
    const closed = ownSectYear({ ...founded(['be_mon_tu_thu']), ownSect: { ...founded().ownSect!, rules: ['be_mon_tu_thu'], members: 50 } }, content);
    expect(open.ownSect!.members).toBeGreaterThan(closed.ownSect!.members);
  });

  it('buildings: raised from the treasury; Tàng Kinh Các speeds the master, Luyện Đan Phòng sends pills', () => {
    let s = founded();
    s = { ...s, ownSect: { ...s.ownSect!, treasury: 1000 } };
    const before = hookSum(s, content, 'cultivationSpeed');
    s = build(s, content, 'tang_kinh_cac')!.state;
    s = build(s, content, 'tang_kinh_cac')!.state;
    expect(s.ownSect!.buildings.tang_kinh_cac).toBe(2);
    expect(hookSum(s, content, 'cultivationSpeed') - before).toBeCloseTo(0.1);
    s = build(s, content, 'luyen_dan_phong')!.state;
    const pills = s.inventory.tu_khi_dan ?? 0;
    expect(ownSectYear(s, content).inventory.tu_khi_dan).toBe(pills + 1);
    expect(build({ ...s, ownSect: { ...s.ownSect!, treasury: 0 } }, content, 'linh_dien')).toBeNull();
    const rich = { ...s, money: { ...s.money, spiritStones: 100 } };
    expect(donate(rich, content)!.state.ownSect!.treasury).toBe(s.ownSect!.treasury + cfg.donation);
  });

  it('decisions: each once; withdrawing fills the master’s purse', () => {
    let s = ownSectYear({ ...founded(), ownSect: { ...founded().ownSect!, treasury: 200 } }, content);
    s = { ...s, ownSect: { ...s.ownSect!, report: { ...s.ownSect!.report!, decisions: ['rut_linh_thach', 'dai_hoi_thu_do'] } } };
    const t = s.ownSect!.treasury;
    const r = decide(s, content, 'rut_linh_thach')!.state;
    expect(r.money.spiritStones - s.money.spiritStones).toBe(Math.floor(t * 0.5));
    expect(decide(r, content, 'rut_linh_thach')).toBeNull();
    expect(decide(r, content, 'dai_hoi_thu_do')!.state.ownSect!.members).toBe(r.ownSect!.members + 8);
    expect(decide(r, content, 'cuu_te_dan_lang')).toBeNull();
  });
});

describe('engine cho sự kiện tông môn (task 5.3)', () => {
  it('conditions on the founded sect, effects on it, {sect} names it', () => {
    const s = foundSect(elder(), content, { name: 'Thanh Tiêu Tông', rules: [] })!.state;
    expect(meets(s, { ownSect: { has: true, minMembers: 5 } }, content)).toBe(true);
    expect(meets(elder(), { ownSect: { has: true } }, content)).toBe(false);
    expect(meets(s, { ownSect: { building: { id: 'ho_son_dai_tran', min: 1 } } }, content)).toBe(false);
    expect(fillTemplate('Ma đạo kéo tới {sect}.', s, content)).toBe('Ma đạo kéo tới Thanh Tiêu Tông.');
    const ev = EventFileSchema.parse([{
      id: 'thu_tong_mon', category: 'sect', title: 'Thử', text: 'Thử.', weight: 0, conditions: { ownSect: { has: true } },
      choices: [{ text: 'Đánh', result: { text: 'Xong.', effects: { ownSect: { members: -3, treasury: 20 }, 'stat.daoHeart': 1 } } }],
    }]);
    const r = resolveChoice({ ...s, events: { ...s.events, pending: 'thu_tong_mon' } }, { ...content, events: [...content.events, ...ev] }, 0).state;
    expect(r.ownSect!.members).toBe(s.ownSect!.members - 3);
    expect(r.ownSect!.treasury).toBe(s.ownSect!.treasury + 20);
  });

  it('Hộ Sơn Đại Trận weakens attackers of the sect', () => {
    const s = foundSect(elder(), content, { name: 'Thanh Tiêu Tông', rules: [] })!.state;
    const walled = { ...s, ownSect: { ...s.ownSect!, buildings: { ho_son_dai_tran: 3 } } };
    const spec = FoeSpecSchema.parse({ name: 'Ma tu', intent: 'rob', againstSect: true });
    const plain = makeFoe(s, content, spec, new Rng('x')).power;
    expect(makeFoe(walled, content, spec, new Rng('x')).power).toBeCloseTo(plain * (1 - 3 * content.balance.founding.defensePerLevel), 0);
  });
});
