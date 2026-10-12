// Khai tông lập phái (task 5.1): from Kim Đan, a cultivator with the spirit
// stones may open a mountain gate: pick a name, carry their own lineage, and set
// up to three tông quy. The founder leaves any sect they were in. Rules change
// who comes (recruitMul), karma each year, reputation on founding and give the
// founder K.6 hooks. Yearly running (members, treasury, buildings) is task 5.2.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { EffectHook } from '../core/schemas';
import type { GameState, LogLine } from '../core/types';
import { sectById } from './sect';

function realmIndex(content: Content, id: string): number {
  return content.cultivation.realms.realms.findIndex((r) => r.id === id);
}

/** Why this life cannot found a sect now, or null. */
export function foundBlocked(state: GameState, content: Content): string | null {
  const cfg = content.balance.founding;
  if (!state.alive) return 'Đã hết một đời.';
  if (state.ownSect) return 'Đã khai tông rồi.';
  if (realmIndex(content, state.cult.realm) < realmIndex(content, cfg.minRealm)) {
    return `Tới ${content.cultivation.realms.realms[realmIndex(content, cfg.minRealm)]?.name ?? cfg.minRealm} mới đủ uy khai tông.`;
  }
  if (state.money.spiritStones < cfg.cost) return `Cần ${cfg.cost} linh thạch để mở sơn môn.`;
  return null;
}

/** A name to start from: "Thanh Tiêu Tông", "Huyền Nguyệt Các"… */
export function suggestSectName(state: GameState, content: Content, salt = 0): string {
  const p = content.founding.nameParts;
  const rng = new Rng(`${state.seed}:sect-name:${state.character.age}:${salt}`);
  return `${rng.pick(p.first)} ${rng.pick(p.second)} ${rng.pick(p.suffix)}`;
}

/** Name rule: trimmed length within balance.founding.nameLength. */
export function sectNameProblem(name: string, content: Content): string | null {
  const [min, max] = content.balance.founding.nameLength;
  const n = name.trim().length;
  if (n < min) return 'Tên tông môn quá ngắn.';
  if (n > max) return 'Tên tông môn quá dài.';
  return null;
}

function pushLines(state: GameState, lines: LogLine[]): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { ...state, log };
}

export function foundSect(state: GameState, content: Content, input: { name: string; rules: string[] }): { state: GameState; text: string } | null {
  const cfg = content.balance.founding;
  const rules = [...new Set(input.rules)].filter((id) => content.founding.rules.some((r) => r.id === id));
  if (foundBlocked(state, content) || sectNameProblem(input.name, content) || rules.length > cfg.maxRules) return null;
  const name = input.name.trim();
  const lineage = state.cult.lineage ?? 'tien';
  const lineageName = content.lineages.find((l) => l.id === lineage)?.name ?? lineage;
  const t = content.founding.texts;
  const lines: LogLine[] = [];
  let s = state;
  const old = sectById(content, state.sect.id);
  if (old) {
    lines.push({ text: t.leftOld.replaceAll('{old}', old.name), tone: 'normal' });
    s = { ...s, sect: { ...s.sect, id: null, rank: 0, contribution: 0, master: null, left: [...s.sect.left, old.id] } };
  }
  const members = cfg.startMembers[state.cult.realm] ?? 0;
  const rep = { ...s.social.reputation };
  for (const id of rules) {
    for (const [k, v] of Object.entries(content.founding.rules.find((r) => r.id === id)!.reputation)) {
      rep[k as keyof typeof rep] = Math.max(-100, Math.min(100, rep[k as keyof typeof rep] + v));
    }
  }
  s = {
    ...s,
    money: { ...s.money, spiritStones: s.money.spiritStones - cfg.cost },
    social: { ...s.social, reputation: rep },
    ownSect: { name, lineage, rules, founded: state.character.age, members, treasury: 0, buildings: {} },
  };
  const text = t.founded.replaceAll('{sect}', name).replaceAll('{lineage}', lineageName).replaceAll('{members}', String(members));
  lines.push({ text, tone: 'rare' });
  return { state: pushLines(s, lines), text: lines.map((l) => l.text).join(' ') };
}

/** Hooks from the founder's own tông quy (part of lifeHooks). */
export function ownSectHooks(state: GameState, content: Content): EffectHook[] {
  if (!state.ownSect) return [];
  return state.ownSect.rules.flatMap((id) => content.founding.rules.find((r) => r.id === id)?.effects ?? []);
}
