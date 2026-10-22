import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { resolveChoice } from '../src/systems/events/engine';
import { ageFamily } from '../src/systems/relationships';
import { lifeSummary } from '../src/systems/time';
import { earnedAchievements, lifeBadges } from '../src/systems/achievements';
import { lifeEnding } from '../src/systems/chronicle';
import { commitCrime } from '../src/systems/law';

const content = loadContent();

function adult(age = 30, patch: Partial<GameState> = {}): GameState {
  const b = createLife({ seed: 'leaving' }, content);
  return { ...b, tier: 'pham_gian', character: { ...b.character, age }, money: { ...b.money, silver: 300 }, log: [...b.log, { age, lines: [] }], ...patch };
}

describe('10.10 ra đi và kết đời phàm', () => {
  it('quy ẩn opens late in life and ends it with its own summary, badge and ending', () => {
    expect(activityViews(adult(40), content).map((v) => v.id)).not.toContain('quy_an');
    let s = doActivity(adult(60), content, 'quy_an')!.state;
    expect(s.events.pending).toBe('ld_quy_an');
    s = resolveChoice(s, content, 0).state;
    expect(s.alive).toBe(false);
    expect(s.death?.cause).toBe('hermit');
    expect(lifeSummary(s, content)!.causeText).toContain('Quy ẩn');
    expect(lifeBadges(s, content, 1).map((b) => b.id)).toContain('an_si_son_lam');
    expect(lifeEnding(s, content, 1)).toBe('quy_an_son_lam');
  });

  it('xuất gia can end the life or keep it as tu tại gia', () => {
    const s = doActivity(adult(20), content, 'xuat_gia')!.state;
    expect(resolveChoice(s, content, 0).state.death?.cause).toBe('monk');
    const home = resolveChoice(s, content, 1).state;
    expect(home.alive).toBe(true);
    expect(home.flags.tu_tai_gia).toBe(true);
  });

  it('moving far cools old ties and makes the life tha hương', () => {
    const b = adult();
    const s = doActivity(b, content, 'chuyen_nha_xa')!.state;
    expect(s.flags.tha_huong).toBe(true);
    const before = b.npcs.filter((n) => n.alive && n.affinity > 20);
    for (const n of before) expect(s.npcs.find((x) => x.id === n.id)!.affinity).toBeLessThan(n.affinity);
  });

  it("a parent's death brings the tang lễ", () => {
    const b = adult();
    const s = ageFamily({ ...b, family: b.family.map((r) => (r.role === 'father' ? { ...r, lifespan: r.age + 1 } : r)) }, content);
    expect(s.events.followUps.some((f) => f.event === 'ld_tang_cha')).toBe(true);
  });

  it('a thief who is never caught earns his own badge', () => {
    let s = adult();
    for (let i = 0; i < 40 && (s.law?.crimes ?? 0) < 10; i++) {
      const next = commitCrime({ ...s, character: { ...s.character, age: 30 + i } }, content, 'moc_tui');
      if (next.events.pending) continue; // caught: try another year from the old state
      s = next;
    }
    expect(s.law?.crimes ?? 0).toBeGreaterThanOrEqual(10);
    const dead: GameState = { ...s, alive: false, death: { age: s.character.age, cause: 'old_age', epitaph: '' } };
    expect(lifeBadges(dead, content, 1).map((b) => b.id)).toContain('ten_trom_vo_hinh');
    expect(earnedAchievements(dead, content, 1).map((a) => a.id)).toContain('pham_bong_ma');
  });
});
