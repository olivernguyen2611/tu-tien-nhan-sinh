import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { meets } from '../src/systems/events/conditions';
import { knowledgeYear } from '../src/systems/knowledge';

const content = loadContent();
const history = (content.knowledge ?? []).filter((e) => e.group === 'lich_su');
const flagsSet = new Set(content.events.flatMap((e) => [...JSON.stringify(e).matchAll(/"setFlags":\[([^\]]*)\]/g)].flatMap((m) => (m[1].match(/[a-z0-9_]+/g) ?? []))));

describe('Sử Thương Lan (tổng tra)', () => {
  it('every history entry can be found: each flag source is set by some event', () => {
    expect(history.length).toBeGreaterThanOrEqual(12);
    for (const e of history) {
      const sure = e.sources.filter((s) => s.kind === 'flag' && (s.chance ?? 0) >= 1);
      expect(sure.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources.filter((x) => x.kind === 'flag')) expect(flagsSet.has(s.id!), `${e.id}: ${s.id}`).toBe(true);
    }
  });

  it('a lore flag writes its entry into the Sổ tri thức that year', () => {
    const b = createLife({ seed: 'stl', knowledge: [] }, content);
    const s: GameState = { ...b, flags: { ...b.flags, su_doc_bia_hoa_uoc: true }, log: [...b.log, { age: b.character.age, lines: [] }] };
    const out = knowledgeYear(s, content);
    expect(out.knowledge).toContain('su_thuong_lan_lich');
  });

  it('the pieces fit together only for a life born knowing them (past lives)', () => {
    const ev = content.events.find((e) => e.id === 'stl_ghep_su')!;
    const pieces = ['su_thai_co_than_yeu', 'su_thong_thien_lo', 'su_doan_thien', 'su_goc_ma_dao'];
    const b = createLife({ seed: 'stl2', knowledge: pieces }, content);
    const kimDan: GameState = { ...b, character: { ...b.character, age: 80 }, cult: { ...b.cult, realm: 'kim_dan' }, tier: 'tu_chan' };
    expect(meets(kimDan, ev.conditions, content)).toBe(true);
    expect(meets({ ...kimDan, knowledge: pieces.slice(1) }, ev.conditions, content)).toBe(false);
  });
});
