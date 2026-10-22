// Chơi tiếp bằng con cháu hoặc đồ đệ (task 5.7): when a life ends, a living
// child or disciple can carry on. The heir keeps who they are (a child's
// inherited root, a disciple's realm); the one who died becomes a dead parent
// (or master), a living đạo lữ a living parent, the other children siblings.
// They inherit most of the money, the bag, the founded sect, a share of karma
// and reputation (phúc ấm), and the world: NPCs keep their ledgers, so old
// grudges come for the heir. The line is kept in tộc phả (ancestry).
import type { Content } from '../core/content';
import { createLife } from '../core/state';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Relative } from '../core/types';
import { rollRoot, startCultivating } from './cultivation';
import { learnTechnique } from './technique';
import { childRootLabel } from './romance';
import { clanInheritBonus } from './clan';
import { heirInsightBonus } from './familyBond';
import { inheritAssets } from './assets';

export interface HeirOption {
  kind: 'child' | 'disciple';
  id: string;
  name: string;
  age: number;
  /** "Con trai · Linh căn: …" or "Đồ đệ · Luyện Khí tầng 3". */
  label: string;
}

function realmLabel(content: Content, realm: string, stage: number): string {
  const r = content.cultivation.realms.realms.find((x) => x.id === realm);
  return r ? (realm === 'pham_nhan' ? r.name : `${r.name} ${r.stages[stage] ?? ''}`.trim()) : realm;
}

export function heirOptions(state: GameState, content: Content): HeirOption[] {
  if (state.alive) return [];
  const min = content.balance.heir.minAge;
  const children = state.family.filter((r) => r.role === 'child' && r.alive && r.age >= min).map((r) => ({
    kind: 'child' as const, id: r.id, name: r.name, age: r.age,
    label: [r.gender === 'nam' ? 'Con trai' : 'Con gái', childRootLabel(content, r), r.id === state.kin?.heir ? 'Người nối dõi' : ''].filter(Boolean).join(' · '),
  }));
  // 10.11: the chosen người nối dõi comes first.
  children.sort((a, b) => (b.id === state.kin?.heir ? 1 : 0) - (a.id === state.kin?.heir ? 1 : 0));
  const disciples = state.npcs.filter((n) => n.alive && n.disciple && n.age >= min).map((n) => ({
    kind: 'disciple' as const, id: n.id, name: n.name, age: n.age,
    label: `Đồ đệ · ${realmLabel(content, n.realm, n.stage)}`,
  }));
  return [...children, ...disciples];
}

const scale = (v: number, share: number) => Math.round(v * share);

