// Nhiệm vụ chuỗi (task 5c.3): a multi-step mission from the sect. One step a year (it takes
// the year's mission slot), progress is remembered on the life, a missed step can be tried again
// next year, and too many misses drop the chain. Finishing pays a bigger reward and, when the
// chain names a sectmate, deepens the bond. Steps and texts in sect-life.json `chains`.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc } from '../core/types';
import { changeNpc, npcById } from './npcs';
import { sectmates, sectmateTitle } from './sectmates';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

const fill = (text: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), text);

function addLines(state: GameState, lines: LogLine[]): GameState['log'] {
  if (lines.length === 0) return state.log;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return log;
}

const statValue = (state: GameState, key: string) =>
  key in state.stats ? state.stats[key as keyof GameState['stats']] : state.aptitudes[key as keyof GameState['aptitudes']];

type Chain = NonNullable<Content['sectLife']>['chains'][number];

function vars(state: GameState, content: Content, npc: Npc | undefined) {
  return npc ? { npc: npc.name, title: sectmateTitle(state, content, npc) } : { npc: '', title: '' };
}

function applyOutcome(state: GameState, out: Chain['reward']): GameState {
  const stats = { ...state.stats };
  const aptitudes = { ...state.aptitudes };
  for (const [k, v] of Object.entries(out.stats)) {
    if (k in stats) stats[k as keyof typeof stats] = clamp(stats[k as keyof typeof stats] + v);
    else aptitudes[k as keyof typeof aptitudes] = clamp(aptitudes[k as keyof typeof aptitudes] + v);
  }
  return {
    ...state,
    stats,
    aptitudes,
    money: { ...state.money, spiritStones: state.money.spiritStones + out.spiritStones },
    sect: { ...state.sect, contribution: Math.max(0, state.sect.contribution + out.contribution) },
  };
}

export interface ChainView {
  id: string;
  name: string;
  /** Text of the step to do now (or the intro for a chain not yet taken). */
  text: string;
  step: number;
  steps: number;
  chance: number | null;
  active: boolean;
  blocked: string | null;
}

function slotBlocked(state: GameState): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  if (state.sect.lastMission === state.character.age) return 'Năm nay đã làm một nhiệm vụ rồi.';
  return null;
}

/** The chain under way plus those the rank allows to take. */
export function chainViews(state: GameState, content: Content): ChainView[] {
  const life = content.sectLife;
  const sectId = state.sect.id;
  if (!life || !sectId) return [];
  const cur = state.sect.chain ?? null;
  const done = state.sect.chainsDone ?? [];
  const c = content.balance.events.check;
  const out: ChainView[] = [];
  for (const chain of life.chains) {
    const active = cur?.id === chain.id;
    if (!active && (done.includes(chain.id) || chain.minRank > state.sect.rank || (chain.sects && !chain.sects.includes(sectId)))) continue;
    if (active) {
      const step = chain.steps[cur!.step]!;
      const npc = npcById(state, cur!.npc);
      out.push({
        id: chain.id, name: chain.name, text: fill(step.text, vars(state, content, npc)), step: cur!.step, steps: chain.steps.length,
        chance: Math.max(c.min, Math.min(c.max, c.base + (statValue(state, step.stat) - step.difficulty) * c.perPoint)),
        active: true, blocked: slotBlocked(state),
      });
    } else {
      out.push({
        id: chain.id, name: chain.name, text: chain.intro.replaceAll('{npc}', '…').replaceAll('{title}', ''), step: 0, steps: chain.steps.length,
        chance: null, active: false, blocked: cur ? 'Đang làm một chuỗi nhiệm vụ khác.' : slotBlocked(state),
      });
    }
  }
  return out;
}

/** Take a chain: names the sectmate it concerns, costs no mission slot. */
export function startChain(state: GameState, content: Content, chainId: string): { state: GameState; text: string; success: boolean } | null {
  const chain = content.sectLife?.chains.find((c) => c.id === chainId);
  const view = chainViews(state, content).find((v) => v.id === chainId);
  if (!chain || !view || view.active || state.sect.chain) return null;
  if (!state.alive) return null;
  let npc: Npc | undefined;
  if (chain.npcKind) {
    const pool = sectmates(state).filter((n) => n.sectmate!.kind === chain.npcKind);
    if (pool.length === 0) return null;
    npc = pool[new Rng(`${state.seed}|chain|${chainId}|${state.character.age}`).int(0, pool.length - 1)];
  }
  const text = fill(chain.intro, vars(state, content, npc));
  const s: GameState = { ...state, sect: { ...state.sect, chain: { id: chainId, step: 0, fails: 0, npc: npc?.id ?? null } } };
  return { state: { ...s, log: addLines(s, [{ text: `${chain.name}: ${text}`, tone: 'normal' }]) }, text, success: true };
}

/** Do the current step: a stat check; success moves on, failure counts a miss. */
export function doChainStep(state: GameState, content: Content, chainId: string): { state: GameState; text: string; success: boolean } | null {
  const cur = state.sect.chain;
  const chain = content.sectLife?.chains.find((c) => c.id === chainId);
  if (!cur || !chain || cur.id !== chainId || slotBlocked(state)) return null;
  const view = chainViews(state, content).find((v) => v.id === chainId)!;
  const step = chain.steps[cur.step]!;
  const npc = npcById(state, cur.npc);
  const v = vars(state, content, npc);
  const rng = Rng.fromState(state.rng);
  const success = rng.chance(view.chance ?? 0.5);
  let s: GameState = { ...state, rng: rng.getState(), sect: { ...state.sect, lastMission: state.character.age } };
  s = applyOutcome(s, success ? step.success : step.fail);
  const lines: LogLine[] = [{ text: `${chain.name} (${cur.step + 1}/${chain.steps.length}): ${fill((success ? step.success : step.fail).text, v)} Cống hiến +${(success ? step.success : step.fail).contribution}.`, tone: success ? 'good' : 'bad' }];
  if (success && cur.step + 1 >= chain.steps.length) {
    s = applyOutcome(s, chain.reward);
    lines.push({ text: `${chain.name} hoàn tất: ${fill(chain.reward.text, v)} Cống hiến +${chain.reward.contribution}.`, tone: 'good' });
    s = { ...s, sect: { ...s.sect, chain: null, chainsDone: [...(s.sect.chainsDone ?? []), chainId] } };
    if (npc && chain.affinity) s = changeNpc(s, content, npc.id, { affinity: chain.affinity, favor: 5 });
  } else if (success) {
    s = { ...s, sect: { ...s.sect, chain: { ...cur, step: cur.step + 1 } } };
  } else if (cur.fails + 1 >= content.balance.sects.chainMaxFails) {
    lines.push({ text: fill(chain.abandon, v), tone: 'bad' });
    s = { ...s, sect: { ...s.sect, chain: null } };
  } else {
    s = { ...s, sect: { ...s.sect, chain: { ...cur, fails: cur.fails + 1 } } };
  }
  return { state: { ...s, log: addLines(s, lines) }, text: lines.map((l) => l.text).join(' '), success };
}
