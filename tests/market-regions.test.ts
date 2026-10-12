import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState, SpiritRoot } from '../src/core/types';
import { auctionBlocked, auctionLots, buyScroll, marketOffers, openMarkets, placeBid, techniqueOffers } from '../src/systems/market';

const content = loadContent();
const SONG: SpiritRoot = { grade: 'song', elements: ['kim', 'hoa'] };

function cultivator(region: string, stones = 3000, age = 30): GameState {
  const b = createLife({ seed: 'phuong-thi' }, content);
  return {
    ...b,
    character: { ...b.character, age },
    cult: { ...b.cult, realm: 'truc_co', root: SONG },
    region: { ...b.region, id: region },
    money: { silver: 100, spiritStones: stones },
    log: [...b.log, { age, lines: [] }],
  };
}

describe('markets by region and auctions (playtest 2)', () => {
  it('each region has its own markets', () => {
    const ids = (r: string) => openMarkets(cultivator(r), content).map((m) => m.id);
    expect(ids('thanh_van_chau')).toEqual(expect.arrayContaining(['cho_phien', 'kim_thiem', 'vo_chu', 'dau_gia_kim_thiem']));
    expect(ids('dong_hai')).toEqual(expect.arrayContaining(['kim_thiem', 'hai_thi', 'than_lau_dau_gia']));
    expect(ids('dong_hai')).not.toContain('cho_phien');
    expect(ids('trung_chau')).toEqual(expect.arrayContaining(['van_bao_phuong', 'thien_bao_lau']));
  });

  it('a stocked stall changes from year to year and sells local specialities', () => {
    const at = (age: number) => marketOffers(cultivator('thanh_van_chau', 3000, age), content, 'kim_thiem').map((o) => o.item.id).join();
    expect(marketOffers(cultivator('thanh_van_chau'), content, 'kim_thiem')).toHaveLength(8);
    expect(new Set([30, 31, 32, 33, 34].map(at)).size).toBeGreaterThan(2);
    const sea = new Set([30, 31, 32, 33, 34, 35, 36].flatMap((a) => marketOffers(cultivator('dong_hai', 3000, a), content, 'hai_thi').map((o) => o.item.id)));
    expect(sea.has('tran_chau_giao_nhan')).toBe(true);
  });

  it('Cái bát is no longer on the stall', () => {
    expect(marketOffers(cultivator('thanh_van_chau'), content, 'cho_phien').some((o) => o.item.id === 'cai_bat')).toBe(false);
  });

  it('a scroll can be bought once and goes to the scrolls to learn', () => {
    const s = cultivator('dong_hai');
    const r = buyScroll(s, content, 'hai_thi', 'thuy_nguyet_quan_tuong_phap');
    expect(r.state.cult.scrolls).toContain('thuy_nguyet_quan_tuong_phap');
    expect(r.state.money.spiritStones).toBeLessThan(3000);
    expect(techniqueOffers(r.state, content, 'hai_thi')[0].blocked).toContain('Đã có');
  });

  it('auction: one bid a year; higher bids win more often; winning pays and gives the lot', () => {
    const s = cultivator('trung_chau');
    const lots = auctionLots(s, content, 'thien_bao_lau');
    expect(lots).toHaveLength(4);
    expect(lots[0].bids[2].chance).toBeGreaterThan(lots[0].bids[0].chance);
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const t = { ...s, rng: createLife({ seed: `bid${i}` }, content).rng };
      const lot = auctionLots(t, content, 'thien_bao_lau')[0];
      const r = placeBid(t, content, 'thien_bao_lau', lot.key, 2);
      expect(auctionBlocked(r.state, content, 'thien_bao_lau')).toContain('đã ra giá');
      if (r.tone !== 'bad') {
        wins++;
        expect(r.state.money.spiritStones).toBe(3000 - lot.bids[2].price);
      } else expect(r.state.money.spiritStones).toBe(3000);
    }
    expect(wins).toBeGreaterThan(10);
    expect(wins).toBeLessThan(40);
  });
});
