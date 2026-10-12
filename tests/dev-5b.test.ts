import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { confirmDestiny, rollDestiny, activeCombos } from '../src/systems/destiny';
import {
  devFindEvents, devFoundClan, devFoundSect, devJoinSect, devKill, devMetaFingerPity, devMetaPoints, devMetaTalent, devMetaUnlockAll,
  devNextStage, devPastSect, devSetFingerLevel, devSetFlag, devSetGoldenFinger, devSetRealm, devTakeChosen, devToggleTrait,
} from '../src/systems/dev';
import { chosenDisciple } from '../src/systems/chosen';
import { readMeta, replaceMeta, type KeyValueStore } from '../src/systems/save';
import { unlockedFingers } from '../src/systems/achievements';
import { startChallenge } from '../src/systems/challenge';

const content = loadContent();
const born = () => confirmDestiny(rollDestiny(createLife({ seed: 'dev-5b' }, content), content), content);
function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const lastLine = (s: ReturnType<typeof born>) => s.log.at(-1)!.lines.at(-1)!.text;

describe('Developer mode, 5b overhaul', () => {
  it('jumps a mortal straight to Kim Đan with a usable root and a longer life', () => {
    const s = born();
    const k = devSetRealm(s, content, 'kim_dan');
    expect(k.cult.realm).toBe('kim_dan');
    expect(k.cult.root).not.toBeNull();
    expect(k.cult.lifespan).toBeGreaterThan(s.cult.lifespan);
    expect(devNextStage(k, content).cult.stage).toBe(1);
    expect(devSetRealm(k, content, 'pham_nhan').cult.realm).toBe('pham_nhan');
    expect(lastLine(k)).toContain('[Dev]');
  });

  it('kills now for any cause', () => {
    const d = devKill(born(), content, 'tribulation');
    expect(d.alive).toBe(false);
    expect(d.death!.cause).toBe('tribulation');
  });

  it('traits (combos follow), Kim Thủ Chỉ and its level', () => {
    let s = { ...born(), traits: [] as string[] };
    const combo = content.traitCombos.combos[0];
    for (const t of combo.traits) s = devToggleTrait(s, content, t);
    expect(activeCombos(s, content).map((c) => c.id)).toContain(combo.id);
    s = devToggleTrait(s, content, combo.traits[0]);
    expect(activeCombos(s, content).map((c) => c.id)).not.toContain(combo.id);
    s = devSetGoldenFinger(s, content, 'ky_uc_kiep_truoc');
    expect(s.goldenFinger?.id).toBe('ky_uc_kiep_truoc');
    s = devSetFingerLevel(s, content, 99);
    expect(s.goldenFinger!.level).toBe(content.goldenFingers.fingers.find((f) => f.id === 'ky_uc_kiep_truoc')!.levels.length);
    expect(s.flags.biet_truoc).toBe(true);
    expect(devSetGoldenFinger(s, content, null).goldenFinger).toBeNull();
  });

  it('sect, clan, past sect, khí vận chi tử, flags', () => {
    let s = born();
    s = devJoinSect(s, content, content.sects[0].id);
    expect(s.sect.id).toBe(content.sects[0].id);
    s = devFoundClan(devFoundSect(s, content), content);
    expect(s.ownSect).not.toBeNull();
    expect(s.clan).not.toBeNull();
    expect(devPastSect(s).pastSect?.status).toBe('unknown');
    expect(chosenDisciple(devTakeChosen(s, content, content.chosenOnes.templates[0].id))).toBeDefined();
    s = devSetFlag(s, ' biet_truoc ', true);
    expect(s.flags.biet_truoc).toBe(true);
    expect(devSetFlag(s, 'biet_truoc', false).flags.biet_truoc).toBeUndefined();
  });

  it('filters events', () => {
    expect(devFindEvents(content, '').length).toBe(content.events.length);
    expect(devFindEvents(content, 'tm_cu').map((e) => e.id)).toContain('tm_cu_ke_vi');
    expect(devFindEvents(content, 'Sơn môn đời').length).toBeGreaterThan(0);
  });

  it('save meta: points, rebirth talents, unlock everything, Kim Thủ Chỉ pity', () => {
    const store = fakeStore();
    let m = devMetaPoints(readMeta(store), 100);
    expect(devMetaPoints(m, -500).rebirthPoints).toBe(0);
    const t = content.rebirthTalents.talents[0];
    m = devMetaTalent(m, content, t.id, 99);
    expect(m.rebirthTalents[t.id]).toBe(t.levels.length);
    expect(devMetaTalent(m, content, t.id, 0).rebirthTalents[t.id]).toBeUndefined();
    m = devMetaFingerPity(devMetaUnlockAll(m, content), content);
    replaceMeta(store, m);
    const back = readMeta(store);
    expect(Object.keys(back.achievements)).toHaveLength(content.achievements.achievements.length);
    expect(back.codex.traits).toHaveLength(content.traits.length);
    expect(unlockedFingers(content, Object.keys(back.achievements)).length).toBeGreaterThan(0);
    expect(back.fingerPity).toBe(content.balance.goldenFinger.pityLives);
  });

  it('any weekly challenge can be tried', () => {
    const last = content.challenges.at(-1)!;
    expect(startChallenge(content, '2026-W01', 1, false, last.id)!.challenge!.id).toBe(last.id);
  });
});
