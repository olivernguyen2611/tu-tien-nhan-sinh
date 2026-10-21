import { describe, expect, it } from 'vitest';
import { EventSchema, TierTermsFileSchema } from '../src/core/schemas';
import { tierTermWarnings, validateContent } from '../src/core/validate';

const modules = import.meta.glob('../content/**/*.json', { eager: true, import: 'default' });
const files = Object.fromEntries(Object.entries(modules).map(([k, v]) => [k.replace('../content/', ''), v]));
const terms = TierTermsFileSchema.parse(files['worlds/thuong_lan/tier-terms.json']);

const ev = (patch: Record<string, unknown>) => EventSchema.parse({
  id: 'x', category: 'life', title: 'X', text: 'Chuyện thường.', weight: 1,
  choices: [{ text: 'Ừ', result: { text: 'Xong.', effects: { 'stat.happiness': 1 } } }], ...patch,
});

describe('9.10 tier terms', () => {
  it('warns when a phàm gian event uses words of the tầng above', () => {
    const e = ev({ conditions: { tier: ['pham_gian'] }, text: 'Lão bán cho ngươi một viên đan dược.' });
    const w = tierTermWarnings(e, terms, 'pham_gian');
    expect(w).toHaveLength(1);
    expect(w[0]).toContain('đan dược');
    expect(w[0]).toContain('thuốc');
  });

  it('counts mortal-only and mortal-category events, not cultivation ones, and respects crossTier', () => {
    expect(tierTermWarnings(ev({ conditions: { realm: { max: 'pham_nhan' } }, text: 'Tu sĩ Trúc Cơ.' }), terms, 'pham_gian')).toHaveLength(1);
    expect(tierTermWarnings(ev({ category: 'work', text: 'Chân khí cuồn cuộn.' }), terms, 'pham_gian')).toHaveLength(1);
    expect(tierTermWarnings(ev({ category: 'cultivation', text: 'Đan dược, linh thạch.' }), terms, 'pham_gian')).toEqual([]);
    expect(tierTermWarnings(ev({ category: 'mortal', crossTier: true, text: 'Linh thạch, lấy không?' }), terms, 'pham_gian')).toEqual([]);
    // Whole words only: "linh khí" is not inside "thần linh khí khái".
    expect(tierTermWarnings(ev({ category: 'mortal', text: 'Một vị thần linh khíu.' }), terms, 'pham_gian')).toEqual([]);
  });

  it('only a ruler says trẫm', () => {
    const say = (requires?: unknown) => ev({ choices: [{ text: 'Trẫm tha cho ngươi', requires, result: { text: 'Ừ.', effects: { 'stat.happiness': 1 } } }] });
    expect(tierTermWarnings(say(), terms, 'pham_gian')[0]).toContain('trẫm');
    expect(tierTermWarnings(say({ flagsAll: ['de_vuong'] }), terms, 'pham_gian')).toEqual([]);
  });

  it('the shipped events raise no tier-term warning', () => {
    const msgs = validateContent(files).filter((p) => p.message.includes('tầng pham_gian') || p.message.includes('tự xưng'));
    expect(msgs).toEqual([]);
  });
});
