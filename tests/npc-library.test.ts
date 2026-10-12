import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { createNpc } from '../src/systems/npcs';
import { addToLibrary, defaultSetup, importPerson, personFromLife, personFromNpc, removeFromLibrary } from '../src/systems/npcLibrary';
import { readMeta, recordLibrary, type KeyValueStore } from '../src/systems/save';

const content = loadContent();
const fakeStore = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

function lifeWithNpc() {
  const b = createLife({ seed: 'library' }, content);
  const s = { ...b, log: [...b.log, { age: 20, lines: [] }] };
  const r = createNpc(s, content, { role: 'bằng hữu', name: 'Lục Thanh Vân', affinity: 70 });
  return { state: r.state, npc: r.state.npcs.find((n) => n.id === r.id)! };
}

describe('Sổ nhân vật', () => {
  it('keeps an NPC and a protagonist in the meta, and forgets one on request', () => {
    const { state, npc } = lifeWithNpc();
    const a = personFromNpc(state, npc);
    const b = personFromLife(createLife({ seed: 'other-life' }, content), content);
    let lib = addToLibrary([], a, content).library;
    lib = addToLibrary(lib, b, content).library;
    expect(lib.map((p) => p.source)).toEqual(['npc', 'player']);
    // The same person again replaces, never duplicates.
    expect(addToLibrary(lib, a, content).library).toHaveLength(2);
    const store = fakeStore();
    recordLibrary(store, lib);
    expect(readMeta(store).library).toEqual(lib);
    expect(readMeta(fakeStore()).library).toEqual([]);
    expect(removeFromLibrary(lib, a.id, content).library.map((p) => p.id)).toEqual([b.id]);
  });

  it('refuses a new person when the book is full', () => {
    const { state, npc } = lifeWithNpc();
    const full = Array.from({ length: content.balance.npcs.libraryMax }, (_, i) => ({ ...personFromNpc(state, npc), id: `x${i}` }));
    const r = addToLibrary(full, { ...personFromNpc(state, npc), id: 'new' }, content);
    expect(r.library).toHaveLength(full.length);
    expect(r.text).toBe(content.lifeTexts.npcLibrary.texts.full);
  });

  it('imports a saved person as an NPC with the chosen role and ledger', () => {
    const { state, npc } = lifeWithNpc();
    const person = { ...personFromNpc(state, npc), name: 'Mạc Tử Hiên', age: 45, realm: 'truc_co', root: true, alive: true };
    const fresh = { ...createLife({ seed: 'new-world' }, content), log: [{ age: 5, lines: [] }] };
    const r = importPerson(fresh, content, person, { ...defaultSetup(content, 'an_nhan'), affinity: 80, keepAge: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const n = r.state.npcs.find((x) => x.id === r.id)!;
    expect(n).toMatchObject({ name: 'Mạc Tử Hiên', age: 45, realm: 'truc_co', root: true, role: 'Ân nhân', affinity: 80 });
    expect(n.favor).toBeGreaterThan(0);
    expect(r.state.log[r.state.log.length - 1].lines.some((l) => l.text.includes('Mạc Tử Hiên'))).toBe(true);
    // Brought to the player's age instead.
    const young = importPerson(fresh, content, person, { ...defaultSetup(content, 'bang_huu'), keepAge: false });
    expect(young.ok && young.state.npcs[0].age).toBe(Math.max(content.balance.npcs.minAge, fresh.character.age));
  });

  it('turns away the dead, a clashing name and a role left empty', () => {
    const { state, npc } = lifeWithNpc();
    const person = personFromNpc(state, npc);
    expect(importPerson(state, content, { ...person, alive: false }, defaultSetup(content, 'bang_huu')).ok).toBe(false);
    const clash = importPerson(state, content, person, defaultSetup(content, 'bang_huu'));
    expect(clash.ok).toBe(false);
    expect(clash.text).toContain(person.name);
    const renamed = importPerson(state, content, person, { ...defaultSetup(content, 'bang_huu'), name: 'Tống Bạch Lộ' });
    expect(renamed.ok).toBe(true);
    expect(importPerson(state, content, person, { roleId: null, customRole: '  ', affinity: 50, favor: 0, grudge: 0, keepAge: true, name: 'Ai Đó' }).ok).toBe(false);
    const custom = importPerson(state, content, person, { roleId: null, customRole: 'Sư huynh kết nghĩa', affinity: 60, favor: 0, grudge: 0, keepAge: true, name: 'Ai Đó' });
    expect(custom.ok && custom.state.npcs.at(-1)!.role).toBe('Sư huynh kết nghĩa');
  });
});
