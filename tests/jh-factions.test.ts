import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { addMerit, factionLine, factionYear, factionMission, factionTeach, joinBlock, joinFaction, leaveFaction, memberOf, rankName } from '../src/systems/jhFactions';
import { addRenown, jianghuOf } from '../src/systems/jianghu';
import { meets } from '../src/systems/events/conditions';
import { doActivity } from '../src/systems/activities';

const content = loadContent();
const at = (age: number): GameState => { const s = createLife({ seed: 'mon-phai', originId: 'vo_lam' }, content); return { ...s, character: { ...s.character, age }, jianghu: { fame: 0, infamy: 0, alias: null, aliasAt: null } }; };
const f = (id: string) => content.jianghuFactions!.find((x) => x.id === id)!;

describe('Môn phái và bang hội võ lâm (11.2)', () => {
  it('each thế lực has its entrance rule: age, born members, ác danh, a token', () => {
    expect(joinBlock(at(14), content, f('hoa_son'))).toBeNull();
    expect(joinBlock(at(40), content, f('hoa_son'))).not.toBeNull();
    expect(joinBlock(at(20), content, f('mo_dung_the_gia'))).not.toBeNull();
    expect(joinBlock(at(20), content, f('banh_gia'))).toBeNull();
    expect(joinBlock(at(20), content, f('huyet_sat_lau'))).not.toBeNull();
    expect(joinBlock(addRenown(at(20), content, 0, 30), content, f('huyet_sat_lau'))).toBeNull();
    const token = { ...at(20), flags: { ...at(20).flags, the_go_dau_soi: true } };
    expect(joinBlock(token, content, f('luc_lam_minh'))).toBeNull();
  });

  it('joins one thế lực; nhiệm vụ bring cống hiến, bạc and danh by side; enough cống hiến lifts the rank', () => {
    let s = joinFaction(at(14), content, { kinds: ['mon_phai'], alignments: ['chinh'] });
    const m = memberOf(s)!;
    expect(f(m.id).alignment).toBe('chinh');
    expect(rankName(content, m)).toBe(content.jianghu!.factions!.kinds.mon_phai.ranks[0]);
    expect(joinFaction(s, content, { kinds: ['bang_hoi'] })).toBe(s);
    const silver = s.money.silver;
    s = factionMission(s, content, true);
    expect(memberOf(s)!.merit).toBeGreaterThan(0);
    expect(s.money.silver).toBeGreaterThan(silver);
    expect(jianghuOf(s).fame).toBeGreaterThan(0);
    s = addMerit(s, content, content.balance.factions!.rankMerit[0]);
    expect(memberOf(s)!.rank).toBe(1);
    expect(meets(s, { faction: { member: true, alignments: ['chinh'], rankMin: 1 } }, content)).toBe(true);
    expect(factionLine(s, content)).toContain(f(m.id).name);
  });

  it('cống hiến buys võ học; a peaceful leave shuts the door, a phản bang brings hunters', () => {
    let s = addMerit(joinFaction(at(14), content, { id: 'hoa_son' }), content, 50);
    const bonus = s.martial.bonus;
    s = factionTeach(s, content);
    expect(s.martial.bonus).toBe(bonus + content.balance.factions!.teachBonus);
    const quit = leaveFaction(s, content, 'quit');
    expect(memberOf(quit)).toBeNull();
    expect(joinBlock(quit, content, f('hoa_son'))).not.toBeNull();
    const betrayed = leaveFaction(s, content, 'betray');
    expect(betrayed.jianghu!.hunted!.by).toBe('hoa_son');
    expect(meets(betrayed, { faction: { hunted: true } }, content)).toBe(true);
    const later = factionYear({ ...betrayed, character: { ...betrayed.character, age: betrayed.jianghu!.hunted!.until } }, content);
    expect(later.jianghu!.hunted).toBeNull();
  });

  it('the activities join and work for the thế lực', () => {
    const s = { ...at(14), stats: { ...at(14).stats }, aptitudes: { ...at(14).aptitudes, physique: 100 } };
    const r = doActivity(s, content, 'bai_nhap_mon_phai');
    expect(r).not.toBeNull();
  });
});
