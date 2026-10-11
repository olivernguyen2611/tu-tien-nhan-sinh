import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/core/validate';
import balance from '../content/config/balance.json';
import realms from '../content/realms.json';
import roots from '../content/roots.json';
import aptitudes from '../content/aptitudes.json';
import { cultivation } from './fixtures';

const files = () => structuredClone({ 'config/balance.json': balance, 'realms.json': realms, 'roots.json': roots, 'aptitudes.json': aptitudes });
const errors = (f: Record<string, unknown>) => validateContent(f).filter((p) => p.level === 'error').map((p) => p.message);

describe('realms, roots, paths, crafts (task 2.1)', () => {
  it('shipped tables are valid and consistent with balance.json', () => {
    expect(errors(files())).toEqual([]);
  });

  it('has the approved shape', () => {
    expect(cultivation.realms.realms.map((r) => r.id)).toEqual(['pham_nhan', 'luyen_khi', 'truc_co', 'kim_dan', 'nguyen_anh', 'hoa_than']);
    expect(cultivation.realms.realms[1].stages).toHaveLength(9);
    expect(cultivation.roots.bodies).toHaveLength(11);
    expect(cultivation.aptitudes.paths).toHaveLength(5);
    expect(cultivation.aptitudes.crafts.filter((c) => c.mortal).map((c) => c.id)).toEqual(['alchemy', 'farming']);
  });

  it('root grade weights sum to 100%', () => {
    const sum = Object.values(balance.roots.gradeWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100);
  });

  it('every variant element is beaten by some element', () => {
    for (const e of cultivation.roots.elements) {
      expect(cultivation.roots.elements.some((o) => o.beats.includes(e.id)), e.id).toBe(true);
    }
  });

  it('reports a balance entry missing for a realm', () => {
    const f = files();
    delete (f['config/balance.json'].realms as Record<string, unknown>).kim_dan;
    expect(errors(f)).toContain('realms: thiếu số liệu cho "kim_dan"');
  });

  it('reports an element beating an unknown element', () => {
    const f = files();
    f['roots.json'].elements[0].beats.push('go');
    expect(errors(f)).toContain('hệ "kim" khắc hệ không tồn tại "go"');
  });

  it('reports an event naming an unknown realm', () => {
    const f = {
      ...files(),
      'worlds/w/events/a.json': [{
        id: 'e1', category: 'x', title: 't', text: 'x', weight: 1, conditions: { realm: { min: 'luyen_hu' } },
        choices: [{ text: 'a', result: { text: 'b', effects: { 'stat.happiness': 1 } } }],
      }],
    };
    expect(errors(f)).toContain('sự kiện "e1" nhắc tới cảnh giới không tồn tại "luyen_hu"');
  });
});
