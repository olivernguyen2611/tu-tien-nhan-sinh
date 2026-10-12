import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { attemptMajorBreakthrough } from '../src/systems/cultivation';
import { buildIllusions, meetIllusion, needsHeartDemonTrial, optionChance } from '../src/systems/heartDemon';
import { createNpc, killNpc } from '../src/systems/npcs';

const content = loadContent();
const cfg = content.balance.heartDemon;

function peak(patch: Partial<GameState> = {}, seeds = 0): GameState {
  const b = createLife({ seed: 'tamma' }, content);
  return {
    ...b,
    character: { ...b.character, age: 80 },
    stats: { ...b.stats, health: 90 },
    aptitudes: { physique: 60, comprehension: 60, luck: 50, daoHeart: 60 },
    flags: {},
    log: [...b.log, { age: 80, lines: [] }],
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm: 'truc_co', stage: 3, progress: 100, lifespan: 220, foundation: 'trung', heartDemon: seeds,
      root: { grade: 'song', elements: ['moc', 'hoa'], body: null }, technique: 'tang_phong_kiem_kinh', lineage: 'tien' },
    ...patch,
  };
}

describe('tâm ma chiến (task 4.4)', () => {
  it('comes for tâm ma seeds, a weak đạo tâm or heavy bad karma; a clear heart goes straight to kết đan', () => {
    expect(needsHeartDemonTrial(peak(), content, 'kim_dan')).toBe(false);
    expect(needsHeartDemonTrial(peak({}, 1), content, 'kim_dan')).toBe(true);
    expect(needsHeartDemonTrial(peak({ aptitudes: { physique: 60, comprehension: 60, luck: 50, daoHeart: 20 } }), content, 'kim_dan')).toBe(true);
    expect(needsHeartDemonTrial(peak({}, 1), content, 'truc_co')).toBe(false);
    expect(attemptMajorBreakthrough(peak(), content)!.state.cult.coreForming).not.toBeNull();
    const r = attemptMajorBreakthrough(peak({}, 2), content)!;
    expect(r.state.cult.heartDemonTrial!.illusions).toHaveLength(cfg.rounds);
    expect(r.state.cult.coreForming).toBeNull();
  });

  it('illusions come from the life’s own past: dark deeds, the killed, the grudges', () => {
    let s = peak({ flags: { dung_lo_dinh: true } }, 2);
    const enemy = createNpc(s, content, { role: 'kẻ thù', grudge: 60, age: 40 });
    s = killNpc(enemy.state, content, enemy.id);
    const victim = s.npcs.find((n) => n.id === enemy.id)!;
    const ill = buildIllusions(s, content, new Rng('i'));
    expect(ill[0]).toBe(content.heartDemon.deeds.dung_lo_dinh);
    expect(ill.some((t) => t.includes(victim.name))).toBe(true);
    // A clean life meets only nameless fears.
    expect(buildIllusions(peak(), content, new Rng('j')).every((t) => content.heartDemon.illusions.fear.includes(t))).toBe(true);
  });

  it('more seeds make it harder; kháng tâm ma helps the chant', () => {
    expect(optionChance(peak({}, 4), content, 'face')).toBeLessThan(optionChance(peak({}, 1), content, 'face'));
  });

  it('passing clears seeds and goes on to kết đan; failing turns the demon on you', () => {
    let pass = attemptMajorBreakthrough(peak({}, 3), content)!.state;
    pass = { ...pass, aptitudes: { ...pass.aptitudes, daoHeart: 100 } };
    for (let i = 0; i < 3 && pass.cult.heartDemonTrial; i++) pass = meetIllusion({ ...pass, rng: new Rng(`p${i}`).getState() }, content, 'face').state;
    expect(pass.cult.heartDemonTrial).toBeNull();
    expect(pass.cult.heartDemon).toBe(3 - cfg.passClears);
    expect(pass.cult.coreForming).not.toBeNull();

    let fail = attemptMajorBreakthrough(peak({ aptitudes: { physique: 60, comprehension: 0, luck: 50, daoHeart: 0 } }, 6), content)!.state;
    let result = null;
    for (let i = 0; i < 3 && fail.cult.heartDemonTrial; i++) {
      const r = meetIllusion({ ...fail, rng: new Rng(`f${i}`).getState() }, content, 'slash');
      fail = r.state;
      result = r.result;
    }
    expect(result!.success).toBe(false);
    expect(fail.cult.heartDemonTrial).toBeNull();
    expect(fail.cult.realm).toBe('truc_co');
    expect(fail.cult.fails['truc_co:peak']).toBe(1);
  });
});
