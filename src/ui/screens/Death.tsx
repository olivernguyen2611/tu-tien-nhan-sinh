// End-of-life summary: how the character died, a short epitaph and final numbers.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { lifeSummary } from '../../systems/time';
import { lifeTitles } from '../../systems/career';
import { heirOptions } from '../../systems/heir';
import { lifeHighlights, lifeRecap, rebirthPoints } from '../../systems/rebirth';
import { earnedBlessings } from '../../systems/blessings';
import { rewindOffer } from '../../systems/rewind';
import { lifeBadges } from '../../systems/achievements';
import { challengeDef, challengeResult } from '../../systems/challenge';
import { realmLabel } from '../../systems/cultivation';
import { shareObituary } from '../obituary';
import { Meter } from '../components/Meter';

const STAT_LABELS = [
  ['happiness', 'Hạnh phúc', '樂'],
  ['health', 'Sức khỏe', '體'],
  ['intellect', 'Trí tuệ', '智'],
  ['charm', 'Mị lực', '貌'],
] as const;

export function DeathScreen({ state, content, rebirth, lives, onReadLog, onNewLife, onGhost, onHeir, onRewind, onRebirth }: {
  state: GameState;
  content: Content;
  /** Task 5b.1: Luân Hồi points paid now for this life, and the total kept across lives. */
  rebirth: { gained: number; bank: number; fresh: string[] };
  /** Lives begun on this browser (thành tựu, the obituary card). */
  lives: number;
  onReadLog: () => void;
  onNewLife: () => void;
  /** Task 4.12: go on as a quỷ tu (only when the death left a lingering obsession). */
  onGhost: () => void;
  /** Task 5.7: go on as a child or disciple. */
  onHeir: (heirId: string) => void;
  /** Task 5b.10: Trùng sinh, back to an earlier moment of this life. */
  onRewind: () => void;
  /** Task 5b.1: open the Luân Hồi đài. */
  onRebirth: () => void;
}) {
  const s = lifeSummary(state, content);
  if (!s) return null;
  const c = state.character;
  const points = rebirthPoints(state, content);
  const rewind = rewindOffer(state, content);
  const highlights = lifeHighlights(state, content.balance.rebirth.highlights, content);
  const badges = lifeBadges(state, content, lives);
  const challenge = challengeDef(content, state.challenge?.id);
  const result = challengeResult(state, content);
  const fresh = rebirth.fresh.map((id) => content.achievements.achievements.find((a) => a.id === id)).filter((a) => !!a);
  const obituary = () => shareObituary({
    title: content.achievements.obituary.title,
    name: c.name,
    cause: s.causeText,
    realm: realmLabel(state, content),
    epitaph: s.epitaph,
    badges: badges.map((b) => ({ name: b.name, text: b.text })),
    footer: content.achievements.obituary.footer.replaceAll('{lives}', String(lives)),
  }, `cao-pho-${state.seed}.png`);
  const blessings = earnedBlessings(state, content).map((b) => content.blessings.blessings.find((x) => x.id === b.id)!);
  return (
    <main class="death-screen">
      <div class="tablet">
        <div class="seal-mark" aria-hidden="true">終</div>
        <div class="kicker">Một kiếp khép lại</div>
        <h1>{c.name}</h1>
        <p class="cause">{s.causeText}</p>
        <p class="epitaph">“{s.epitaph}”</p>
        {lifeTitles(state, content).map((t) => <p class="life-title" key={t}>{t}</p>)}
        {badges.length > 0 && (
          <ul class="badges" aria-label="Huy hiệu cuối đời">
            {badges.map((b) => <li key={b.id} class="badge"><b>{b.name}</b><span>{b.text}</span></li>)}
          </ul>
        )}
        {challenge && result && (
          <div class="ancestry">
            <p class="kicker">Thử thách tuần · {challenge.name}</p>
            <p class={`challenge-result${result.done ? ' done' : ''}`}>{result.done ? 'Đạt' : 'Chưa đạt'}: {challenge.goalText} Điểm: {result.score}.</p>
          </div>
        )}
        {fresh.length > 0 && (
          <div class="ancestry achievements-new">
            <p class="kicker">Thành tựu mới</p>
            <ul>{fresh.map((a) => <li key={a.id}><b>{a.name}</b>: {a.text}{a.unlockFinger && ' Mở khóa một Kim Thủ Chỉ để chọn lúc đầu thai.'}</li>)}</ul>
          </div>
        )}

        <dl class="facts">
          {lifeRecap(state, content).map((l) => <div key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></div>)}
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

        {highlights.length > 0 && (
          <div class="ancestry">
            <p class="kicker">Dấu ấn một đời</p>
            <ol>{highlights.map((h, i) => <li key={i}>{h}</li>)}</ol>
          </div>
        )}

        <div class="rebirth-points">
          <p class="kicker">Điểm Luân Hồi</p>
          <ul>
            {points.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{l.points}</b></li>)}
          </ul>
          <p class="rebirth-total">
            Kiếp này: <b>{points.total}</b>
            {rebirth.gained > 0 && rebirth.gained !== points.total && <> (nhận thêm {rebirth.gained})</>}
            {' · '}Tích lũy: <b>{rebirth.bank}</b>
          </p>
          <button class="link-btn" onClick={onRebirth}>Lên Luân Hồi Đài</button>
        </div>

        {blessings.length > 0 && (
          <div class="ancestry">
            <p class="kicker">Phúc báo cho kiếp sau</p>
            <ul>{blessings.map((b) => <li key={b.id}><b>{b.name}</b>: {b.earned} {b.text}</li>)}</ul>
          </div>
        )}

        {rewind && (
          <div class="ghost-offer">
            <p class="story">{content.lifeTexts.rewindOffer}</p>
            <button class="btn-primary" onClick={onRewind}>
              Trùng sinh về năm {rewind.age} tuổi{rewind.target === 'realm' ? ', lúc mới vào cảnh giới này' : ''}
            </button>
          </div>
        )}

        {state.death?.ghostOffer && (
          <div class="ghost-offer">
            <p class="story">{content.lifeTexts.ghostOffer}</p>
            <button class="btn-primary" onClick={onGhost}>Hóa quỷ tu, tu tiếp bằng Quỷ đạo</button>
          </div>
        )}

        {heirOptions(state, content).length > 0 && (
          <div class="ghost-offer heir-offer">
            <p class="story">{content.heir.offer}</p>
            {heirOptions(state, content).map((h) => (
              <button class="choice" key={h.id} onClick={() => onHeir(h.id)}>
                {h.name}, {h.age} tuổi
                <span class="hint">{h.label}</span>
              </button>
            ))}
          </div>
        )}

        {state.ancestry.length > 0 && (
          <div class="ancestry">
            <p class="kicker">Tộc phả · đời thứ {state.ancestry.length + 1}</p>
            <ol>
              {state.ancestry.map((a, i) => <li key={i}>{a.name}, {a.realm}, mất năm {a.age} tuổi</li>)}
            </ol>
          </div>
        )}

        <div class="death-actions">
          <button class="btn-secondary" onClick={onReadLog}>Xem lại nhật ký</button>
          <button class="btn-secondary" onClick={obituary}>Lưu cáo phó</button>
          <button class="btn-primary" onClick={onNewLife}>Đầu thai kiếp mới</button>
        </div>
      </div>
    </main>
  );
}
