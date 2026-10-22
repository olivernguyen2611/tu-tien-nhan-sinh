// 13.7b Bày trận: place the trận kỳ along tương sinh. Cannot be dismissed except by giving up.
// All rules are in systems/formation.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { formationSymbols, openSlots } from '../../systems/formation';

export type FormationAction =
  | { kind: 'begin'; id: string }
  | { kind: 'input'; symbol: string }
  | { kind: 'quit' };

export function FormationPopup({ state, content, onAction }: {
  state: GameState;
  content: Content;
  onAction: (a: FormationAction) => void;
}) {
  const game = state.formation?.game;
  if (!game) return null;
  const def = content.recipes.formations.find((f) => f.id === game.id);
  const symbols = formationSymbols(content);
  const name = (id: string) => symbols.find((s) => s.id === id)?.name ?? id;
  const slots = openSlots(game);
  // The ring as it stands: given and placed trận kỳ by name, the rest as "?".
  const ring = game.target.map((id, i) => {
    if (game.given.includes(i)) return name(id);
    const k = slots.indexOf(i);
    return k < game.input.length ? name(game.input[k]) : '?';
  });
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={def?.name ?? 'Bày trận'}>
      <div class="event-card">
        <div class="kicker">Bày trận</div>
        <h2>{def?.name}</h2>
        <p class="story">{content.recipes.formationTexts?.intro}</p>
        <p class="profile-note">Còn được sai {Math.max(0, game.allowed - game.mistakes)} lần.</p>
        <p class="story" aria-live="polite"><b>{ring.join(' → ')}</b></p>
        <div class="minigame-keys">
          {symbols.map((s) => (
            <button class="choice" key={s.id} onClick={() => onAction({ kind: 'input', symbol: s.id })}>{s.name}</button>
          ))}
        </div>
        <button class="chip-btn" onClick={() => onAction({ kind: 'quit' })}>Nhổ trận kỳ</button>
      </div>
    </div>
  );
}
