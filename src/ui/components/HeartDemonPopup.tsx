// Tâm ma chiến (task 4.4): illusions from the life's own past, met one by one.
// It cannot be dismissed; the breakthrough waits on it.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { optionChance, type HeartDemonOption } from '../../systems/heartDemon';

const OPTIONS: HeartDemonOption[] = ['face', 'slash', 'chant'];
const STAT_HINT: Record<HeartDemonOption, string> = { face: 'Đạo tâm', slash: 'Ngộ tính', chant: 'Đạo tâm + kháng tâm ma' };

export function HeartDemonPopup({ state, content, onMeet }: {
  state: GameState;
  content: Content;
  onMeet: (option: HeartDemonOption) => void;
}) {
  const trial = state.cult.heartDemonTrial;
  if (!trial) return null;
  const cfg = content.balance.heartDemon;
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tâm ma">
      <div class="event-card">
        <div class="kicker">Tâm ma · ảo cảnh {trial.round + 1}/{cfg.rounds} · đã qua {trial.wins}, cần {cfg.toPass}</div>
        <h2>Tâm ma</h2>
        <p class="story">{trial.illusions[trial.round]}</p>
        {OPTIONS.map((o) => (
          <button class="choice" key={o} onClick={() => onMeet(o)}>
            {content.heartDemon.options[o]}
            <span class="hint">Thử {STAT_HINT[o]}: {Math.round(optionChance(state, content, o) * 100)}% thành công</span>
          </button>
        ))}
      </div>
    </div>
  );
}
