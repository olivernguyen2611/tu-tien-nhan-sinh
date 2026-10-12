// Task 4.11: the remnant soul in an old ring ("lão gia gia").
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { hookSum } from '../src/systems/cultivation';
import { findEvent, resolveChoice, visibleChoices } from '../src/systems/events/engine';

const content = loadContent();
const fresh = createLife({ seed: 'lao-gia-gia', originId: 'nong_dan' }, content);
const base: GameState = { ...fresh, events: { ...fresh.events, followUps: [] } };
const at = (s: GameState, id: string): GameState => ({ ...s, events: { ...s.events, pending: id } });
const adult: GameState = { ...base, character: { ...base.character, age: 16 } };
const shown = (s: GameState, id: string): string[] =>
  visibleChoices(at(s, id), content, findEvent(content, id)!).filter((c) => !c.disabled).map((c) => c.text);

describe('lão gia gia (task 4.11)', () => {
  it('picking up the ring gives its carried hooks and books the guidance', () => {
    const s = resolveChoice(at(adult, 'tan_hon_day_song'), content, 0).state;
    expect(s.inventory.nhan_co_tan_hon).toBe(1);
    expect(s.flags.lao_gia_gia).toBe(true);
    expect(hookSum(s, content, 'cultivationSpeed')).toBeGreaterThan(hookSum(adult, content, 'cultivationSpeed'));
    expect(s.events.followUps.some((f) => f.event === 'lao_gia_gia_chi_duong')).toBe(true);
  });

  it('following the old man leads to the kỳ vật', () => {
    const s = resolveChoice(at(adult, 'lao_gia_gia_chi_duong'), content, 0).state;
    expect(s.events.followUps.some((f) => f.event === 'lao_gia_gia_ky_vat')).toBe(true);
  });

  it('the pool opens the meridians of a rootless mortal and books the possession', () => {
    const rootless: GameState = { ...adult, cult: { ...adult.cult, root: { grade: 'none', elements: [] } } };
    expect(shown(rootless, 'lao_gia_gia_ky_vat')).toContain('Nhảy xuống, tẩy kinh mạch (càng lớn tuổi càng dễ mất mạng)');
    expect(shown(rootless, 'lao_gia_gia_ky_vat')).not.toContain('Ngồi bên ao hấp thu linh khí');
    const s = resolveChoice(at(rootless, 'lao_gia_gia_ky_vat'), content, 0).state;
    expect(s.events.followUps.some((f) => f.event === 'lao_gia_gia_doat_xa')).toBe(true);
  });

  it('a seal prepared in advance only shows to someone who saw through him', () => {
    expect(shown(adult, 'lao_gia_gia_doat_xa')).not.toContain('Rút phù trấn hồn đã giấu sẵn');
    const wary = { ...adult, flags: { ...adult.flags, lao_gia_gia_lo_mat: true }, inventory: { ...adult.inventory, nhan_co_tan_hon: 1 } };
    expect(shown(wary, 'lao_gia_gia_doat_xa')).toContain('Rút phù trấn hồn đã giấu sẵn');
    const s = resolveChoice(at(wary, 'lao_gia_gia_doat_xa'), content, 0).state;
    expect(s.inventory.nhan_co_tan_hon ?? 0).toBe(0);
    expect(s.flags.nuot_tan_hon).toBe(true);
  });

  it('feeding him the pool makes the possession harder', () => {
    const fed = { ...adult, flags: { ...adult.flags, lao_gia_gia_hoi_phuc: true } };
    const ev = findEvent(content, 'lao_gia_gia_doat_xa')!;
    const hold = (s: GameState) => visibleChoices(at(s, ev.id), content, ev).filter((c) => !c.disabled && c.text === 'Cố thủ thức hải');
    expect(hold(adult)).toHaveLength(1);
    expect(hold(fed)).toHaveLength(1);
    expect(ev.choices.filter((c) => c.text === 'Cố thủ thức hải').map((c) => c.check?.difficulty)).toEqual([55, 75]);
  });
});
