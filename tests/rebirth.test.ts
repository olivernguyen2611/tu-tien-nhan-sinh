import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { lifeHighlights, lifeRecap, newLifeCost, originOptions, rebirthPoints } from '../src/systems/rebirth';
import { creditRebirth, readMeta, recordNewLife, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const b = content.balance.rebirth;

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

function dead(over: Partial<GameState> = {}): GameState {
  const s = createLife({ seed: 'rebirth-test' }, content);
  return { ...s, alive: false, death: { age: 85, cause: 'old_age', epitaph: '' }, character: { ...s.character, age: 85 }, ...over };
}

describe('tổng kết đời và điểm Luân Hồi (task 5b.1)', () => {
  it('a plain mortal life earns points for its years only', () => {
    const p = rebirthPoints(dead(), content);
    expect(p.lines.map((l) => l.label)).toEqual(['Năm tháng đã sống']);
    expect(p.total).toBe(Math.floor(85 / b.yearsPerPoint));
  });

  it('realm, karma, founded sect and children add up', () => {
    const s = dead();
    const kid = { id: 'child_0', role: 'child' as const, gender: 'nu' as const, name: 'A', age: 30, alive: true, lifespan: 80, affinity: 60, lastActions: {} };
    const rich = dead({
      cult: { ...s.cult, realm: 'kim_dan', stage: 2 },
      social: { ...s.social, karma: -70 },
      family: [...s.family, kid, { ...kid, id: 'child_1' }],
      ownSect: { name: 'Thanh Vân Tông', lineage: 'tien', rules: [], founded: 60, members: 10, treasury: 0, buildings: {} },
    });
    const p = rebirthPoints(rich, content);
    const by = Object.fromEntries(p.lines.map((l) => [l.label, l.points]));
    const ki = content.cultivation.realms.realms.findIndex((r) => r.id === 'kim_dan');
    expect(by['Cảnh giới']).toBe(ki * b.perRealm + 2 * b.perStage);
    expect(by['Đại ác']).toBe(b.karmaPoints);
    expect(by['Con cái']).toBe(2 * b.perChild);
    expect(by['Khai tông lập phái']).toBe(b.ownSect);
    expect(p.total).toBe(p.lines.reduce((t, l) => t + l.points, 0));
    expect(lifeRecap(rich, content).map((l) => l.label)).toEqual(expect.arrayContaining(['Cảnh giới', 'Tông môn', 'Con cái']));
  });

  it('highlights are the rare log lines, newest last', () => {
    const s = dead({ log: [
      { age: 10, lines: [{ text: 'Một', tone: 'rare' }, { text: 'Thường', tone: 'normal' }] },
      { age: 20, lines: [{ text: 'Hai', tone: 'rare' }] },
      { age: 30, lines: [{ text: 'Ba', tone: 'rare' }] },
    ] });
    expect(lifeHighlights(s, 2)).toEqual(['20 tuổi: Hai', '30 tuổi: Ba']);
  });

  it('credits each life once; a quỷ tu dying later only adds the difference', () => {
    const store = fakeStore();
    expect(creditRebirth(store, 'seed-a', 12).gained).toBe(12);
    expect(creditRebirth(store, 'seed-a', 12).gained).toBe(0);
    expect(creditRebirth(store, 'seed-a', 20).gained).toBe(8);
    expect(creditRebirth(store, 'seed-b', 5).meta.rebirthPoints).toBe(25);
    expect(readMeta(store)).toMatchObject({ rebirthPoints: 25, livesPlayed: 0 });
  });
});

describe('Cầu đầu thai (task 5b.9)', () => {
  it('rare origins cost points; common ones and fate are free', () => {
    const opts = Object.fromEntries(originOptions(content, 15).map((o) => [o.id, o]));
    expect(opts.nong_dan).toEqual({ id: 'nong_dan', cost: 0, affordable: true });
    expect(opts.quan_gia).toMatchObject({ cost: 10, affordable: true });
    expect(opts.tu_tien_gia_toc).toMatchObject({ cost: 30, affordable: false });
    expect(newLifeCost(content, undefined)).toBe(0);
    expect(newLifeCost(content, 'tu_tien_gia_toc')).toBe(30);
  });

  it('the price is paid when the new life is confirmed', () => {
    const store = fakeStore();
    creditRebirth(store, 'a', 40);
    expect(recordNewLife(store, 30)).toMatchObject({ rebirthPoints: 10, livesPlayed: 1 });
  });
});
