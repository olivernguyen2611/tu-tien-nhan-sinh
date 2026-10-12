// Sổ nhân vật (backlog 11/12): people the player keeps from one life to the next. An NPC met in a
// life, or the protagonist of a save slot, is written down as a SavedPerson in the save meta; a later
// life can bring them in as an NPC (importPerson), with a role and ledger the player chooses.
// Nothing here is random: an imported NPC takes what the saved person already was.
import type { Content } from '../core/content';
import type { GameState, Gender, Npc } from '../core/types';
import { hashSeed } from '../core/rng';
import { rootUsable } from './cultivation';

/** A person kept in the book. Plain data: it goes straight into the save meta. */
export interface SavedPerson {
  /** Unique in the book. */
  id: string;
  name: string;
  gender: Gender;
  age: number;
  lifespan: number;
  alive: boolean;
  root: boolean;
  aptitude: number;
  realm: string;
  stage: number;
  surface: string | null;
  nature: string | null;
  goal: string | null;
  /** Where they come from: an NPC met in a life, or the protagonist of a save. */
  source: 'npc' | 'player';
  /** The life they were written down from (the protagonist's name), and its world. */
  from: string;
  worldId: string;
  savedAt: string;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));
const fill = (t: string, vars: Record<string, string>) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), t);

const idFor = (source: string, name: string, from: string) => `${source}_${hashSeed(`${name}|${from}`).toString(36)}`;

export function personFromNpc(state: GameState, npc: Npc, now = new Date()): SavedPerson {
  return {
    id: idFor('npc', npc.name, state.character.name), name: npc.name, gender: npc.gender, age: npc.age, lifespan: npc.lifespan, alive: npc.alive,
    root: npc.root, aptitude: npc.aptitude, realm: npc.realm, stage: npc.stage, surface: npc.surface, nature: npc.nature, goal: npc.goal,
    source: 'npc', from: state.character.name, worldId: state.worldId, savedAt: now.toISOString(),
  };
}

/** The protagonist of a life as a person: comprehension stands for aptitude. */
export function personFromLife(life: GameState, content: Content, now = new Date()): SavedPerson {
  const range = content.balance.npcs.aptitude;
  return {
    id: idFor('player', life.character.name, life.seed), name: life.character.name, gender: life.character.gender, age: life.character.age,
    lifespan: life.cult.lifespan, alive: life.alive, root: rootUsable(life, content),
    aptitude: clamp(life.aptitudes.comprehension, range[0], range[1]), realm: life.cult.realm, stage: life.cult.stage,
    surface: null, nature: null, goal: null,
    source: 'player', from: life.character.name, worldId: life.worldId, savedAt: now.toISOString(),
  };
}

/** Add to the book (same id replaces). Null when the book is full. */
export function addToLibrary(library: SavedPerson[], person: SavedPerson, content: Content): { library: SavedPerson[]; text: string } {
  const t = content.lifeTexts.npcLibrary.texts;
  const rest = library.filter((p) => p.id !== person.id);
  if (rest.length >= content.balance.npcs.libraryMax) return { library, text: t.full };
  return { library: [...rest, person], text: fill(t.saved, { name: person.name }) };
}

export function removeFromLibrary(library: SavedPerson[], id: string, content: Content): { library: SavedPerson[]; text: string } {
  const who = library.find((p) => p.id === id);
  if (!who) return { library, text: '' };
  return { library: library.filter((p) => p.id !== id), text: fill(content.lifeTexts.npcLibrary.texts.removed, { name: who.name }) };
}

/** How the player sets the person up in this world (the import form). */
export interface ImportSetup {
  /** A preset id from lifeTexts.npcLibrary.roles, or null with `customRole`. */
  roleId: string | null;
  customRole?: string;
  affinity: number;
  favor: number;
  grudge: number;
  /** Replaces the saved name (when it clashes with someone here). */
  name?: string;
  /** True: keep their age; false: bring them to the player's age. */
  keepAge: boolean;
}

export function roleLabel(content: Content, setup: Pick<ImportSetup, 'roleId' | 'customRole'>): string {
  return setup.roleId ? content.lifeTexts.npcLibrary.roles.find((r) => r.id === setup.roleId)?.label ?? '' : (setup.customRole ?? '').trim();
}

/** A form's opening values for a preset. */
export function defaultSetup(content: Content, roleId: string): ImportSetup {
  const r = content.lifeTexts.npcLibrary.roles.find((x) => x.id === roleId) ?? content.lifeTexts.npcLibrary.roles[0];
  return { roleId: r.id, affinity: r.affinity, favor: r.favor, grudge: r.grudge, keepAge: true };
}

export type ImportResult = { ok: true; state: GameState; id: string; text: string } | { ok: false; text: string };

/** Bring a saved person into this life as an NPC. */
export function importPerson(state: GameState, content: Content, person: SavedPerson, setup: ImportSetup): ImportResult {
  const t = content.lifeTexts.npcLibrary.texts;
  const name = (setup.name ?? person.name).trim() || person.name;
  if (!person.alive) return { ok: false, text: fill(t.dead, { name }) };
  const taken = [state.character.name, ...state.family.map((r) => r.name), ...state.npcs.map((n) => n.name)];
  if (taken.includes(name)) return { ok: false, text: fill(t.nameTaken, { name }) };
  const role = roleLabel(content, setup);
  if (!role) return { ok: false, text: '' };
  const realm = content.cultivation.realms.realms.some((r) => r.id === person.realm) ? person.realm : content.cultivation.realms.realms[0].id;
  const age = Math.max(content.balance.npcs.minAge, setup.keepAge ? person.age : state.character.age);
  const npc: Npc = {
    id: `imp${state.npcs.length + 1}_${hashSeed(`${person.id}|${state.seed}`).toString(36)}`,
    name, gender: person.gender, age, lifespan: Math.max(age + 1, person.lifespan), alive: true,
    role, root: person.root, aptitude: person.aptitude, realm, stage: person.stage, progress: 0,
    surface: person.surface, nature: person.nature, natureKnown: person.nature === null, goal: person.goal,
    affinity: clamp(setup.affinity), favor: clamp(setup.favor), grudge: clamp(setup.grudge), heirOf: null,
  };
  const text = fill(t.imported, { name, role });
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, { text, tone: 'rare' }] };
  return { ok: true, state: { ...state, npcs: [...state.npcs, npc], log }, id: npc.id, text };
}
