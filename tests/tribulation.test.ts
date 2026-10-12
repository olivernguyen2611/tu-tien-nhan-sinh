import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { Rng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import { majorBreakthroughInfo, majorSuccess } from '../src/systems/cultivation';
import { addItems } from '../src/systems/items';
import { tribulationPreview, undergoTribulation } from '../src/systems/tribulation';

const content = loadContent();
const cfg = content.balance.tribulation;
const KD = cfg.realms.kim_dan!;

function cultivator(health = 90, physique = 50, elements = ['moc', 'hoa']): GameState {
  const b = createLife({ seed: 'trib' }, content);
  return {
    ...b,
    character: { ...b.character, age: 80 },
    stats: { ...b.stats, health },
    aptitudes: { ...b.aptitudes, physique, luck: 50 },
    traits: [], talents: [], flags: {}, inventory: {},
    log: [...b.log, { age: 80, lines: [] }],
    cult: { ...b.cult, realm: 'truc_co', stage: 3, progress: 100, lifespan: 220, foundation: 'trung', root: { grade: 'song', elements }, technique: 'tang_phong_kiem_kinh', lineage: 'tien' },
  };
}

describe('thiên kiếp (task 4.5)', () => {
  it('the breakthrough sheet warns of the strikes and their cost', () => {
    const p = majorBreakthroughInfo(cultivator(), content)!.tribulation!;
    expect(p.strikes).toBe(KD.strikes);
    expect(p.damage).toBe(Math.round(KD.power * (KD.strikes - 1 + cfg.finalMul)));
    expect(tribulationPreview(cultivator(), content, 'truc_co')).toBeNull();
  });

  it('armor, Căn cốt and a Lôi root soften it', () => {
    const base = tribulationPreview(cultivator(), content, 'kim_dan')!.damage;
    expect(tribulationPreview(addItems(cultivator(), ['huyen_thiet_giap']), content, 'kim_dan')!.damage).toBeLessThan(base);
    expect(tribulationPreview(cultivator(90, 80), content, 'kim_dan')!.damage).toBeLessThan(base);
    expect(tribulationPreview(cultivator(90, 50, ['loi']), content, 'kim_dan')!.reducePct).toBe(10);
  });

  it('surviving tempers the body; a weak body dies under it unless a jade breaks', () => {
    const ok = undergoTribulation(cultivator(100, 70), content, 'kim_dan', new Rng('a'));
    expect(ok.survived).toBe(true);
    expect(ok.state.aptitudes.physique).toBe(70 + cfg.survivePhysique);
    expect(ok.state.stats.health).toBeLessThan(100);
    const weak = undergoTribulation(cultivator(10), content, 'kim_dan', new Rng('b'));
    expect(weak.survived).toBe(false);
    const saved = undergoTribulation(addItems(cultivator(10), ['ho_than_ngoc_boi']), content, 'kim_dan', new Rng('b'));
    expect(saved.survived).toBe(true);
    expect(saved.state.inventory.ho_than_ngoc_boi ?? 0).toBe(0);
  });

  it('a big breakthrough that kills by thiên kiếp ends the life with its own cause', () => {
    const s = cultivator(5);
    const r = majorSuccess(s, s, content, new Rng('c'), { id: 'kim_dan', name: 'Kim Đan' }, 5);
    expect(r.success).toBe(false);
    expect(r.state.alive).toBe(false);
    expect(r.state.death!.cause).toBe('tribulation');
    const ok = majorSuccess(cultivator(100, 80), cultivator(100, 80), content, new Rng('d'), { id: 'kim_dan', name: 'Kim Đan' }, 5);
    expect(ok.state.cult.realm).toBe('kim_dan');
  });
});
