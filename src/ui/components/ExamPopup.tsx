// 10.2 Trường thi: one round at a time (or the incident of that round). The year waits for it.
// All rules are in systems/exams.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { examView } from '../../systems/exams';

export type ExamAction = { kind: 'answer'; approach: string } | { kind: 'incident'; index: number };

export function ExamPopup({ state, content, onAction }: {
  state: GameState;
  content: Content;
  onAction: (a: ExamAction) => void;
}) {
  const view = examView(state, content);
  if (!view) return null;
  const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={view.level.name}>
      <div class="event-card">
        <div class="kicker">{view.level.name} · vòng {Math.min(view.round + 1, view.total)}/{view.total}</div>
        <h2>{view.incident ? view.incident.title : 'Trường thi'}</h2>
        {view.lines.length > 0 && (
          <ul class="exam-lines">
            {view.lines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        )}
        <p class="profile-note">Điểm {view.score} / cần {view.passScore} để đỗ.</p>
        {view.incident ? (
          <>
            <p class="story">{view.incident.text}</p>
            {view.incident.choices.map((c, i) => (
              <button class="choice" key={i} onClick={() => onAction({ kind: 'incident', index: i })}>{c.text}</button>
            ))}
          </>
        ) : (
          <>
            <p class="story">{view.prompt}</p>
            {view.approaches.map((a) => (
              <button class="choice" key={a.id} onClick={() => onAction({ kind: 'answer', approach: a.id })}>
                <b>{a.name}</b> · {a.pct}% · đạt {sign(a.win)}, hỏng {sign(a.lose)}
                <span class="hint">{a.hint}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
