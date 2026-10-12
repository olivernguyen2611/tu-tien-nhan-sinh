import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { yearlyGain } from '../src/systems/cultivation';
import { resolveChoice } from '../src/systems/events/engine';
import { migrate } from '../src/systems/save';
import { runSeclusion, seclude, seclusionView } from '../src/systems/seclusion';

const content = loadContent();
const cfg = content.balance.seclusion;

function cultivator(age = 30, patch: Partial<GameState['cult']> = {}): GameState {
  const b = createLife({ seed: 'seclude' }, content);
  return {
    ...b,
    character: { ...b.character, age },
    destiny: { ...b.destiny, confirmed: true },
    log: [...b.log, { age, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    paths: {},
    cult: { ...b.cult, realm: 'luyen_khi', stage: 0, progress: 0, lifespan: 130, root: { grade: 'ngu', elements: ['kim', 'moc', 'thuy', 'hoa', 'tho'], body: null }, technique: 'dan_khi_quyet', lineage: 'tien', ...patch },
  };
}

describe('bế quan (task 4.1)', () => {
  it('offers year counts by realm; mortals and a full bar cannot', () => {
    expect(seclusionView(cultivator(), content).options).toEqual(cfg.options.luyen_khi);
    expect(seclusionView({ ...cultivator(), cult: { ...cultivator().cult, realm: 'pham_nhan' } }, content).options).toEqual([]);
    expect(seclusionView(cultivator(30, { stage: 8, progress: 100 }), content).blocked).toContain('viên mãn');
  });

  it('cultivates ×1.5 with no events; the years pass and the door opens', () => {
    const s = cultivator();
    expect(yearlyGain({ ...s, seclusion: { until: 35, since: 30 } }, content) / yearlyGain(s, content)).toBeCloseTo(cfg.speedMul);
    const out = seclude(s, content, 5);
    expect(out.character.age).toBe(35);
    expect(out.seclusion).toBeNull();
    expect(out.events.pending).toBeNull();
    const lines = out.log.flatMap((y) => y.lines.map((l) => l.text));
    expect(lines.some((t) => t.startsWith('Ngươi đóng cửa động phủ'))).toBe(true);
    expect(lines.some((t) => t.startsWith('Xuất quan sau 5 năm'))).toBe(true);
    expect(out.ranking.prodigies.length).toBeGreaterThan(0); // the world went on
  });

  it('family age and may die while the door is shut', () => {
    const s = cultivator(60);
    const dying = { ...s, family: s.family.map((r) => (r.role === 'father' ? { ...r, age: 90, lifespan: 92 } : r)) };
    const out = seclude(dying, content, 5);
    expect(out.family.find((r) => r.role === 'father')!.alive).toBe(false);
  });

  it('opens early at the peak, or when lifespan runs short', () => {
    const peak = seclude(cultivator(30, { stage: 8, progress: 99 }), content, 5);
    expect(peak.character.age).toBeLessThan(35);
    expect(peak.log.at(-1)!.lines.some((l) => l.text.includes('viên mãn'))).toBe(true);
    const old = seclude(cultivator(120), content, 5);
    expect(old.character.age).toBe(130 - cfg.lifespanStop);
  });

  it('an event can close the door for fixed years (Bế quan khổ tu), sitting out the peak', () => {
    const s = cultivator(30, { stage: 8, progress: 100, fails: { 'luyen_khi:peak': 1 } });
    const r = resolveChoice({ ...s, events: { ...s.events, pending: 'binh_canh_luyen_khi' } }, content, 0);
    expect(r.state.seclusion).toMatchObject({ until: 33, fixed: true });
    const out = runSeclusion(r.state, content);
    expect(out.character.age).toBe(33);
    expect(out.seclusion).toBeNull();
    // Plain years also open the door by themselves.
    let t = r.state;
    for (let i = 0; i < 3; i++) t = advanceYear(t, content);
    expect(t.seclusion).toBeNull();
  });

  it('old saves are not in seclusion', () => {
    const { seclusion: _s, ...old } = cultivator();
    expect(migrate({ saveVersion: 1, gameVersion: '0', slot: 0, savedAt: '', life: old as unknown as GameState }).life.seclusion).toBeNull();
  });
});
