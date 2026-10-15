// Tặng một món trong túi cho người quen (task 9.0.2). Luật ở systems/npcGift; đây chỉ chọn và gửi.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Npc } from '../../core/types';
import { giftBlocked, giftOptions } from '../../systems/npcGift';
import { GroupedSelect } from './GroupedSelect';

export function NpcGiftRow({ state, content, npc, onGift }: {
  state: GameState;
  content: Content;
  npc: Npc;
  onGift: (itemId: string) => void;
}) {
  const [picked, setPicked] = useState('');
  const blocked = giftBlocked(state, npc);
  const options = giftOptions(state, content, npc);
  const chosen = options.some((o) => o.id === picked) ? picked : options[0]?.id ?? '';
  return (
    <div class="bond-row">
      {!blocked && options.length > 0 && (
        <GroupedSelect value={chosen} onChange={setPicked} label={`Vật phẩm tặng ${npc.name}`} options={options} />
      )}
      <button class="chip-btn" disabled={!!blocked || !chosen} title={blocked ?? undefined} onClick={() => onGift(chosen)}>Tặng đồ</button>
      {blocked && <span class="craft-note">{blocked}</span>}
    </div>
  );
}
