import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { advanceYear, createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { disciples, maxDisciples, recruitBlocked, recruitDisciple, teachDisciple } from '../src/systems/disciples';

const content = loadContent();
const cfg = content.balance.disciples;

function master(realm = 'truc_co', age = 60): GameState {
  const b = createLife({ seed: 'master' }, content);
  return {
    ...b,
    character: { ...b.character, age },
    aptitudes: { ...b.aptitudes, comprehension: 50 },
    log: [...b.log, { age, lines: [] }],
    events: { ...b.events, pending: null },
    cult: { ...b.cult, realm, stage: 0, progress: 10, lifespan: 300, root: { grade: 'song', elements: ['kim', 'hoa'], body: null }, technique: 'tang_phong_kiem_kinh', lineage: 'tien' },
  };
}

describe('thu đồ đệ (task 4.9)', () => {
  it('from Trúc Cơ, more disciples as the realm rises; one recruit a year', () => {
    expect(recruitBlocked(master('luyen_khi'), content)).toContain('Trúc Cơ');
    expect(maxDisciples(master('kim_dan'), content)).toBe(cfg.maxByRealm.kim_dan);
    const r = recruitDisciple(master(), content)!;
    const d = disciples(r.state)[0];
    expect(d.role).toBe(content.disciples.role);
    expect(d.root).toBe(true);
    expect(d.realm).toBe('luyen_khi');
    expect(d.age).toBeGreaterThanOrEqual(cfg.age[0]);
    expect(d.aptitude).toBeGreaterThanOrEqual(cfg.aptitude[0]);
    expect(recruitBlocked(r.state, content)).toContain('chỉ dạy nổi 1');
    const kd = recruitDisciple(master('kim_dan'), content)!.state;
    expect(recruitBlocked(kd, content)).toContain('Năm nay');
  });

  it('teaching once a year: the disciple grows, owes more; the teacher learns a little', () => {
    let s = recruitDisciple(master(), content)!.state;
    const d = disciples(s)[0];
    s = { ...s, npcs: s.npcs.map((n) => (n.id === d.id ? { ...n, realm: 'luyen_khi', progress: 0 } : n)) };
    const t = teachDisciple(s, content, d.id)!.state;
    const after = t.npcs.find((n) => n.id === d.id)!;
    expect(after.progress).toBeCloseTo(cfg.teachProgress * (0.5 + 0.5));
    expect(after.favor).toBe(cfg.teachFavor);
    expect(t.cult.progress).toBeCloseTo(10 + cfg.teacherProgress);
    expect(teachDisciple(t, content, d.id)).toBeNull();
    const next = advanceYear(t, content);
    expect(teachDisciple(next, content, d.id)).not.toBeNull();
  });
});
