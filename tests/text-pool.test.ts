import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { Rng } from '../src/core/rng';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { confirmDestiny, rollDestiny } from '../src/systems/destiny';
import { resolveChoice } from '../src/systems/events/engine';
import { simulateMany } from '../src/systems/simulate';
import { drawText, outcomeText } from '../src/systems/textPool';

const content = loadContent();
const born = (seed: string): GameState => confirmDestiny(rollDestiny(createLife({ seed }, content), content), content);

describe('Văn bản có ngữ cảnh, chống lặp (9.3)', () => {
  it('a pool does not give back one of its last few lines', () => {
    const lines = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu'];
    let s = born('tp-a');
    const rng = new Rng('tp-a');
    const said: string[] = [];
    for (let i = 0; i < 40; i++) {
      const r = drawText(s, content, 'test', lines, {}, rng);
      said.push(r.text);
      s = r.state;
    }
    const avoid = content.balance.text.avoid;
    said.forEach((t, i) => expect(said.slice(Math.max(0, i - avoid), i)).not.toContain(t));
    expect(new Set(said).size).toBe(lines.length);
  });

  it('conditional lines follow thiện cảm and mood; parts build a line', () => {
    const s = born('tp-b');
    const pool = [{ text: 'lạnh', when: { affinityMax: 30 }, weight: 1 }, { text: 'thân', when: { affinityMin: 70 }, weight: 1 }];
    expect(drawText(s, content, 'k1', pool, { affinity: 90 }, new Rng('x')).text).toBe('thân');
    expect(drawText(s, content, 'k2', pool, { affinity: 10 }, new Rng('x')).text).toBe('lạnh');
    const sad = { ...s, stats: { ...s.stats, happiness: 10 } };
    const mood = ['bình thường', { text: 'buồn', when: { moodMax: 30 }, weight: 1 }];
    const moods = Array.from({ length: 12 }, (_, i) => drawText(sad, content, `m${i}`, mood, {}, new Rng(`m${i}`)).text);
    expect(moods).toContain('buồn');
    const built = drawText(s, content, 'k3', { lines: [], linesShare: 0, parts: [['Đầu.'], ['Cuối.']] }, {}, new Rng('x'));
    expect(built.text).toBe('Đầu. Cuối.');
  });

  it('an outcome without variants keeps its text and rolls nothing', () => {
    const s = born('tp-c');
    const rng = new Rng('tp-c');
    const before = rng.getState();
    const r = outcomeText(s, content, 'o', { text: 'Y nguyên.' }, rng);
    expect(r.text).toBe('Y nguyên.');
    expect(rng.getState()).toEqual(before);
    const v = outcomeText(s, content, 'o', { text: 'A.', variants: ['B.', 'C.'] }, rng);
    expect(['A.', 'B.', 'C.']).toContain(v.text);
    expect(v.state.textMemory?.o).toEqual([v.text]);
  });

  it('a returning event logs title and outcome in one line, not the echoed choice again', () => {
    const event = content.events.find((e) => e.id === 'sd_le_te_to')!;
    const s = born('tp-d');
    const pend = (x: GameState): GameState => ({ ...x, events: { ...x.events, pending: event.id, npc: null } });
    const first = resolveChoice(pend(s), content, 0).state;
    const firstLines = first.log.at(-1)!.lines.slice(-2);
    expect(firstLines[0].text.startsWith(`${event.title}: `)).toBe(true);
    const again = resolveChoice(pend(first), content, 0).state;
    const last = again.log.at(-1)!.lines.at(-1)!;
    expect(last.text.startsWith(`${event.title}: `)).toBe(true);
    expect(last.text).not.toContain(event.choices[0].text);
  });

  it('a simulated life repeats at most half as many lines as on 13/10 (39%)', () => {
    const { report } = simulateMany(content, 60, 'x', { profile: 'player' });
    expect(report.repeatRate).toBeLessThan(0.195);
  }, 60_000);
});
