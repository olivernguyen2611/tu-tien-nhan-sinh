// Developer mode panel: play-testing cheats. All changes go through systems/dev.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { STAT_LABELS } from '../../systems/deltas';
import { DEV_STATS, devAddKarma, devAddMoney, devAddStat, devHeal, devSkipYears, devStartFight, devTriggerEvent } from '../../systems/dev';

export function DevPanel({ state, content, onChange, onDisable, onClose }: {
  state: GameState;
  content: Content;
  onChange: (next: GameState) => void;
  onDisable: () => void;
  onClose: () => void;
}) {
  const [eventId, setEventId] = useState(content.events[0]?.id ?? '');
  const live = state.alive;
  const stats: Record<string, number> = { ...state.stats, ...state.aptitudes };

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Developer mode" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card dev-panel">
        <div class="kicker">Developer mode</div>
        <h2>Bảng thử nghiệm</h2>
        <p class="profile-note">Seed <code>{state.seed}</code> · mọi thay đổi ghi [Dev] trong nhật ký.</p>

        <h3>Chỉ số</h3>
        <ul class="dev-stats">
          {DEV_STATS.map((k) => (
            <li key={k}>
              <span>{STAT_LABELS[k]}</span>
              <b>{stats[k]}</b>
              <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddStat(state, k, -10))}>−10</button>
              <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddStat(state, k, 10))}>+10</button>
            </li>
          ))}
        </ul>

        <h3>Tài sản</h3>
        <div class="action-chips">
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddMoney(state, 100, 0))}>+100 bạc</button>
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddMoney(state, 0, 10))}>+10 linh thạch</button>
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddKarma(state, -10))}>Nhân quả −10</button>
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddKarma(state, 10))}>Nhân quả +10</button>
        </div>

        <h3>Thời gian</h3>
        <div class="action-chips">
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devSkipYears(state, content, 1))}>Qua 1 năm</button>
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devSkipYears(state, content, 10))}>Qua 10 năm</button>
          <button class="chip-btn" disabled={!live} onClick={() => onChange(devHeal(state))}>Hồi đầy sức khỏe</button>
        </div>

        <h3>Đánh thử</h3>
        <div class="action-chips">
          <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'below', 'rob')); onClose(); }}>Yếu hơn</button>
          <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'same', 'teach')); onClose(); }}>Ngang sức</button>
          <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'above', 'kill')); onClose(); }}>Mạnh hơn (muốn giết)</button>
        </div>

        <h3>Gọi sự kiện</h3>
        <div class="dev-event">
          <select value={eventId} onChange={(e) => setEventId((e.target as HTMLSelectElement).value)} aria-label="Sự kiện">
            {content.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} ({ev.id})</option>)}
          </select>
          <button class="chip-btn" disabled={!live || !eventId} onClick={() => { onChange(devTriggerEvent(state, content, eventId)); onClose(); }}>Gọi</button>
        </div>

        <div class="dev-foot">
          <button class="chip-btn danger" onClick={onDisable}>Tắt Developer mode</button>
          <button class="choice" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
