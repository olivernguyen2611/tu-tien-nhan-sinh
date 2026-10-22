import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { resolveChoice } from '../src/systems/events/engine';
import { ageFamily } from '../src/systems/relationships';
import { kinOf, kinYear, lineageRows, shareEstate } from '../src/systems/kin';
import { heirOptions } from '../src/systems/heir';

const content = loadContent();
const cfg = content.balance.kin!;

function adult(age = 30, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'kin' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age }, money: { ...b.money, silver: 300 }, log: [...b.log, { age, lines: [] }], ...patch };
}
const withSibling = (s: GameState): GameState => s.family.some((r) => r.role === 'sibling')
  ? s : { ...s, family: [...s.family, { id: 'sib', role: 'sibling', gender: 'nam', name: 'Em Út', age: s.character.age - 3, alive: true, lifespan: 80, affinity: 50, lastActions: {} }] };

describe('10.11 gia tộc phàm tục', () => {
  it('the họ is met as a child: tộc trưởng and họ hàng are real acquaintances; gia phả has three generations', () => {
    let s = createLife({ seed: 'kin2' }, content);
    for (let i = 0; i < cfg.meetAge + 1; i++) s = advanceYear({ ...s, events: { ...s.events, pending: null }, combat: null }, content);
    const k = kinOf(s);
    expect(k.elder).toBeTruthy();
    expect(k.relatives.length).toBeGreaterThanOrEqual(cfg.relatives[0]);
    const kinds = new Set(k.relatives.map((id) => s.npcs.find((n) => n.id === id)?.kind));
    expect([...kinds].every((x) => x === 'ho_noi' || x === 'ho_ngoai')).toBe(true);
    expect(lineageRows(s, content).length).toBeGreaterThanOrEqual(3);
  });

  it("the father's death brings the phân gia the next year", () => {
    const b = withSibling(kinYear(adult(), content));
    const s = ageFamily({ ...b, family: b.family.map((r) => (r.role === 'father' ? { ...r, lifespan: r.age + 1 } : r)) }, content);
    expect(s.events.followUps.some((f) => f.event === 'gt_phan_gia')).toBe(true);
  });

  it('phân gia: equal shares, the eldest takes more and the siblings cool, yielding all warms them', () => {
    const b = withSibling(kinYear(adult(), content));
    const sib = (s: GameState) => s.family.find((r) => r.role === 'sibling' && r.alive)!.affinity;
    const eq = shareEstate(b, content, 'equal');
    const el = shareEstate(b, content, 'eldest');
    const yi = shareEstate(b, content, 'yield');
    expect(el.money.silver).toBeGreaterThan(eq.money.silver);
    expect(yi.money.silver).toBe(b.money.silver);
    expect(sib(el)).toBeLessThan(sib(b));
    expect(sib(yi)).toBeGreaterThan(sib(b));
    expect(kinOf(eq).split).toBe(true);
  });

  it('gia quy, tế tổ and the người nối dõi', () => {
    let s = kinYear(adult(50), content);
    const kids = [0, 1].map((i) => ({ id: `c${i}`, role: 'child' as const, gender: 'nam' as const, name: `Con ${i}`, age: 20 + i * 3, alive: true, lifespan: 80, affinity: 40 + i * 30, lastActions: {} }));
    s = { ...s, family: [...s.family, ...kids], romance: { ...s.romance, partner: s.npcs[0]?.id ?? null } };
    s = doActivity(s, content, 'te_to')!.state;
    expect(kinOf(s).rites).toBe(1);
    s = doActivity(s, content, 'chon_nguoi_noi_doi')!.state;
    s = resolveChoice(s, content, 2).state; // hiếu thảo nhất = c1
    expect(kinOf(s).heir).toBe('c1');
    const dead: GameState = { ...s, alive: false, death: { age: 70, cause: 'old_age', epitaph: '' } };
    expect(heirOptions(dead, content)[0].id).toBe('c1');
    expect(activityViews(s, content).map((v) => v.id)).toContain('lap_gia_quy');
    s = doActivity(s, content, 'lap_gia_quy')!.state;
    s = resolveChoice(s, content, 1).state;
    expect(kinOf(s).rules).toContain('hieu_hoc');
    const before = s.stats.intellect;
    expect(kinYear(s, content).stats.intellect).toBeGreaterThanOrEqual(before);
  });
});
