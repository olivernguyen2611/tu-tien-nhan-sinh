import { describe, expect, it } from 'vitest';
import { loadContent, type Content } from '../src/core/content';
import { createLife } from '../src/core/state';
import { ActivitySchema } from '../src/core/schemas';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { makeSave, migrate } from '../src/systems/save';
import { validateContent } from '../src/core/validate';

const content = loadContent();
const adult = (seed: string, patch: Partial<GameState> = {}): GameState => {
  const s = createLife({ seed }, content);
  return { ...s, destiny: { ...s.destiny, confirmed: true }, character: { ...s.character, age: 30 }, money: { silver: 100, spiritStones: 0 }, ...patch };
};
const withActivity = (a: unknown): Content => ({ ...content, activities: [...(content.activities ?? []), ActivitySchema.parse(a)] });

describe('Khung Hoạt động (9.2)', () => {
  it('loads Ngao du and the three sample activities from JSON alone', () => {
    const ids = (content.activities ?? []).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['ngao_du', 'song_bac', 'thu_quan', 'luyen_quyen_som']));
  });

  it('the menu follows conditions: a child sees no sòng bạc, a cultivator no thư quán', () => {
    const child = adult('menu-a', {});
    const kid = { ...child, character: { ...child.character, age: 9 } };
    expect(activityViews(kid, content).map((v) => v.id)).not.toContain('song_bac');
    const cultivator = { ...child, tier: 'tu_chan', cult: { ...child.cult, realm: 'luyen_khi' } };
    expect(activityViews(cultivator, content).map((v) => v.id)).not.toContain('thu_quan');
  });

  it('a check shows its chance; success and failure both change stats and the purse pays first', () => {
    const s = adult('bac');
    const v = activityViews(s, content).find((a) => a.id === 'song_bac')!;
    expect(v.chance).toBeGreaterThan(0);
    expect(v.cost).toBe('10 lượng bạc');
    const seen = new Set<boolean | null>();
    for (let i = 0; i < 30; i++) {
      const r = doActivity(adult(`bac-${i}`), content, 'song_bac')!;
      seen.add(r.success);
      if (r.success === false) expect(r.state.money.silver).toBe(90);
      else expect(r.state.money.silver).toBeGreaterThan(100);
      expect(r.state.log.at(-1)!.lines.at(-1)!.text.startsWith('Vào sòng bạc: ')).toBe(true);
    }
    expect(seen).toEqual(new Set([true, false]));
  });

  it('limits: twice a year for sòng bạc, then blocked until next year; cooldowns count in years', () => {
    let s = adult('lim');
    s = doActivity(s, content, 'song_bac')!.state;
    s = doActivity(s, content, 'song_bac')!.state;
    expect(doActivity(s, content, 'song_bac')).toBeNull();
    expect(activityViews(s, content).find((a) => a.id === 'song_bac')!.blocked).toContain('2 lần');
    const next = { ...s, character: { ...s.character, age: 31 } };
    expect(doActivity(next, content, 'song_bac')).not.toBeNull();
    const slow = withActivity({ ...content.activities!.find((a) => a.id === 'luyen_quyen_som')!, id: 'thu_cham', limit: { perYear: 1, cooldownYears: 3 } });
    const used = doActivity(adult('cd'), slow, 'thu_cham')!.state;
    expect(doActivity({ ...used, character: { ...used.character, age: 32 } }, slow, 'thu_cham')).toBeNull();
    expect(doActivity({ ...used, character: { ...used.character, age: 33 } }, slow, 'thu_cham')).not.toBeNull();
  });

  it('without money and without a free version it waits; startEvent opens an event', () => {
    const poor = adult('poor', { money: { silver: 0, spiritStones: 0 } });
    expect(activityViews(poor, content).find((a) => a.id === 'song_bac')!.blocked).toBe('Cần 10 lượng bạc.');
    const event = content.events.find((e) => e.id === 'sd_le_te_to')!;
    const c = withActivity({
      id: 'thu_mo_su_kien', group: 'ban_than', name: 'Thử', icon: '試', text: 'Thử.',
      outcomes: [{ text: 'Mở.', effects: { 'stat.happiness': 1 }, startEvent: event.id }],
    });
    const r = doActivity(adult('ev'), c, 'thu_mo_su_kien')!;
    expect(r.state.events.pending).toBe(event.id);
  });

  it('the validator rejects an outcome that changes no stat and an unknown event', () => {
    const files = { 'activities/x.json': [{ id: 'x_1', group: 'ban_than', name: 'X', icon: '甲', text: 'X.', outcomes: [{ text: 'Không gì.', effects: { silver: 5 }, startEvent: 'khong_co' }] }] };
    const msgs = validateContent(files).filter((p) => p.file === 'activities/x.json').map((p) => p.message);
    expect(msgs.some((m) => m.includes('không đổi chỉ số'))).toBe(true);
    expect(msgs.some((m) => m.includes('khong_co'))).toBe(true);
  });

  it('save v5 keeps the last Ngao du trip from an older save', () => {
    const life = adult('old-trip');
    const { activities: _a, ...rest } = life;
    const old = { ...rest, extremes: { ...life.extremes, lastLeisure: 30 } } as GameState;
    const moved = migrate({ ...makeSave(old, 1), saveVersion: 4 }, createLife({ seed: 'f' }, content)).life;
    expect(moved.activities?.last.ngao_du).toBe(30);
    expect(doActivity(moved, content, 'ngao_du')).toBeNull();
  });
});
