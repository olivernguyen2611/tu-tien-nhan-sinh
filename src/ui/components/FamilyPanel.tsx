// "Quan hệ" sheet: family members with affinity; tap a relative to see what you can do together.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { availableActions, relationLabel } from '../../systems/relationships';
import { Meter } from './Meter';

export function FamilyPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  /** Returns the outcome text to show under the relative. */
  onAction: (relativeId: string, actionId: string) => { text: string; tone: Tone; changes: string };
  onClose: () => void;
}) {
  const age = state.character.age;
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; text: string; tone: Tone; changes: string } | null>(null);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quan hệ" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Quan hệ</div>
        <h2>Gia đình</h2>
        {state.family.some((r) => r.alive) && <p class="profile-note">Chạm vào một người để tương tác. Mỗi việc làm được một lần mỗi năm.</p>}
        {state.family.length === 0 ? (
          <p class="story">Ngươi không cha không mẹ, một thân một mình giữa trời đất.</p>
        ) : (
          <ul class="family-list">
            {state.family.map((r) => (
              <li class={`relative${r.alive ? '' : ' dead'}`} key={r.id}>
                <button class="relative-head" disabled={!r.alive} aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <span class="relation">{relationLabel(r, age)}</span>
                  <b>{r.name}</b>
                  <span class="relative-age">{r.alive ? `${r.age} tuổi` : `mất năm ${r.age} tuổi`}</span>
                </button>
                {r.alive && <Meter label="Thiện cảm" value={r.affinity} tone="auto" />}
                {r.alive && open === r.id && (
                  <div class="action-chips">
                    {availableActions(state, content, r).map((a) => (
                      <button class="chip-btn" key={a.id} disabled={a.disabled} title={a.reason ?? undefined}
                        onClick={() => setResult({ id: r.id, ...onAction(r.id, a.id) })}>
                        {a.name}{a.cost > 0 && <span class="chip-cost"> · {a.cost} bạc</span>}
                      </button>
                    ))}
                  </div>
                )}
                {result?.id === r.id && result.text && (
                  <p class={`action-result ${result.tone}`}>
                    {result.text}
                    {result.changes && <span class="changes">{result.changes}</span>}
                  </p>
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
