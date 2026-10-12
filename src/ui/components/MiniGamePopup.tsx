// Martial quest mini-games (backlog 7): Vòng đá ngũ hành and Điều tức quan tưởng.
// Cannot be dismissed except by giving up; the year waits for it. All rules are in systems/martialQuest.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { gameSymbols, questView } from '../../systems/martialQuest';

export type QuestAction =
  | { kind: 'step'; aid: boolean }
  | { kind: 'input'; symbol: string }
  | { kind: 'hide' }
  | { kind: 'quit' };

export function MiniGamePopup({ state, content, onAction }: {
  state: GameState;
  content: Content;
  onAction: (a: QuestAction) => void;
}) {
  const game = state.martial.quest?.game;
  const view = questView(state, content);
  if (!game || !view) return null;
  const texts = content.martial.games;
  const symbols = gameSymbols(game, content);
  const name = (id: string) => symbols.find((s) => s.id === id)?.name ?? id;
  const left = game.allowed - game.mistakes;
  const info = game.kind === 'ngu_hanh' ? texts.ngu_hanh : texts.dieu_tuc;
  const how = game.kind === 'ngu_hanh' ? texts.ngu_hanh[game.mode ?? 'sinh'] : game.shown ? texts.dieu_tuc.intro : texts.dieu_tuc.recall;
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={info.name}>
      <div class="event-card">
        <div class="kicker">{view.quest.name} · ải {view.stepIndex + 1}/{view.total}</div>
        <h2>{view.step.title}</h2>
        <p class="story">{how}</p>
        <p class="profile-note">Còn được sai {Math.max(0, left)} lần{game.aided ? ' (đã dùng vật phẩm hỗ trợ)' : ''}.</p>
        {game.kind === 'dieu_tuc' && game.shown ? (
          <>
            <p class="story" aria-live="polite"><b>{game.target.map(name).join(' → ')}</b></p>
            <button class="choice" onClick={() => onAction({ kind: 'hide' })}>{texts.dieu_tuc.hide}</button>
          </>
        ) : (
          <>
            <p class="story" aria-live="polite">
              {game.input.length > 0 ? game.input.map(name).join(' → ') : 'Chưa nhập gì.'}
              {` (${game.input.length}/${game.target.length})`}
            </p>
            <div class="minigame-keys">
              {symbols.map((s) => (
                <button class="choice" key={s.id} onClick={() => onAction({ kind: 'input', symbol: s.id })}>{s.name}</button>
              ))}
            </div>
          </>
        )}
        <button class="chip-btn" onClick={() => onAction({ kind: 'quit' })}>Bỏ ải</button>
      </div>
    </div>
  );
}
