import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';

const content = loadContent();
const flagsSet = new Set(content.events.flatMap((e) => [...JSON.stringify(e).matchAll(/"setFlags":\[([^\]]*)\]/g)].flatMap((m) => m[1].match(/[a-z0-9_]+/g) ?? [])));

describe('Nợ cũ (tổng tra): a choice made long ago comes back', () => {
  it('each follow-up reads a flag that another event sets, and comes once a life', () => {
    const pack = content.events.filter((e) => e.id.startsWith('nc_'));
    expect(pack.length).toBeGreaterThanOrEqual(12);
    for (const e of pack) {
      expect(e.oncePerLife, e.id).toBe(true);
      const own = new Set((JSON.stringify(e).match(/"setFlags":\[[^\]]*\]/g) ?? []).join());
      for (const f of e.conditions.flagsAll ?? []) {
        expect(flagsSet.has(f), `${e.id}: ${f}`).toBe(true);
        expect([...own].join().includes(`"${f}"`), `${e.id} sets its own flag`).toBe(false);
      }
    }
  });
});
