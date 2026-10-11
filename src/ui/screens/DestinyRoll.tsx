// Nghịch Thiên Bốc Mệnh: show the rolled Tiên Thiên Khí Vận, allow limited rerolls.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';

const RARITY_LABEL: Record<string, string> = {
  pham: 'Phàm', luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần', ac: 'Ác vận',
};

export function DestinyRollScreen({ state, content, rollCount, onReroll, onConfirm }: {
  state: GameState;
  content: Content;
  /** Changes on every reroll so the cards flip again. */
  rollCount: number;
  onReroll: () => void;
  onConfirm: () => void;
}) {
  const traits = state.destiny.offered.map((id) => content.traits.find((t) => t.id === id)!);
  const left = state.destiny.rerollsLeft;

  return (
    <main class="destiny-screen">
      <header class="create-head">
        <h1>Nghịch Thiên Bốc Mệnh</h1>
      </header>
      <p class="destiny-intro">
        {state.character.name} vừa chào đời. Trời ban ba đạo khí vận, đổi được thì đổi, đổi rồi không lấy lại được.
      </p>

      <div class="destiny-cards">
        {traits.map((t, i) => (
          <div class={`trait-card r-${t.rarity}`} key={`${rollCount}-${t.id}`}>
            <div class="flip" style={{ animationDelay: `${i * 0.15}s` }}>
              <div class="trait-face trait-front">
                <div class="trait-head">
                  <b>{t.name}</b>
                  <span class="trait-rarity">{RARITY_LABEL[t.rarity]}</span>
                </div>
                <p class="trait-flavor">{t.flavor}</p>
                <p class="trait-summary">{t.summary}</p>
              </div>
              <div class="trait-face trait-back" aria-hidden="true">命</div>
            </div>
          </div>
        ))}
      </div>

      <div class="destiny-actions">
        <button class="btn-secondary" onClick={onReroll} disabled={left <= 0}>
          Nghịch thiên cải mệnh ({left})
        </button>
        <button class="btn-primary" onClick={onConfirm}>Thuận theo thiên ý</button>
      </div>
    </main>
  );
}
