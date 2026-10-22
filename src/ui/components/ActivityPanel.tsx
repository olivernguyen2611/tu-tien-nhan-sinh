// 9.2 / 9.7 Hoạt động: what the player can choose to do this year. ActivityList is the rows of some groups
// (used inside Bản thân, Nhân duyên, Gia sản…); ActivityPanel is the Hành sự sheet, a grid of group tiles
// that opens one group's list. Every rule lives in systems/activities.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { ActivityGroup } from '../../core/schemas';
import type { GameState, Tone } from '../../core/types';
import { ACTIVITY_GROUP_GLYPHS, ACTIVITY_GROUP_NAMES, activityViews } from '../../systems/activities';
import { TermText } from './Tooltip';
import { monthsLeft } from '../../systems/timeBudget';
import { festivalLine } from '../../systems/leisure';

type ActResult = { text: string; tone: Tone; changes: string } | null;

export function ActivityList({ state, content, groups, onAction, headings = true }: {
  state: GameState;
  content: Content;
  groups: ActivityGroup[];
  onAction: (id: string) => ActResult;
  /** Group headings over the rows (off when the sheet is already one group). */
  headings?: boolean;
}) {
  const [result, setResult] = useState<ActResult>(null);
  const views = activityViews(state, content).filter((v) => groups.includes(v.group));
  if (views.length === 0) return null;
  const shown = [...new Set(views.map((v) => v.group))];
  return (
    <div class="activity-list">
      {result && (
        <p class={`action-result ${result.tone}`} role="status">
          <TermText text={result.text} />
          {result.changes && <span class="changes">{result.changes}</span>}
        </p>
      )}
      {shown.map((g) => (
        <section key={g}>
          {headings && <h3 class="panel-sub">{ACTIVITY_GROUP_NAMES[g]}</h3>}
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
    </div>
  );
}

export function ActivityPanel({ state, content, title, groups, onAction, onClose }: {
  state: GameState;
  content: Content;
  title: string;
  groups: ActivityGroup[];
  onAction: (id: string) => ActResult;
  onClose: () => void;
}) {
  const views = activityViews(state, content).filter((v) => groups.includes(v.group));
  const tiles = groups.filter((g) => views.some((v) => v.group === g));
  const [open, setOpen] = useState<ActivityGroup | null>(tiles.length === 1 ? tiles[0] : null);

  return (
    <div class="modal-backdrop sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card activity-panel">
        <div class="kicker">Năm {state.character.age} tuổi · còn {monthsLeft(state, content)}/{content.balance.time.monthsPerYear} tháng</div>
        <h2>{open ? ACTIVITY_GROUP_NAMES[open] : title}</h2>
        {(!open || open === 'giai_tri') && festivalLine(state, content) && <p class="profile-note">{festivalLine(state, content)}</p>}
        {tiles.length === 0 && <p class="profile-note">Năm nay chưa có việc gì để làm ở đây.</p>}
        {open ? (
          <>
            {tiles.length > 1 && <button class="link-btn back-link" onClick={() => setOpen(null)}>‹ Các nhóm việc</button>}
            <ActivityList state={state} content={content} groups={[open]} onAction={onAction} headings={false} />
          </>
        ) : (
          <div class="group-grid">
            {tiles.map((g) => {
              const ready = views.filter((v) => v.group === g && !v.blocked).length;
              return (
                <button class="group-tile" key={g} onClick={() => setOpen(g)}>
                  <span class="glyph" aria-hidden="true">{ACTIVITY_GROUP_GLYPHS[g]}</span>
                  <span class="group-name">{ACTIVITY_GROUP_NAMES[g]}</span>
                  <span class="muted">{ready > 0 ? `${ready} việc làm được` : 'chưa làm được'}</span>
                </button>
              );
            })}
          </div>
        )}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
