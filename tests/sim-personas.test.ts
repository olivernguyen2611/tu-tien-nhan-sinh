import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { devMeetKind, devSetPhase, devSetWorldVar } from '../src/systems/dev';
import { relationGroup } from '../src/systems/acquaintances';
import { formatPersonaTable, MORTAL_PROFILES, simulateLife, simulateMany } from '../src/systems/simulate';

const content = loadContent();

describe('9.8 persona phàm nhân', () => {
  it('each persona lives a whole life and reports the new numbers', () => {
    const rows = MORTAL_PROFILES.map((profile) => ({ profile, report: simulateMany(content, 2, 'p98', { profile }).report }));
    for (const { report } of rows) {
      expect(report.stuck).toBe(0);
      expect(report.activityKinds).toBeGreaterThan(0);
      expect(report.eventfulShare).toBeGreaterThan(0);
      expect(Object.keys(report.causeByTier ?? {}).length).toBeGreaterThan(0);
    }
    const table = formatPersonaTable(rows);
    expect(table.split('\n')).toHaveLength(MORTAL_PROFILES.length + 1);
    expect(table).toContain('Hiệp khách');
  });

  it('is deterministic and the scholar takes the quan lộ', () => {
    const a = simulateLife(content, 'det', { profile: 'thu_sinh' });
    expect(simulateLife(content, 'det', { profile: 'thu_sinh' })).toEqual(a);
    expect(a.activityKinds).toBeGreaterThanOrEqual(1);
  });
});

describe('9.8 dev mode', () => {
  const life = createLife({ seed: 'dev98' }, content);

  it('turns the thời cuộc and sets a world variable', () => {
    const s = devSetPhase(life, content, 'loan_the');
    expect(s.times?.phase).toBe('loan_the');
    expect(devSetWorldVar(s, content, 'harvest', 5).times?.vars.harvest).toBe(5);
  });

  it('adds an acquaintance of a chosen kind', () => {
    const kind = content.relations!.kinds.find((k) => k.group === 'thu_dich')!;
    const s = devMeetKind(life, content, kind.id);
    const n = s.npcs.at(-1)!;
    expect(n.kind).toBe(kind.id);
    expect(relationGroup(s, content, n)).toBe('thu_dich');
  });
});
