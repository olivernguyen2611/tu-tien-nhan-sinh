// Nghịch Thiên Bốc Mệnh: show the rolled Tiên Thiên Khí Vận, allow limited rerolls.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { TermText } from '../components/Tooltip';
import { blessingNames } from '../../systems/blessings';
import { fingerDef } from '../../systems/goldenFinger';
import { traitRootNote } from '../../systems/cultivation';

const SLOT_WORDS: Record<number, string> = { 1: 'một', 2: 'hai', 3: 'ba', 4: 'bốn', 5: 'năm' };

const RARITY_LABEL: Record<string, string> = {
  pham: 'Phàm', luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần', ac: 'Ác vận',
};

export function DestinyRollScreen({ state, content, rollCount, unlimited, canLock, lockCost, onLock, onReroll, onConfirm }: {
  state: GameState;
  content: Content;
  /** Changes on every reroll so the cards flip again. */
  rollCount: number;
  /** Developer mode: rerolls never run out. */
  unlimited: boolean;
  /** Task 5b.3: one more slot can be locked (enough Luân Hồi points, below the limit). */
  canLock: boolean;
  /** Points each lock costs (0 in developer mode). */
  lockCost: number;
  onLock: (traitId: string) => void;
  onReroll: () => void;
  onConfirm: () => void;
}) {
  const traits = state.destiny.offered.map((id) => content.traits.find((t) => t.id === id)!);
  const left = state.destiny.rerollsLeft;
  const locked = state.destiny.locked;
  // Task 5b.2: drawn once at birth, rerolls do not touch it.
  const finger = fingerDef(content, state.goldenFinger?.id);

  return (
    <main class="destiny-screen">
      <header class="create-head">
        <h1>Nghịch Thiên Bốc Mệnh</h1>
      </header>
      <p class="destiny-intro">
        {state.character.name} vừa chào đời. Trời ban {SLOT_WORDS[traits.length] ?? traits.length} đạo khí vận, đổi được thì đổi, đổi rồi không lấy lại được.
        {state.destiny.maxLocks > 0 && !state.challenge && ` Khóa được ${state.destiny.maxLocks} ô để giữ khi quay lại (${lockCost} điểm Luân Hồi mỗi ô).`}
      </p>
      {state.blessings.length > 0 && (
        <p class="destiny-intro blessing-note">Phúc báo kiếp trước: <b>{blessingNames(state.blessings, content).join(', ')}</b>.</p>
      )}

      <div class="destiny-cards">
        {traits.map((t, i) => (
          <div class={`trait-card r-${t.rarity}${locked.includes(t.id) ? ' locked' : ''}`} key={locked.includes(t.id) ? t.id : `${rollCount}-${t.id}`}>
            <div class="flip" style={{ animationDelay: `${i * 0.15}s` }}>
              <div class="trait-face trait-front">
                <div class="trait-head">
                  <b>{t.name}</b>
                  <span class="trait-rarity">{RARITY_LABEL[t.rarity]}</span>
                </div>
                <p class="trait-flavor">{t.flavor}</p>
                <p class="trait-summary"><TermText text={t.summary} /></p>
                {traitRootNote(content, t.id) && <p class="trait-summary root-note">{traitRootNote(content, t.id)}</p>}
              </div>
              <div class="trait-face trait-back" aria-hidden="true">命</div>
            </div>
            {state.destiny.maxLocks > 0 && !state.challenge && (
              <button class={`chip-btn lock-btn${locked.includes(t.id) ? ' on' : ''}`} aria-pressed={locked.includes(t.id)}
                disabled={!locked.includes(t.id) && !canLock} onClick={() => onLock(t.id)}>
                {locked.includes(t.id) ? '鎖 Đã khóa' : 'Khóa ô này'}
              </button>
            )}
          </div>
        ))}
      </div>

      {finger && (
        <div class="golden-finger-card" role="note">
          <p class="kicker">Kim Thủ Chỉ</p>
          <b>{finger.name}</b>
          <p class="trait-flavor">{finger.flavor}</p>
          <p class="trait-summary"><TermText text={finger.summary} /></p>
          <p class="trait-summary risk">Rủi ro: {finger.risk}</p>
        </div>
      )}

      <div class="destiny-actions">
        <button class="btn-secondary" onClick={onReroll} disabled={!unlimited && left <= 0}>
          Nghịch thiên cải mệnh ({unlimited ? '∞' : left})
        </button>
        <button class="btn-primary" onClick={onConfirm}>Thuận theo thiên ý</button>
      </div>
    </main>
  );
}
