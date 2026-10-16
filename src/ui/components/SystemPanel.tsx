// 9.S2 Hệ thống panel: level, points, the task in hand, and what the player can do with it this year.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { systemActions, systemDef } from '../../systems/heThong';
import { TermText } from './Tooltip';

export function SystemPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  onAction: (actionId: string) => { text: string; tone: Tone; changes: string } | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const sys = state.system;
  const def = systemDef(content, sys?.id);
  if (!sys || !def) return null;
  const next = def.levels[sys.level + 1];
  const task = sys.task ? def.tasks.find((t) => t.id === sys.task!.id) : undefined;

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={def.name} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card system-panel">
        <div class="kicker">Hệ thống{sys.gone ? ' · đã tắt' : ''}</div>
        <h2>{def.name}</h2>
        <p class="story"><TermText text={def.text} /></p>
        {sys.gone ? (
          <p class="profile-note risk" role="status">Hệ thống đã im bặt. Không còn tiếng "đinh" nào nữa.</p>
        ) : (
          <>
            <p class="profile-note">
              <b>Cấp:</b> {def.levels[sys.level].name} · <b>Điểm:</b> {sys.points}
              {next && <span class="muted"> · lên "{next.name}" ở {next.points} điểm</span>}
            </p>
            {next && <div class="bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (sys.points / next.points) * 100)}%` }} /></div>}
            <p class="profile-note"><b>Nhiệm vụ:</b> {task && sys.task ? `${task.text} (còn ${Math.max(0, sys.task.until - state.character.age)} năm)` : 'chưa có'}</p>
            <h3 class="panel-sub">Dùng năm nay</h3>
            {result && (
              <p class={`action-result ${result.tone}`} role="status">
                {result.text}
                {result.changes && <span class="changes">{result.changes}</span>}
              </p>
            )}
            {systemActions(state, content).map((a) => (
              <div class="career-row" key={a.id}>
                <div class="craft-head"><b>{a.name}</b>{a.cost !== 0 && <span class="muted">{a.cost > 0 ? `−${a.cost} điểm` : `+${-a.cost} điểm`}</span>}</div>
                <p class="profile-note">{a.text}</p>
                <button class="chip-btn" disabled={!!a.blocked} onClick={() => {
                  if (a.id === 'quit' && !confirm('Đoạn tuyệt với hệ thống? Không thể quay lại.')) return;
                  const r = onAction(a.id);
                  if (r) setResult(r);
                }}>{a.id === 'quit' ? 'Đoạn tuyệt' : 'Dùng'}</button>
                {a.blocked && <span class="craft-note">{a.blocked}</span>}
              </div>
            ))}
          </>
        )}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
