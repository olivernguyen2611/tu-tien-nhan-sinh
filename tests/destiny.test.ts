import { describe, expect, it } from 'vitest';
import type { Content } from '../src/core/content';
import { BalanceSchema, WorldSchema, NamesSchema, OriginFileSchema, TraitFileSchema } from '../src/core/schemas';
import { LifeTextsSchema } from '../src/core/schemas';
import lifeTexts from '../content/life-texts.json';
import extremes from '../content/stat-extremes.json';
import { careers, cultivation, difficulties, fateTalents, items, martial, lineages, rankings, romance, heartDemon, recipes, disciples, founding, heir, sectLife, sects, techniques, tutorial, combat } from './fixtures';
import { StatExtremesFileSchema } from '../src/core/schemas';
import { createLife } from '../src/core/state';
import { confirmDestiny, rerollDestiny, rollDestiny } from '../src/systems/destiny';
import world from '../content/worlds/thuong_lan/world.json';
import balance from '../content/config/balance.json';
import names from '../content/worlds/thuong_lan/character/names.json';
import origins from '../content/worlds/thuong_lan/character/origins.json';
import traits from '../content/traits.json';

const content: Content = {
  world: WorldSchema.parse(world),
  balance: BalanceSchema.parse(balance),
  names: NamesSchema.parse(names),
  origins: OriginFileSchema.parse(origins),
  traits: TraitFileSchema.parse(traits),
  events: [],
  glossary: [],
  familyActions: [],
  lifeTexts: LifeTextsSchema.parse(lifeTexts),
  extremes: StatExtremesFileSchema.parse(extremes),
  cultivation,
  difficulties,
  tutorial,
  careers,
  techniques,
  sects,
  sectLife,
  fateTalents,
  items,
  martial,
  lineages,
  markets: [],
  combat,
  npcTraits: { surface: [], nature: [], goals: [] },
  rankings,
  romance,
  heartDemon,
  recipes,
  disciples,
  founding,
  heir,
};
const born = (seed: string) => rollDestiny(createLife({ seed }, content), content);

describe('destiny roll', () => {
  it('offers 3 distinct traits and is reproducible', () => {
    const a = born('roll-1');
    expect(a.destiny.offered).toHaveLength(3);
    expect(new Set(a.destiny.offered).size).toBe(3);
    expect(born('roll-1').destiny.offered).toEqual(a.destiny.offered);
  });

  it('roughly follows the rarity table over many lives', () => {
    const counts: Record<string, number> = {};
    const byId = new Map(content.traits.map((t) => [t.id, t.rarity]));
    const N = 3000;
    for (let i = 0; i < N; i++) for (const id of born(`r${i}`).destiny.offered) counts[byId.get(id)!] = (counts[byId.get(id)!] ?? 0) + 1;
    const share = (r: string) => (counts[r] ?? 0) / (N * 3);
    // Distinct slots shift odds a little; check the broad shape only.
    expect(share('pham')).toBeGreaterThan(0.3);
    expect(share('ac')).toBeGreaterThan(0.08);
    expect(share('ac')).toBeLessThan(0.16);
    expect(share('than')).toBeLessThan(0.02);
  });

  it('rerolls change the offer and are limited', () => {
    let s = born('reroll');
    const first = s.destiny.offered;
    for (let i = 0; i < 5; i++) s = rerollDestiny(s, content);
    expect(s.destiny.rerollsLeft).toBe(0);
    expect(s.destiny.offered).not.toEqual(first);
    const after = rerollDestiny(s, content);
    expect(after).toBe(s);
  });

  it('developer mode rerolls without spending', () => {
    let s = born('dev-reroll');
    const left = s.destiny.rerollsLeft;
    const offers = new Set<string>();
    for (let i = 0; i < 20; i++) {
      s = rerollDestiny(s, content, true);
      offers.add(s.destiny.offered.join());
    }
    expect(s.destiny.rerollsLeft).toBe(left);
    expect(offers.size).toBeGreaterThan(5);
  });

  it('confirming applies stat and lifespan hooks once', () => {
    const s = born('apply');
    const forced = { ...s, destiny: { ...s.destiny, offered: ['menh_nhu_dang_hoa', 'tu_khi_dong_lai', 'kheo_mom'] } };
    const done = confirmDestiny(forced, content);
    expect(done.traits).toEqual(['menh_nhu_dang_hoa', 'tu_khi_dong_lai', 'kheo_mom']);
    expect(done.aptitudes.luck).toBe(Math.min(100, s.aptitudes.luck + 25));
    expect(done.stats.charm).toBe(Math.min(100, s.stats.charm + 5));
    expect(done.cult.lifespan).toBe(Math.round(s.cult.lifespan * 0.7));
    expect(done.log[0].lines.some((l) => l.tone === 'rare')).toBe(true);
    expect(confirmDestiny(done, content)).toBe(done);
  });
});
