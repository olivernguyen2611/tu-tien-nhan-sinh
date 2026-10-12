import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { foundSect, ownSectYear, prestigeOf, prestigeTier } from '../src/systems/ownSect';
import { elderViews, rewardElder } from '../src/systems/sectElders';

const content = loadContent();

function master(): GameState {
  const b = createLife({ seed: 'master' }, content);
  const s: GameState = {
    ...b,
    character: { ...b.character, age: 120 },
    money: { ...b.money, spiritStones: 1000 },
    log: [...b.log, { age: 120, lines: [] }],
    events: { ...b.events, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'kim_dan', stage: 0, lifespan: 400 },
  };
  return foundSect(s, content, { name: 'Thanh Tiêu Tông', rules: [] })!.state;
}

describe('phía tông chủ (task 5c.7)', () => {
  it('founding names the elders and starts the standing', () => {
    const s = master();
    expect(s.ownSect!.elders).toHaveLength(content.balance.founding.elders.count);
    const names = s.ownSect!.elders!.map((id) => s.npcs.find((n) => n.id === id)!.name);
    expect(new Set([...names, s.character.name]).size).toBe(names.length + 1);
    expect(prestigeTier(s, content).name).toBe('Vô danh');
    expect(prestigeOf(s, content)).toBe(content.balance.founding.prestige.start);
  });

  it('rewarding an elder costs treasury, raises bond and standing, once a year', () => {
    let s = master();
    s = { ...s, ownSect: { ...s.ownSect!, treasury: 200 } };
    const e = elderViews(s, content)[0]!;
    const r = rewardElder(s, content, e.npc.id)!;
    expect(r.state.ownSect!.treasury).toBe(200 - content.balance.founding.elders.rewardCost);
    expect(r.state.npcs.find((n) => n.id === e.npc.id)!.affinity).toBeGreaterThan(e.npc.affinity);
    expect(prestigeOf(r.state, content)).toBeGreaterThan(prestigeOf(s, content));
    expect(rewardElder(r.state, content, e.npc.id)).toBeNull();
  });

  it('standing follows disciples and buildings over the years', () => {
    let s = master();
    s = { ...s, ownSect: { ...s.ownSect!, members: 600, buildings: { hoi_dan: 3 } } };
    const before = prestigeOf(s, content);
    for (let i = 0; i < 12; i++) s = ownSectYear({ ...s, character: { ...s.character, age: s.character.age + 1 } }, content);
    expect(prestigeOf(s, content)).toBeGreaterThan(before);
  });

  it('master-side events resolve and move prestige', () => {
    const s0 = master();
    s0.ownSect!.members = 100;
    for (const id of ['ot_tong_ban_den_tham', 'ot_de_tu_xuong_nui', 'ot_truong_lao_bat_dong', 'ot_dai_dien_thu_do']) {
      const e = findEvent(content, id)!;
      const base: GameState = { ...s0, events: { pending: id, history: {}, followUps: [], npc: null } };
      const n = visibleChoices(base, content, e).length;
      expect(n).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < n; i++) resolveChoice(base, content, i);
    }
  });
});
