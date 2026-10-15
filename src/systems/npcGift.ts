// Tặng vật phẩm cho người quen (task 9.0.2): chọn một món trong túi tặng bất kỳ người quen nào
// (đồ đệ và đạo lữ đã có đường riêng). Hợp gu hay không tùy bản chất họ; tu sĩ dùng được đan dược,
// pháp khí thì dùng thật; phàm nhân chỉ cất giữ; người đang lạnh nhạt có thể từ chối. Số ở balance.npcGift.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine, Npc, Tone } from '../core/types';
import { itemById, removeItems } from './items';
import { changeNpc, npcById } from './npcs';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export interface GiftOption { id: string; name: string; group: string; hint: string }

/** How well this kind of item suits the NPC: >1 hợp gu, <1 không hợp, 1 trung tính. */
export function tasteOf(content: Content, n: Npc, kind: string): number {
  return content.balance.npcGift.taste[n.nature ?? '']?.[kind] ?? 1;
}

/** Why nothing can be given to this NPC now, or null. */
export function giftBlocked(state: GameState, n: Npc): string | null {
  if (!state.alive) return 'Đã hết một đời.';
  if (!n.alive) return 'Người đã khuất.';
  if (n.lastGift === state.character.age) return 'Năm nay đã tặng rồi.';
  if (Object.values(state.inventory).every((c) => !(c > 0))) return 'Trong túi không có gì để tặng.';
  return null;
}

/** Items carried, grouped by kind, with a hint on whether it suits this NPC (once their nature is known). */
export function giftOptions(state: GameState, content: Content, n: Npc): GiftOption[] {
  const kinds = content.lifeTexts.familyBond.kindNames;
  const t = content.lifeTexts.npcGift;
  return Object.entries(state.inventory)
    .filter(([, c]) => c > 0)
    .flatMap(([id, c]) => {
      const it = itemById(content, id);
      if (!it) return [];
      const m = n.natureKnown ? tasteOf(content, n, it.kind) : 1;
      const taste = m > 1 ? t.likes : m < 1 ? t.dislikes : '';
      return [{ id, name: `${it.name} ×${c}`, group: kinds[it.kind] ?? it.kind, hint: [taste, it.summary ?? ''].filter(Boolean).join(' · ') }];
    });
}

const fill = (text: string, vars: Record<string, string>) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), text);

/** Give one item to an NPC. Returns null when it cannot be done. */
export function giftNpc(state: GameState, content: Content, npcId: string, itemId: string): { state: GameState; text: string; tone: Tone } | null {
  const n = npcById(state, npcId);
  const it = itemById(content, itemId);
  if (!n || !it || giftBlocked(state, n) || !(state.inventory[itemId] > 0)) return null;
  const cfg = content.balance.npcGift;
  const t = content.lifeTexts.npcGift;
  const rng = Rng.fromState(state.rng);
  const vars = { npc: n.name, item: it.name };
  const age = state.character.age;
  const mark = (x: Npc): Npc => ({ ...x, lastGift: age });
  const lines: LogLine[] = [];
  let s: GameState = { ...state, npcs: state.npcs.map((x) => (x.id === npcId ? mark(x) : x)) };

  // A cold heart turns the gift down; the item stays with the player.
  if (n.affinity < cfg.rejectBelow && rng.chance(cfg.rejectChance)) {
    s = changeNpc(s, content, npcId, { affinity: cfg.rejectAffinity });
    s = { ...s, stats: { ...s.stats, happiness: clamp(s.stats.happiness - 1) } };
    lines.push({ text: fill(rng.pick(t.rejected), vars), tone: 'bad' });
  } else {
    s = removeItems(s, [itemId]);
    const taste = tasteOf(content, n, it.kind);
    const cultivator = n.realm !== 'pham_nhan';
    // Cultivation goods are wasted on a mortal: they only keep it.
    const useful = cultivator || (it.kind !== 'pill' && it.kind !== 'artifact');
    const gain = (cfg.affinity[it.kind] ?? cfg.affinity.misc ?? 0) * taste * (useful ? 1 : cfg.mortalMul);
    s = changeNpc(s, content, npcId, { affinity: gain, favor: Math.round(gain / 2), grudge: -cfg.grudgeEase });
    lines.push({ text: fill(rng.pick(taste > 1 ? t.liked : taste < 1 ? t.disliked : t.gift), vars), tone: taste < 1 ? 'normal' : 'good' });
    if (cultivator && it.kind === 'pill') {
      s = { ...s, npcs: s.npcs.map((x) => (x.id === npcId ? { ...x, progress: x.progress + cfg.useProgress } : x)) };
      lines.push({ text: fill(rng.pick(t.usedPill), vars), tone: 'good' });
    } else if (cultivator && it.kind === 'artifact') {
      s = { ...s, npcs: s.npcs.map((x) => (x.id === npcId ? { ...x, aptitude: clamp(x.aptitude + cfg.useAptitude) } : x)) };
      lines.push({ text: fill(rng.pick(t.usedArtifact), vars), tone: 'good' });
    } else if (!useful) {
      lines.push({ text: fill(rng.pick(t.mortal), vars), tone: 'normal' });
    }
    s = { ...s, stats: { ...s.stats, happiness: clamp(s.stats.happiness + cfg.playerHappiness) } };
  }
  s = { ...s, rng: rng.getState() };
  const log = s.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  return { state: { ...s, log }, text: lines.map((l) => l.text).join(' '), tone: lines[0]?.tone ?? 'normal' };
}