/** Start the heir's life from the end of this one. */
export function continueAsHeir(state: GameState, content: Content, heirId: string): GameState {
  const option = heirOptions(state, content).find((o) => o.id === heirId);
  if (!option || !state.death) return state;
  const cfg = content.balance.heir;
  const t = content.heir;
  const generation = state.ancestry.length + 1;
  const seed = `${state.seed}:heir${generation}`;
  const child = option.kind === 'child' ? state.family.find((r) => r.id === heirId)! : null;
  const disciple = option.kind === 'disciple' ? state.npcs.find((n) => n.id === heirId)! : null;
  const gender = (child ?? disciple)!.gender;
  const base = createLife({ seed, name: option.name, gender, originId: state.character.originId, difficulty: state.difficulty, knowledge: state.knowledge }, content);
  const rng = Rng.fromState(base.rng);

  // Family: the one who died, the living đạo lữ, the other children.
  const parent: Relative = {
    id: 'ancestor', role: state.character.gender === 'nam' ? 'father' : 'mother', gender: state.character.gender,
    name: state.character.name, age: state.character.age, alive: false, lifespan: state.character.age, affinity: 80, lastActions: {},
  };
  const partner = state.npcs.find((n) => n.id === state.romance.partner && n.alive);
  const otherParent: Relative[] = child && partner
    ? [{ id: 'other_parent', role: partner.gender === 'nam' ? 'father' : 'mother', gender: partner.gender, name: partner.name, age: partner.age, alive: true, lifespan: partner.lifespan, affinity: partner.affinity, lastActions: {} }]
    : [];
  const siblings: Relative[] = child
    ? state.family.filter((r) => r.role === 'child' && r.id !== heirId).map((r) => ({ ...r, role: 'sibling' as const }))
    : [];
  const family = child ? [parent, ...otherParent, ...siblings] : base.family;
  const noFather = !family.some((r) => r.role === 'father' && r.alive);
  const noMother = !family.some((r) => r.role === 'mother' && r.alive);

  const share = cfg.inheritKarma;
  // Gia quy Độc đinh truyền thừa lets the heir keep more (task 5.4).
  const keep = state.flags.di_chuc ? 1 : Math.min(1, cfg.inheritMoney + clanInheritBonus(state, content));
  const reputation = Object.fromEntries(Object.entries(state.social.reputation).map(([k, v]) => [k, scale(v, share)])) as GameState['social']['reputation'];
  // Each entry records who died and how the line went on from them.
  const ancestry = [...state.ancestry, {
    name: state.character.name, age: state.death.age, realm: realmLabel(content, state.cult.realm, state.cult.stage), cause: state.death.cause, relation: option.kind,
  }];

  let s: GameState = {
    ...base,
    rng: rng.getState(),
    character: { ...base.character, age: option.age, hometown: state.character.hometown },
    destiny: { ...base.destiny, confirmed: true },
    family,
    flags: { ...(noFather ? { no_father: true } : {}), ...(noMother ? { no_mother: true } : {}), ...(noFather && noMother ? { no_parents: true } : {}) },
    money: { silver: scale(state.money.silver, keep), spiritStones: scale(state.money.spiritStones, keep) },
    clan: state.clan,
    inventory: { ...state.inventory },
    social: { karma: scale(state.social.karma, share), reputation },
    // The world goes on: NPCs (minus the heir), the prodigies.
    npcs: state.npcs.filter((n) => n.id !== heirId).map((n) => (n.disciple && option.kind === 'disciple' ? { ...n, role: 'sư đệ', disciple: undefined } : n)),
    ranking: state.ranking,
    devUsed: state.devUsed,
    world: state.world,
    ownSect: state.ownSect ? { ...state.ownSect, report: null } : null,
    ancestry,
    events: { pending: null, history: {}, followUps: [], npc: null },
    log: [],
  };
  // 10.4: the estate (all of it with a di chúc) and the debts.
  s = inheritAssets(state, s, content);

  if (child) {
    const { root, bodyId } = child.root ? { root: child.root, bodyId: child.bodyId ?? null } : rollRoot(rng, content);
    s = { ...s, cult: { ...s.cult, root, bodyId, lifespan: (content.balance.roots.gradeSpeed[root.grade] ?? 0) > 0 ? s.cult.lifespan : child.lifespan } };
  } else if (disciple) {
    // A disciple was taught to cultivate: their root is at least usable.
    let { root, bodyId } = rollRoot(rng, content, 2);
    if ((content.balance.roots.gradeSpeed[root.grade] ?? 0) <= 0) root = { grade: 'ngu', elements: content.cultivation.roots.elements.filter((e) => !e.variant).map((e) => e.id) };
    s = { ...s, cult: { ...s.cult, root, bodyId, realm: disciple.realm, stage: disciple.stage, progress: Math.min(100, disciple.progress), lifespan: Math.max(disciple.lifespan, option.age + 1) } };
    s = learnTechnique(s, content, content.balance.techniques.default, { quiet: true })?.state ?? s;
  }
  const parentName = state.character.name;
  const lines: LogLine[] = [{ text: (child ? t.child : t.disciple).replaceAll('{name}', option.name).replaceAll('{parent}', parentName), tone: 'rare' }];
  if (s.ownSect) lines.push({ text: t.sect.replaceAll('{sect}', s.ownSect.name), tone: 'good' });
  s = { ...s, log: [{ age: option.age, lines }] };
  // 10.5: the temper the upbringing made carries over.
  const temper = child?.temper ? content.relations?.tempers.find((x) => x.id === child.temper) : undefined;
  if (temper) {
    const stats = { ...s.stats };
    const apts = { ...s.aptitudes };
    for (const [key, d] of Object.entries(temper.heirStats)) {
      const k = key.replace(/^stat\./, '');
      if (k in stats) stats[k as keyof typeof stats] = Math.max(0, Math.min(100, stats[k as keyof typeof stats] + d));
      else if (k in apts) apts[k as keyof typeof apts] = Math.max(0, Math.min(100, apts[k as keyof typeof apts] + d));
    }
    s = { ...s, stats, aptitudes: apts };
  }
  // Backlog 2 (Gia đạo): what the parent taught the child. The technique is learned once cultivation starts.
  if (child) {
    const bonus = heirInsightBonus(content, child);
    if (bonus > 0) {
      s = { ...s, aptitudes: { ...s.aptitudes, comprehension: Math.min(100, s.aptitudes.comprehension + bonus) } };
      s = { ...s, log: [{ ...s.log[0], lines: [...s.log[0].lines, { text: content.lifeTexts.familyBond.texts.heirInsight, tone: 'good' }] }] };
    }
  }
  // A child with a usable root, old enough for the root test, starts cultivating now on what the parent
  // taught, or on the family's entry manual (9.R4c: a cultivator's house passes one down).
  if (child && option.age >= content.balance.roots.testAge[0]) {
    const taught = child.technique && learnTechnique(s, content, child.technique, { quiet: true });
    if (taught) s = { ...taught.state, log: [{ ...taught.state.log[0], lines: [...taught.state.log[0].lines, { text: content.lifeTexts.familyBond.texts.heirTechnique.replaceAll('{technique}', content.techniques.find((t) => t.id === child.technique)?.name ?? ''), tone: 'good' }] }, ...taught.state.log.slice(1)] };
    else s = learnTechnique(s, content, content.balance.techniques.default, { quiet: true })?.state ?? s;
    s = startCultivating(s, content).state;
  }
  return s;
}
