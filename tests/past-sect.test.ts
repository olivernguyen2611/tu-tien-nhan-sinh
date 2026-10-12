import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife, fillTemplate } from '../src/core/state';
import type { GameState, PastSectRecord } from '../src/core/types';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { resolveChoice } from '../src/systems/events/engine';
import { meets as conditionsMet } from '../src/systems/events/conditions';
import { applyPastSect, nextPastSectRecord, pastSectFor } from '../src/systems/pastSect';
import { readMeta, recordPastSect, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const cfg = content.balance.pastSect;
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const record: PastSectRecord = { world: content.world.id, name: 'Thanh Vân Các', lineage: 'tien', founder: 'Lý Trường Ca', members: 100, lives: 0 };
const born = (seed: string, past: PastSectRecord | null = record) => confirmDestiny(rollDestiny(createLife({ seed, pastSect: past }, content), content), content);
const ev = (id: string) => content.events.find((e) => e.id === id)!;

describe('Gặp lại tông môn đời trước (task 5b.7)', () => {
  it('a life that ran a sect leaves it to later lives; it fades life by life', () => {
    const founder = born('a', null);
    const ran: GameState = { ...founder, ownSect: { name: 'Huyền Nguyệt Tông', lineage: 'ma', rules: [], founded: 120, members: 60, treasury: 0, buildings: {} } };
    const rec = nextPastSectRecord(null, ran, content)!;
    expect(rec).toMatchObject({ name: 'Huyền Nguyệt Tông', lineage: 'ma', founder: founder.character.name, members: 60, lives: 0 });
    // A life without one carries the old sect one life further, until maxLives.
    let r: PastSectRecord | null = rec;
    for (let i = 1; i < cfg.maxLives; i++) {
      r = nextPastSectRecord(r, founder, content);
      expect(r!.lives).toBe(i);
    }
    expect(nextPastSectRecord(r, founder, content)).toBeNull();
    // A weekly challenge changes nothing.
    expect(nextPastSectRecord(rec, { ...ran, challenge: { week: 'w', id: 'x', try: 1 } }, content)).toBe(rec);
  });

  it('the next life knows of it (members shrunk), only in the same world', () => {
    const s = born('b');
    expect(s.pastSect).toEqual({ name: 'Thanh Vân Các', lineage: 'tien', founder: 'Lý Trường Ca', members: Math.round(100 * cfg.decay), status: 'unknown' });
    expect(pastSectFor({ ...record, world: 'khac' }, content)).toBeNull();
    expect(born('c', null).pastSect).toBeNull();
    expect(fillTemplate('{pastSect} của {pastFounder}', s, content)).toBe('Thanh Vân Các của Lý Trường Ca');
  });

  it('the save meta keeps it', () => {
    const store = fakeStore();
    expect(readMeta(store).pastSect).toBeNull();
    recordPastSect(store, record);
    expect(readMeta(store).pastSect).toEqual(record);
  });

  it('events: met, then claimed back once strong enough', () => {
    const s = { ...born('d'), character: { ...born('d').character, age: 20 } };
    expect(conditionsMet(s, ev('tm_cu_son_mon').conditions, content)).toBe(true);
    expect(conditionsMet(s, ev('tm_cu_ke_vi').conditions, content)).toBe(false);
    const r = resolveChoice({ ...s, events: { ...s.events, pending: 'tm_cu_son_mon' } }, content, 2);
    expect(r.state.pastSect!.status).toBe('spurned');
    const met = applyPastSect(s, content, 'met').state;
    expect(conditionsMet(met, ev('tm_cu_son_mon').conditions, content)).toBe(false);
    const strong: GameState = { ...met, cult: { ...met.cult, realm: 'kim_dan' }, sect: { ...met.sect, id: content.sects[0].id } };
    expect(conditionsMet(strong, ev('tm_cu_ke_vi').conditions, content)).toBe(true);
    const claimed = resolveChoice({ ...strong, events: { ...strong.events, pending: 'tm_cu_ke_vi' } }, content, 0).state;
    expect(claimed.pastSect!.status).toBe('claimed');
    expect(claimed.ownSect).toMatchObject({ name: 'Thanh Vân Các', lineage: 'tien', members: Math.round(met.pastSect!.members * cfg.claimShare), treasury: cfg.claimTreasury });
    expect(claimed.sect.id).toBeNull();
    // Claiming twice, or with a sect of one's own, does nothing more.
    expect(applyPastSect(claimed, content, 'claimed').state).toBe(claimed);
  });
});
