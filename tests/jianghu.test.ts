import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife, fillTemplate } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { addNetRenown, addRenown, jianghuLine, jianghuOf, renownRank } from '../src/systems/jianghu';
import { meets } from '../src/systems/events/conditions';
import { resolveChoice } from '../src/systems/events/engine';
import { createNpc, npcById } from '../src/systems/npcs';
import { commitCrime } from '../src/systems/law';

const content = loadContent();
const life: GameState = (() => { const s = createLife({ seed: 'giang-ho', originId: 'vo_lam' }, content); return { ...s, character: { ...s.character, age: 25 } }; })();

describe('Hiệp danh, ác danh, ngoại hiệu (11.1)', () => {
  it('fame and infamy are separate, both can be high; reputation.giang_ho is their difference', () => {
    const s = addRenown(addRenown(life, content, 20, 0), content, 0, 15);
    expect(jianghuOf(s)).toMatchObject({ fame: 20, infamy: 15 });
    expect(s.social.reputation.giang_ho).toBe(5);
    // Older content: + is hiệp danh, − is ác danh.
    const t = addNetRenown(s, content, -10);
    expect(jianghuOf(t)).toMatchObject({ fame: 20, infamy: 25 });
  });

  it('an old save with only reputation.giang_ho reads its sign', () => {
    const old = { ...life, jianghu: undefined, social: { ...life.social, reputation: { ...life.social.reputation, giang_ho: -12 } } };
    expect(jianghuOf(old)).toMatchObject({ fame: 0, infamy: 12 });
  });

  it('past aliasAt the giang hồ gives a ngoại hiệu, once; a scar gives its own word', () => {
    const at = content.balance.jianghu!.aliasAt;
    const s = addRenown(life, content, at, 0);
    const alias = jianghuOf(s).alias!;
    expect(alias.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(s.log.at(-1)!.lines.some((l) => l.text.includes(alias))).toBe(true);
    expect(jianghuOf(addRenown(s, content, 20, 0)).alias).toBe(alias);
    const scarred = addRenown({ ...life, body: { ailments: [], injuries: ['mu_mot_mat'], drinks: [] } }, content, 0, at);
    expect(jianghuOf(scarred).alias!.startsWith('Độc Nhãn')).toBe(true);
    expect(fillTemplate('«{alias}»', s, content)).toBe(`«${alias}»`);
    expect(jianghuLine(s, content)).toContain(alias);
    expect(renownRank(content, 'hiep', 90)).toBe(content.jianghu!.texts.ranks.hiep.at(-1));
  });

  it('effects and conditions read the two', () => {
    const pend = { ...addRenown(life, content, 40, 0), events: { ...life.events, pending: 'jh_quan_tra_nhan_ra' } };
    expect(meets(pend, { jianghu: { fameMin: 20, alias: true } }, content)).toBe(true);
    expect(meets(pend, { jianghu: { infamyMin: 1 } }, content)).toBe(false);
    const r = resolveChoice(pend, content, 2);
    expect(jianghuOf(r.state).fame).toBe(43);
  });

  it('a crime that is caught brings ác danh', () => {
    // A crime nobody could pull off: the check fails, the thief is caught.
    const hard = { ...content, crimes: { ...content.crimes!, crimes: content.crimes!.crimes.map((c) => ({ ...c, difficulty: 1000 })) } };
    const s = commitCrime(life, hard, 'cuop_duong');
    expect(jianghuOf(s).infamy).toBeGreaterThan(0);
  });

  it('người giang hồ NPCs carry a ngoại hiệu, shown in what the player knows', () => {
    const { state, id } = createNpc(life, content, { role: 'kiếm khách', kind: 'vo_lam_nhan' });
    expect(npcById(state, id)!.alias).toBeTruthy();
    const plain = createNpc(life, content, { role: 'hàng xóm' });
    expect(npcById(plain.state, plain.id)!.alias).toBeUndefined();
  });
});
