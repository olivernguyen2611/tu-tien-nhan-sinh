// Task 5.3 content: events of the founded sect (khiêu khích, phản đồ, đại bỉ, ma đạo công sơn…).
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { eventWeight, findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';
import { foundSect } from '../src/systems/ownSect';

const content = loadContent();
const ours = content.events.filter((e) => e.category === 'own_sect');

function elder(): GameState {
  const b = createLife({ seed: 'sect-events' }, content);
  return {
    ...b,
    character: { ...b.character, age: 120 },
    money: { silver: 0, spiritStones: 500 },
    log: [...b.log, { age: 120, lines: [] }],
    events: { ...b.events, followUps: [] },
    cult: { ...b.cult, realm: 'kim_dan', lineage: 'tien', technique: 'tang_phong_kiem_kinh', root: { grade: 'song', elements: ['kim', 'hoa'] } },
  };
}
const founded = (members = 50): GameState => {
  const s = foundSect(elder(), content, { name: 'Thanh Tiêu Tông', rules: [] })!.state;
  return { ...s, ownSect: { ...s.ownSect!, members } };
};

describe('sự kiện tông môn (task 5.3)', () => {
  it('ships a dozen events, all of them only for a founded sect', () => {
    expect(ours.length).toBeGreaterThanOrEqual(12);
    for (const e of ours) expect(e.conditions.ownSect?.has, e.id).toBe(true);
    for (const e of ours) expect(eventWeight(elder(), content, e), e.id).toBe(0);
  });

  it('a big sect meets most of them; the spy only comes as a follow-up', () => {
    const s = founded();
    const live = ours.filter((e) => eventWeight(s, content, e) > 0).map((e) => e.id);
    expect(live.length).toBeGreaterThanOrEqual(10);
    expect(live).not.toContain('bt_gian_te');
    expect(ours.some((e) => e.choices.some((c) => (c.result ?? c.fail)?.effects.followUp?.event === 'bt_gian_te'))).toBe(true);
  });

  it('a small sect does not hold a liên tông đại bỉ', () => {
    expect(eventWeight(founded(10), content, findEvent(content, 'bt_lien_tong_dai_bi')!)).toBe(0);
  });

  it('ma đạo công sơn: the fight is against the sect; holding out needs Hộ Sơn Đại Trận level 2', () => {
    const ev = findEvent(content, 'bt_ma_dao_cong_son')!;
    expect(ev.choices[0].result!.fight!.foe.againstSect).toBe(true);
    const s = { ...founded(), events: { ...founded().events, pending: ev.id } };
    expect(visibleChoices(s, content, ev).some((v) => v.index === 1 && !v.disabled)).toBe(false);
    const walled = { ...s, ownSect: { ...s.ownSect!, buildings: { ho_son_dai_tran: 2 } } };
    expect(visibleChoices(walled, content, ev).some((v) => v.index === 1 && !v.disabled)).toBe(true);
  });

  it('paying off the demons empties the treasury and costs disciples', () => {
    const s = { ...founded(), events: { ...founded().events, pending: 'bt_ma_dao_cong_son' } };
    const r = resolveChoice(s, content, 2).state;
    expect(r.ownSect!.treasury).toBe(Math.max(0, s.ownSect!.treasury - 150));
    expect(r.ownSect!.members).toBe(s.ownSect!.members - 5);
  });
});
