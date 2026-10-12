// Nghịch Thiên Cải Mệnh after a big breakthrough (task 2.7): pick 1 of 3 fate
// talents. It cannot be dismissed; the next year waits for the choice.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { TermText } from './Tooltip';

const RARITY_LABEL: Record<string, string> = { luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần' };

export function FatePopup({ state, content, unlimited, onChoose, onReroll }: {
  state: GameState;
  content: Content;
  /** Developer mode: refreshes never run out. */
  unlimited: boolean;
  onChoose: (talentId: string) => void;
  onReroll: () => void;
}) {
  const fate = state.fate;
  if (!fate) return null;
  const talents = fate.offered.map((id) => content.fateTalents.find((t) => t.id === id)!).filter(Boolean);
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Nghịch Thiên Cải Mệnh">
      <div class="event-card fate-card">
        <div class="kicker">Đột phá thành công</div>
        <h2>Nghịch Thiên Cải Mệnh</h2>
        <p class="story">Thiên đạo mở ra một khe hở. Chọn một con đường, chọn rồi không đổi.</p>
        <div class="fate-options">
          {talents.map((t) => (
            <button class={`trait-card fate-option r-${t.rarity}`} key={t.id} onClick={() => onChoose(t.id)}>
              <div class="trait-face trait-front">
                <div class="trait-head">
                  <b>{t.name}</b>
                  <span class="trait-rarity">{RARITY_LABEL[t.rarity] ?? t.rarity}</span>
                </div>
                <p class="trait-flavor">{t.flavor}</p>
                <p class="trait-summary"><TermText text={t.summary} /></p>
              </div>
            </button>
          ))}
        </div>
        <button class="btn-secondary" onClick={onReroll} disabled={!unlimited && fate.refreshesLeft <= 0}>
          Làm mới ({unlimited ? '∞' : fate.refreshesLeft})
        </button>
      </div>
    </div>
  );
}
