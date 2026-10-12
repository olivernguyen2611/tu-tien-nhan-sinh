// Sư phụ và đồ đệ (task 5c.8): luận bàn, luận đạo, truyền công pháp, tặng vật phẩm.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Npc } from '../../core/types';
import { actBlocked, giftableItems, sparChance, teachableTechniques, type DiscipleAct } from '../../systems/discipleActs';

export function DiscipleActs({ state, content, npc, onAct }: {
  state: GameState;
  content: Content;
  npc: Npc;
  onAct: (act: DiscipleAct) => void;
}) {
  const [techId, setTechId] = useState('');
  const [itemId, setItemId] = useState('');
  const techs = teachableTechniques(state, content, npc);
  const gifts = giftableItems(state, content);
  const spar: DiscipleAct = { kind: 'spar' };
  const debate: DiscipleAct = { kind: 'debate' };
  const tech: DiscipleAct = { kind: 'technique', techniqueId: techId };
  const gift: DiscipleAct = { kind: 'gift', itemId };
  return (
    <div class="action-chips disciple-acts">
      <button class="chip-btn" disabled={!!actBlocked(state, content, npc, spar)} title={actBlocked(state, content, npc, spar) ?? undefined} onClick={() => onAct(spar)}>
        Luận bàn · {Math.round(sparChance(state, content, npc) * 100)}%
      </button>
      <button class="chip-btn" disabled={!!actBlocked(state, content, npc, debate)} title={actBlocked(state, content, npc, debate) ?? undefined} onClick={() => onAct(debate)}>Luận đạo</button>
      {techs.length > 0 && (
        <span class="act-pick">
          <select value={techId} onChange={(e) => setTechId((e.target as HTMLSelectElement).value)} aria-label="Công pháp truyền cho đồ đệ">
            <option value="">Công pháp…</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button class="chip-btn" disabled={!techId || !!actBlocked(state, content, npc, tech)} title={techId ? actBlocked(state, content, npc, tech) ?? undefined : undefined} onClick={() => { onAct(tech); setTechId(''); }}>Truyền công pháp</button>
        </span>
      )}
      {gifts.length > 0 && (
        <span class="act-pick">
          <select value={itemId} onChange={(e) => setItemId((e.target as HTMLSelectElement).value)} aria-label="Vật phẩm tặng đồ đệ">
            <option value="">Vật phẩm…</option>
            {gifts.map((g) => <option key={g.item.id} value={g.item.id}>{g.item.name} ×{g.count}</option>)}
          </select>
          <button class="chip-btn" disabled={!itemId || !!actBlocked(state, content, npc, gift)} title={itemId ? actBlocked(state, content, npc, gift) ?? undefined : undefined} onClick={() => { onAct(gift); setItemId(''); }}>Tặng</button>
        </span>
      )}
    </div>
  );
}
