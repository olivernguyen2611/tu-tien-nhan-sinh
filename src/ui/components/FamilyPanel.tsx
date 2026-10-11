// "Quan hệ" sheet: family members with affinity, and a yearly "Hỏi han".
import type { GameState } from '../../core/types';
import { relationLabel } from '../../systems/relationships';
import { Meter } from './Meter';

export function FamilyPanel({ state, onChat, onClose }: {
  state: GameState;
  onChat: (relativeId: string) => void;
  onClose: () => void;
}) {
  const age = state.character.age;
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quan hệ" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Quan hệ</div>
        <h2>Gia đình</h2>
        {state.family.length === 0 ? (
          <p class="story">Ngươi không cha không mẹ, một thân một mình giữa trời đất.</p>
        ) : (
          <ul class="family-list">
            {state.family.map((r) => (
              <li class={`relative${r.alive ? '' : ' dead'}`} key={r.id}>
                <div class="relative-head">
                  <span class="relation">{relationLabel(r, age)}</span>
                  <b>{r.name}</b>
                  <span class="relative-age">{r.alive ? `${r.age} tuổi` : `mất năm ${r.age} tuổi`}</span>
                </div>
                {r.alive && (
                  <div class="relative-row">
                    <Meter label="Thiện cảm" value={r.affinity} tone="auto" />
                    <button class="chip-btn" disabled={r.chattedAt === age} onClick={() => onChat(r.id)}>
                      {r.chattedAt === age ? 'Đã hỏi han' : 'Hỏi han'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
