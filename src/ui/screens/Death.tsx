// End-of-life summary: how the character died, a short epitaph and final numbers.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { lifeSummary } from '../../systems/time';
import { Meter } from '../components/Meter';

const STAT_LABELS = [
  ['happiness', 'Hạnh phúc', '樂'],
  ['health', 'Sức khỏe', '體'],
  ['intellect', 'Trí tuệ', '智'],
  ['charm', 'Mị lực', '貌'],
] as const;

export function DeathScreen({ state, content, onReadLog, onNewLife }: {
  state: GameState;
  content: Content;
  onReadLog: () => void;
  onNewLife: () => void;
}) {
  const s = lifeSummary(state, content);
  if (!s) return null;
  const c = state.character;
  return (
    <main class="death-screen">
      <div class="tablet">
        <div class="seal-mark" aria-hidden="true">終</div>
        <div class="kicker">Một kiếp khép lại</div>
        <h1>{c.name}</h1>
        <p class="cause">{s.causeText}</p>
        <p class="epitaph">“{s.epitaph}”</p>

        <dl class="facts">
          <div><dt>Thiện ác</dt><dd>{s.karmaLabel}</dd></div>
          <div><dt>Gia tài</dt><dd>{state.money.silver} lượng bạc</dd></div>
          <div><dt>Biến cố đã trải</dt><dd>{s.eventsLived}</dd></div>
          <div><dt>Người thân còn sống</dt><dd>{s.relativesAlive}</dd></div>
        </dl>

        <div class="profile-grid">
          {STAT_LABELS.map(([key, label, glyph]) => (
            <div class="stat-row" key={key}><span class="icon">{glyph}</span><Meter label={label} value={state.stats[key]} tone="auto" /></div>
          ))}
        </div>

        {s.traits.length > 0 && (
          <ul class="trait-chips" aria-label="Tiên thiên khí vận">
            {s.traits.map((id) => {
              const t = content.traits.find((x) => x.id === id);
              return t && <li class={`trait-chip r-${t.rarity}`} key={id}><b>{t.name}</b><span>{t.summary}</span></li>;
            })}
          </ul>
        )}

        <div class="death-actions">
          <button class="btn-secondary" onClick={onReadLog}>Xem lại nhật ký</button>
          <button class="btn-primary" onClick={onNewLife}>Đầu thai kiếp mới</button>
        </div>
      </div>
    </main>
  );
}
