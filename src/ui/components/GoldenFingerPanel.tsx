// Kim Thủ Chỉ panel (playtest 2): the finger, its levels, and what the player can do with it this year.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { fingerAwake, fingerDef } from '../../systems/goldenFinger';
import { fingerActionViews } from '../../systems/fingerActions';
import { TermText } from './Tooltip';

export function GoldenFingerPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  onAction: (actionId: string) => { text: string; tone: Tone; changes: string } | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const g = state.goldenFinger;
  const f = fingerDef(content, g?.id);
  if (!g || !f) return null;
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id;
  const tier = content.goldenFingers.rarityNames?.[f.rarity];
  const asleep = g.level === 0 && !fingerAwake(state, content, f);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Kim Thủ Chỉ" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Kim Thủ Chỉ{tier ? ` · ${tier}` : ''}</div>
        <h2>{f.name}</h2>
        <p class="story"><TermText text={f.flavor} /></p>
        {asleep && <p class="profile-note risk" role="status">Còn đang ngủ say: {f.activation.kind === 'age' ? `tỉnh lúc ${f.activation.age} tuổi` : `tỉnh khi tới ${realmName(f.activation.realm ?? '')}`}.</p>}
        <p class="profile-note"><TermText text={f.summary} /></p>
        {f.signature && <p class="profile-note"><b>Cơ chế:</b> <TermText text={f.signature} /></p>}
        <p class="profile-note"><b>Rủi ro:</b> <TermText text={f.drawback ? `${f.risk} ${f.drawback.text}` : f.risk} /></p>

        <h3 class="panel-sub">Các tầng thức tỉnh</h3>
        <ul class="finger-levels">
          {f.levels.map((l, i) => (
            <li key={l.name} class={i < g.level ? 'awake' : 'asleep'}>
              <b>{i < g.level ? '✓' : '○'} {l.name}</b>
              <span class="muted"> · {i < g.level ? l.text : `thức tỉnh khi tới ${realmName(l.realm)}`}</span>
            </li>
          ))}
        </ul>

        <h3 class="panel-sub">Dùng năm nay</h3>
        {result && (
          <p class={`action-result ${result.tone}`} role="status">
            {result.text}
            {result.changes && <span class="changes">{result.changes}</span>}
          </p>
        )}
        {fingerActionViews(state, content).map((a) => (
          <div class="career-row" key={a.id}>
            <div class="craft-head"><b>{a.name}</b>{a.chance !== null && <span class="muted">{Math.round(a.chance * 100)}%</span>}</div>
            <p class="profile-note">{a.text}{(g.count?.[a.id] ?? 0) > 0 && <span class="muted"> · đã dùng {g.count?.[a.id]} lần</span>}</p>
            <button class="chip-btn" disabled={!!a.blocked} onClick={() => { const r = onAction(a.id); if (r) setResult(r); }}>Dùng</button>
            {a.blocked && <span class="craft-note">{a.blocked}</span>}
          </div>
        ))}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
