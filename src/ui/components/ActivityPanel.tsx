// 9.2 Hoạt động panel: what the player can choose to do this year, under group headings.
// Lists activityViews and sends the id back; every rule lives in systems/activities.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { ACTIVITY_GROUP_NAMES, activityViews } from '../../systems/activities';
import { TermText } from './Tooltip';

export function ActivityPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  onAction: (id: string) => { text: string; tone: Tone; changes: string } | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const views = activityViews(state, content);
  const groups = [...new Set(views.map((v) => v.group))];

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Hoạt động" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card activity-panel">
        <div class="kicker">Năm {state.character.age} tuổi</div>
        <h2>Hoạt động</h2>
        {result && (
          <p class={`action-result ${result.tone}`} role="status">
            <TermText text={result.text} />
            {result.changes && <span class="changes">{result.changes}</span>}
          </p>
        )}
        {groups.map((g) => (
          <section key={g}>
            <h3 class="panel-sub">{ACTIVITY_GROUP_NAMES[g]}</h3>
            {views.filter((v) => v.group === g).map((a) => (
              <div class="career-row activity-row" key={a.id}>
                <div class="craft-head">
                  <b><span class="activity-icon" aria-hidden="true">{a.icon}</span> {a.name}</b>
                  <span class="muted">
                    {a.cost ?? ''}{a.cost && a.chance !== null ? ' · ' : ''}{a.chance !== null ? `${Math.round(a.chance * 100)}%` : ''}
                  </span>
                </div>
                <p class="profile-note"><TermText text={a.text} /></p>
                <button class="chip-btn" disabled={!!a.blocked} onClick={() => { const r = onAction(a.id); if (r) setResult(r); }}>Làm</button>
                {a.blocked && <span class="craft-note">{a.blocked}</span>}
              </div>
            ))}
          </section>
        ))}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
