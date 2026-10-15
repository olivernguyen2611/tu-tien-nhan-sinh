import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { createNpc, npcById, npcInfo } from '../src/systems/npcs';
import { continueAsHeir } from '../src/systems/heir';
import { countsForRecords, markDevLife } from '../src/systems/dev';

const content = loadContent();
const born = createLife({ seed: 'npc-info', originId: 'nong_dan' }, content);
const life: GameState = { ...born, character: { ...born.character, age: 20 } };

function meet(affinity: number, realm = 'luyen_khi') {
  const { state, id } = createNpc(life, content, { role: 'bằng hữu', root: true, realm, affinity });
  return { state, n: npcById(state, id)! };
}

describe('NPC info card (9.R6a)', () => {
  it('each layer of thiện cảm shows more', () => {
    const [quen, than, triKy] = content.balance.npcs.infoTiers!;
    const labels = (a: number) => { const { state, n } = meet(a); return npcInfo(state, content, n).rows.map((r) => r.label); };
    expect(npcInfo(meet(quen - 1).state, content, meet(quen - 1).n).tier).toBe(0);
    expect(labels(quen - 1)).not.toContain('Thiện cảm');
    expect(labels(quen)).toContain('Thiện cảm');
    expect(labels(than - 1)).not.toContain('Ân · Oán');
    expect(labels(than)).toContain('Ân · Oán');
    expect(labels(than)).not.toContain('Thọ nguyên');
    expect(labels(triKy)).toContain('Thọ nguyên');
  });

  it('a realm far above a mortal cannot be read', () => {
    const { state, n } = meet(50, 'kim_dan');
    const info = npcInfo(state, content, n);
    expect(info.realm).toBeNull();
    expect(info.rows[0].value).toBe(content.npcTraits.info!.unseen);
    expect(npcInfo(meet(50, 'luyen_khi').state, content, meet(50, 'luyen_khi').n).realm).not.toBeNull();
  });
});

describe('dev life (9.R6a)', () => {
  it('a marked life earns no records, and the mark passes to the heir', () => {
    expect(countsForRecords(life)).toBe(true);
    const dev = markDevLife(life);
    expect(countsForRecords(dev)).toBe(false);
    const child = { id: 'c1', role: 'child' as const, gender: 'nam' as const, name: 'Lý Nhất', age: 20, alive: true, lifespan: 70, affinity: 60, lastActions: {} };
    const dead: GameState = { ...dev, alive: false, death: { age: 60, cause: 'old_age', epitaph: '' }, family: [...dev.family, child] };
    expect(continueAsHeir(dead, content, 'c1').devUsed).toBe(true);
  });
});
