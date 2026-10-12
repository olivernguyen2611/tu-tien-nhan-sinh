// "Túi đồ" (task 3.1): what the character carries; tap an item to read it and use it.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { itemById, useBlocker } from '../../systems/items';

const KIND_LABEL: Record<string, string> = {
  pill: 'Đan dược', artifact: 'Pháp bảo', array: 'Trận bàn', talisman: 'Bùa', material: 'Nguyên liệu', misc: 'Vật dụng',
};

export function BagPanel({ state, content, onUse, onClose }: {
  state: GameState;
  content: Content;
  onUse: (itemId: string) => { text: string; tone: Tone; changes: string };
  onClose: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; text: string; tone: Tone; changes: string } | null>(null);
  const items = Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ item: itemById(content, id), id, n }))
    .filter((x) => x.item);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Túi đồ" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Túi đồ</div>
        <h2>Hành trang</h2>
        <p class="profile-note">
          {state.money.silver} lượng bạc · {state.money.spiritStones} linh thạch
        </p>
        {items.length === 0 && result === null ? (
          <p class="story">Túi rỗng, chỉ có gió lùa qua.</p>
        ) : (
          <ul class="bag-list">
            {items.map(({ item, id, n }) => {
              const blocker = useBlocker(state, content, id);
              return (
                <li key={id} class="bag-item">
                  <button class="relative-head" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>
                    <span class="relation">{KIND_LABEL[item!.kind] ?? item!.kind}</span>
                    <b>{item!.name}</b>
                    <span class="relative-age">×{n}</span>
                  </button>
                  {open === id && (
                    <div class="bag-detail">
                      <p class="story">{item!.description}</p>
                      {item!.summary && <p class="profile-note">{item!.summary}</p>}
                      {item!.use && (
                        <button class="chip-btn" disabled={!!blocker}
                          onClick={() => setResult({ id, ...onUse(id) })}>
                          Dùng{blocker ? ` · ${blocker}` : ''}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {result && (
          <p class={`action-result ${result.tone}`} role="status">
            {result.text}
            {result.changes && <span class="changes">{result.changes}</span>}
          </p>
        )}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
