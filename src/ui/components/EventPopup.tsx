// Event card: story, choices (hidden ones lit in their trait's colour), then the outcome.
import type { Content } from '../../core/content';
import { fillTemplate } from '../../core/state';
import type { GameState, Tone } from '../../core/types';
import { findEvent, visibleChoices } from '../../systems/events/engine';

const STAT_NAMES: Record<string, string> = {
  'stat.health': 'Sức khỏe', 'stat.happiness': 'Hạnh phúc', 'stat.intellect': 'Trí tuệ', 'stat.charm': 'Mị lực',
  'stat.physique': 'Căn cốt', 'stat.comprehension': 'Ngộ tính', 'stat.luck': 'Khí vận', 'stat.daoHeart': 'Đạo tâm',
};

const CATEGORY_NAMES: Record<string, string> = {
  childhood: 'Tuổi thơ', study: 'Đi học', work: 'Mưu sinh', funny: 'Chuyện lạ', accident: 'Tai ương',
};

export interface PopupResult { title: string; text: string; tone: Tone }

export function EventPopup({ state, content, result, onChoose, onClose }: {
  state: GameState;
  content: Content;
  /** Outcome of the choice just made; shown instead of the choices. */
  result: PopupResult | null;
  onChoose: (index: number) => void;
  onClose: () => void;
}) {
  const event = state.events.pending ? findEvent(content, state.events.pending) : undefined;
  if (!result && !event) return null;

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={result?.title ?? event?.title}>
      <div class="event-card">
        {result ? (
          <>
            <div class="kicker">Tuổi {state.character.age}</div>
            <h2>{result.title}</h2>
            <p class={`story outcome ${result.tone}`}>{result.text}</p>
            <button class="choice" onClick={onClose}>Tiếp tục</button>
          </>
        ) : event && (
          <>
            <div class="kicker">{CATEGORY_NAMES[event.category] ?? event.category} · tuổi {state.character.age}</div>
            <h2>{event.title}</h2>
            <p class="story">{fillTemplate(event.text, state)}</p>
            {visibleChoices(state, content, event).map((c) => {
              const trait = c.traitId ? content.traits.find((t) => t.id === c.traitId) : undefined;
              return (
                <button key={c.index} class={`choice${c.hidden ? ` hidden-choice r-${trait?.rarity ?? 'pham'}` : ''}`}
                  disabled={c.disabled} onClick={() => onChoose(c.index)}>
                  {trait && <span class="choice-trait">[{trait.name}]</span>} {c.text}
                  {c.check && <span class="hint">Thử {STAT_NAMES[c.check.stat] ?? c.check.stat}: {Math.round(c.check.chance * 100)}% thành công</span>}
                  {c.disabled && <span class="hint">Chưa đủ điều kiện</span>}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
