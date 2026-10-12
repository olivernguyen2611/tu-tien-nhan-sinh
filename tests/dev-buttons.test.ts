// Every Dev mode button must do something when it is offered. Each case runs the cheat on a life
// where its button is enabled and checks the state really changed (a silent no-op reads as a dead button).
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import * as dev from '../src/systems/dev';
import { chosenDisciple } from '../src/systems/chosen';

const content = loadContent();
const base = (): GameState => {
  const b = createLife({ seed: 'dev-buttons' }, content);
  return { ...b, character: { ...b.character, age: 30 }, log: [...b.log, { age: 30, lines: [] }] };
};
const cultivator = (): GameState => dev.devSetRealm(base(), content, 'luyen_khi');
const tmpl = content.chosenOnes.templates[0].id;

describe('Dev mode buttons all act', () => {
  it('khí vận chi tử: can be taken at will, again and again, with no old log or after one is already here', () => {
    const a = dev.devTakeChosen(base(), content, tmpl);
    const first = chosenDisciple(a)!;
    expect(first).toBeTruthy();
    expect(first.disciple).toBeTruthy();
    // A second press brings a new one and lets the first go.
    const b = dev.devTakeChosen(a, content, content.chosenOnes.templates[content.chosenOnes.templates.length - 1].id);
    expect(b).not.toBe(a);
    expect(b.npcs.filter((n) => n.chosen)).toHaveLength(1);
    expect(chosenDisciple(b)!.id).not.toBe(first.id);
    expect(b.npcs.find((n) => n.id === first.id)?.disciple).toBeUndefined();
    // Even a life whose log is still empty.
    expect(chosenDisciple(dev.devTakeChosen({ ...base(), log: [] }, content, tmpl))).toBeTruthy();
  });

  const cases: [string, (s: GameState) => GameState, () => GameState][] = [
    ['stat', (s) => dev.devAddStat(s, 'health', -10), base],
    ['money', (s) => dev.devAddMoney(s, 100, 10), base],
    ['karma', (s) => dev.devAddKarma(s, 10), base],
    ['event', (s) => dev.devTriggerEvent(s, content, content.events[0].id), base],
    ['meet friend', (s) => dev.devMeetNpc(s, content, 'friend'), base],
    ['meet enemy', (s) => dev.devMeetNpc(s, content, 'enemy'), base],
    ['meet debtor', (s) => dev.devMeetNpc(s, content, 'debtor'), base],
    ['skip years', (s) => dev.devSkipYears(s, content, 1), base],
    ['heal', (s) => dev.devHeal(s), base],
    ['fight', (s) => dev.devStartFight(s, content, 'same', 'teach'), base],
    ['item', (s) => dev.devGiveItem(s, content, content.items[0].id), base],
    ['all items', (s) => dev.devGiveAllItems(s, content), base],
    ['technique', (s) => dev.devLearnTechnique(s, content, content.techniques[1].id), cultivator],
    ['all scrolls', (s) => dev.devGiveAllScrolls(s, content), base],
    ['reset item use', (s) => dev.devResetItemUse(s), base],
    ['realm', (s) => dev.devSetRealm(s, content, 'kim_dan'), base],
    ['next stage', (s) => dev.devNextStage(s, content), cultivator],
    ['fill progress', (s) => dev.devFillProgress(s), cultivator],
    ['lifespan', (s) => dev.devAddLifespan(s, 50), base],
    ['trait', (s) => dev.devToggleTrait(s, content, content.traits[0].id), base],
    ['golden finger', (s) => dev.devSetGoldenFinger(s, content, content.goldenFingers.fingers[0].id), base],
    ['found sect', (s) => dev.devFoundSect(s, content), cultivator],
    ['found clan', (s) => dev.devFoundClan(s, content), base],
    ['join sect', (s) => dev.devJoinSect(s, content, content.sects[0].id), base],
    ['past sect', (s) => dev.devPastSect(s), base],
    ['flag on', (s) => dev.devSetFlag(s, 'thu_nghiem', true), base],
    ['martial stage', (s) => dev.devSetMartial(s, content, 2), base],
    ['root', (s) => dev.devSetRoot(s, content, dev.devRootOptions(content)[0].root), base],
    ['body', (s) => dev.devSetBody(s, content, content.cultivation.roots.bodies[0].id), base],
    ['awaken body', (s) => dev.devAwakenBody(s, content, content.cultivation.roots.bodies[0].id), base],
    ['marry', (s) => dev.devMarry(s, content), base],
    ['kill', (s) => dev.devKill(s, content, 'old_age'), base],
  ];
  for (const [name, run, from] of cases) {
    it(`${name} changes the life`, () => {
      const s = from();
      expect(run(s)).not.toBe(s);
    });
  }

  it('the martial quest buttons work from a Hóa cảnh mortal', () => {
    const s = dev.devSetMartial(base(), content, 4);
    const quest = dev.devStartMartialQuest(s, content);
    expect(quest).not.toBe(s);
    expect(dev.devQuestStep(quest, content, 'win')).not.toBe(quest);
    expect(dev.devQuestStep(quest, content, 'retry')).not.toBe(quest);
  });

  it('spouse and bond buttons work once there is a spouse', () => {
    const m = dev.devMarry(base(), content);
    expect(dev.devSpouseAffinity(m, 20)).not.toBe(m);
  });
});
