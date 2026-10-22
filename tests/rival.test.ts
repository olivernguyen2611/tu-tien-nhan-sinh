import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { rollYearEvent } from '../src/systems/events/engine';
import { rivalNpc, rivalYear } from '../src/systems/rival';
import { worldEventsYear } from '../src/systems/worldEvents';

const content = loadContent();
const cfg = content.balance.rival!;

function foundation(seed: string, age = 40): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'truc_co', stage: 1, lifespan: 220 },
  };
}

describe('13.4 Kình địch suốt đời', () => {
  it('no rival before the realm', () => {
    const s = foundation('kd0');
    expect(rivalYear({ ...s, cult: { ...s.cult, realm: 'luyen_khi' } }, content).rival ?? null).toBeNull();
  });

  it('a Trúc Cơ cultivator gets a rival and the first meeting, about them', () => {
    const s = rivalYear(foundation('kd1'), content);
    const r = rivalNpc(s)!;
    expect(r.rival).toBe(true);
    expect(s.events.followUps[0]).toEqual({ event: cfg.steps[0], atAge: 40, npc: r.id });
    const rolled = rollYearEvent(s, content);
    expect(rolled.events.pending).toBe(cfg.steps[0]);
    expect(rolled.events.npc).toBe(r.id);
  });

  it('the chain walks on every few years, the rival keeps pace, then ends', () => {
    let s = rivalYear(foundation('kd2'), content);
    const steps: string[] = [s.events.followUps[0].event];
    for (let age = 41; age < 300 && s.rival!.step < cfg.steps.length; age++) {
      s = rivalYear({ ...s, character: { ...s.character, age }, events: { ...s.events, followUps: [] } }, content);
      if (s.events.followUps[0]) steps.push(s.events.followUps[0].event);
    }
    expect(steps).toEqual(cfg.steps);
    // At luận đạo the rival stood a realm ahead.
    expect(rivalNpc(s)!.realm).not.toBe('pham_nhan');
  });
});

describe('13.4 Thời cuộc nghiêng sự kiện thiên hạ', () => {
  it('high Chính ma căng thẳng makes Tiên Ma đại chiến likelier', () => {
    const count = (tension: number) => {
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const b = createLife({ seed: `we${i}` }, content);
        const s: GameState = { ...b, character: { ...b.character, age: 30 }, times: { ...b.times!, vars: { ...b.times!.vars, tension } } };
        if (worldEventsYear(s, content).world?.active?.id === 'tien_ma_dai_chien') n++;
      }
      return n;
    };
    expect(count(90)).toBeGreaterThan(count(10));
  });
});
