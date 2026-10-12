// End-of-life summary: how the character died, a short epitaph and final numbers.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { lifeSummary } from '../../systems/time';
import { careerLabel, lifeTitles } from '../../systems/career';
import { Meter } from '../components/Meter';

const STAT_LABELS = [
  ['happiness', 'Hạnh phúc', '樂'],
  ['health', 'Sức khỏe', '體'],
  ['intellect', 'Trí tuệ', '智'],
  ['charm', 'Mị lực', '貌'],
] as const;

export function DeathScreen({ state, content, onReadLog, onNewLife, onGhost }: {
  state: GameState;
  content: Content;
  onReadLog: () => void;
  onNewLife: () => void;
  /** Task 4.12: go on as a quỷ tu (only when the death left a lingering obsession). */
  onGhost: () => void;
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
        {lifeTitles(state, content).map((t) => <p class="life-title" key={t}>{t}</p>)}

        <dl class="facts">
          <div><dt>Thiện ác</dt><dd>{s.karmaLabel}</dd></div>
          {careerLabel(state, content) && <div><dt>Đường đời</dt><dd>{careerLabel(state, content)}</dd></div>}
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

        {state.death?.ghostOffer && (
          <div class="ghost-offer">
            <p class="story">{content.lifeTexts.ghostOffer}</p>
            <button class="btn-primary" onClick={onGhost}>Hóa quỷ tu, tu tiếp bằng Quỷ đạo</button>
          </div>
        )}

        <div class="death-actions">
          <button class="btn-secondary" onClick={onReadLog}>Xem lại nhật ký</button>
          <button class="btn-primary" onClick={onNewLife}>Đầu thai kiếp mới</button>
        </div>
      </div>
    </main>
  );
}
