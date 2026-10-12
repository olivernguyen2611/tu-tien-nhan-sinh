// "Tu luyện" sheet: realm, root, yearly progress, and the big breakthrough button.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { inBottleneck, majorBreakthroughInfo, realmLabel, rootLabel, yearlyGain } from '../../systems/cultivation';
import { craftViews } from '../../systems/crafts';
import { careerIncome, careerLabel, careerViews } from '../../systems/career';
import { currentTechnique, learnBlocked, techniqueById, techniqueSummary } from '../../systems/technique';
import { martialView } from '../../systems/martial';
import { Meter } from './Meter';
import { TermText } from './Tooltip';

export function CultivatePanel({ state, content, onBreakthrough, onPractice, onJoinCareer, onLearn, onTrain, onClose }: {
  state: GameState;
  content: Content;
  /** Returns the outcome to show in the sheet. */
  onBreakthrough: () => { text: string; tone: Tone; changes: string } | null;
  /** Practise a craft this year; returns the log text, or null. */
  onPractice: (craftId: string) => string | null;
  /** Take up a mortal career; returns the log text, or null. */
  onJoinCareer: (careerId: string) => string | null;
  /** Practise a technique from a scroll; returns the log text, or null. */
  onLearn: (techniqueId: string) => string | null;
  /** A year of martial training (task 3.11); returns the log text, or null. */
  onTrain: () => string | null;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const { cult } = state;
  const mortal = cult.realm === 'pham_nhan';
  const gain = yearlyGain(state, content);
  const info = majorBreakthroughInfo(state, content);
  const crafts = craftViews(state, content);
  const [practiced, setPracticed] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  const [careerOpen, setCareerOpen] = useState(false);
  const careers = mortal ? careerViews(state, content) : [];
  const currentCareer = careerLabel(state, content);
  const foundation = content.cultivation.realms.foundations.find((g) => g.id === cult.foundation);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tu luyện" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Tu luyện</div>
        <h2>{realmLabel(state, content)}</h2>
        <p class="profile-root"><TermText text={`Linh căn: ${rootLabel(state, content)}`} /></p>
        {currentTechnique(state, content) && (
          <div class="technique">
            <p class="story"><b>Công pháp: {currentTechnique(state, content)!.name}</b></p>
            <p class="profile-note">{techniqueSummary(state, content)}</p>
            <p class="profile-note"><TermText text={currentTechnique(state, content)!.flavor} /></p>
            {currentTechnique(state, content)!.note && <p class="profile-note">{currentTechnique(state, content)!.note}</p>}
          </div>
        )}
        {state.cult.scrolls.length > 0 && state.alive && (
          <div class="crafts">
            <h3 class="panel-sub">Bí tịch</h3>
            {state.cult.scrolls.map((id) => {
              const tech = techniqueById(content, id);
              if (!tech) return null;
              const blocked = learnBlocked(state, content, tech);
              return (
                <div class="career-row" key={id}>
                  <div class="craft-head"><b>{tech.name}</b><span class="muted">{content.cultivation.realms.gradeNames[tech.grade]} phẩm · {content.cultivation.realms.lineageNames[tech.lineage]}</span></div>
                  <p class="profile-note"><TermText text={tech.flavor} /></p>
                  <button class="chip-btn" disabled={!!blocked} onClick={() => setPracticed(onLearn(id))}>Tu công pháp này</button>
                  {blocked ? <span class="craft-note">{blocked}</span>
                    : state.cult.technique && <span class="craft-note">Đổi công pháp mất {content.balance.techniques.switchLossPct}% thanh tu vi.</span>}
                </div>
              );
            })}
          </div>
        )}
        {foundation && <p class="profile-note"><TermText text={`Đạo cơ ${foundation.name}: ${foundation.description}`} /></p>}
        {mortal ? (
          <p class="story">
            <TermText text={cult.root ? 'Không có linh căn, linh khí không đọng lại trong người. Đường tu tiên tạm thời khép cửa.' : 'Chưa thử linh căn. Có khi một ngày tiên sư sẽ ghé qua quê nhà.'} />
          </p>
        ) : (
          <>
            <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" term="tu_vi" value={cult.progress} color="var(--bar-cult)" text={`${Math.floor(cult.progress)}%`} /></div>
            <p class="profile-note">Mỗi năm tăng khoảng {gain.toFixed(1)}% thanh tu vi.{inBottleneck(state, content) ? ' Đang gặp bình cảnh.' : ''}</p>
          </>
        )}

        {info && state.alive && (
          <div class="breakthrough">
            <p class="story"><TermText text={`Đột phá ${info.target.name}: tỉ lệ thành công khoảng ${Math.round(info.chancePct)}%.`} /></p>
            {info.blocked ? (
              <p class="profile-note">{info.blocked}</p>
            ) : confirming ? (
              <>
                <p class="profile-note">Thất bại có thể mất tu vi, tổn thương kinh mạch, giảm thọ, tẩu hỏa nhập ma, hiếm khi mất mạng.</p>
                <button class="choice" onClick={() => { setConfirming(false); setResult(onBreakthrough()); }}>Quyết, đột phá!</button>
                <button class="choice" onClick={() => setConfirming(false)}>Thôi, tích thêm đã</button>
              </>
            ) : (
              <button class="btn-primary" onClick={() => setConfirming(true)}>Đột phá {info.target.name}</button>
            )}
          </div>
        )}

        {result && (
          <p class={`action-result ${result.tone}`}>
            <TermText text={result.text} />
            {result.changes && <span class="changes">{result.changes}</span>}
          </p>
        )}
        {mortal && state.alive && (() => {
          const m = martialView(state, content);
          return (
            <div class="crafts">
              <h3 class="panel-sub">Võ đạo</h3>
              <p class="story">{m.stage ? `Cảnh giới võ đạo: ${m.stage}` : 'Chưa nhập môn võ đạo.'}</p>
              {m.next && <p class="profile-note">Luyện thêm {Math.max(0, m.need - m.years)} năm để thử lên {m.next} (tỉ lệ khoảng {Math.round(m.chance * 100)}%).</p>}
              {m.gate && <p class="profile-note">{m.gate}</p>}
              <button class="chip-btn" disabled={!!m.blocked} onClick={() => setPracticed(onTrain())}>Luyện võ</button>
              {m.blocked && <span class="craft-note">{m.blocked}</span>}
            </div>
          );
        })()}

        {mortal && state.alive && (
          <div class="crafts">
            <h3 class="panel-sub">Đường đời</h3>
            {currentCareer ? (
              <p class="story">{currentCareer} · thu nhập {careerIncome(state, content)} lượng bạc mỗi năm.</p>
            ) : (
              <p class="profile-note">Chưa theo đường nào. Từ {content.balance.careers.joinAge[0]} tuổi có thể chọn một đường để kiếm sống và tiến thân.</p>
            )}
            <button class="chip-btn" aria-expanded={careerOpen} onClick={() => setCareerOpen(!careerOpen)}>{currentCareer ? 'Đổi đường' : 'Chọn đường'}</button>
            {careerOpen && careers.filter((c) => !c.current).map((c) => (
              <div class="career-row" key={c.id}>
                <div class="craft-head"><b>{c.name}</b></div>
                <p class="profile-note"><TermText text={c.description} /></p>
                <button class="chip-btn" disabled={!!c.blocked} onClick={() => { setJoined(onJoinCareer(c.id)); setCareerOpen(false); }}>Theo đường này</button>
                {c.blocked && <span class="craft-note">{c.blocked}</span>}
              </div>
            ))}
            {joined && <p class="action-result good">{joined}</p>}
          </div>
        )}

        {crafts.length > 0 && (
          <div class="crafts">
            <h3 class="panel-sub"><TermText text="Bách nghệ" /></h3>
            <p class="profile-note">Mỗi năm chuyên tâm được một nghề.</p>
            {crafts.map((c) => (
              <div class="craft-row" key={c.id}>
                <div class="craft-head">
                  <b><TermText text={c.name} /></b>
                  <span class="muted">{c.title}</span>
                </div>
                <Meter label={`Cấp ${c.level}`} value={c.level} color="var(--bar-cult)" text="" />
                <button class="chip-btn" disabled={!!c.blocked} title={c.blocked ?? undefined}
                  onClick={() => setPracticed(onPractice(c.id))}>
                  Luyện tập{c.cost > 0 && <span class="chip-cost"> · {c.cost} bạc</span>}
                </button>
                {c.blocked && <span class="craft-note">{c.blocked}</span>}
              </div>
            ))}
            {practiced && <p class="action-result good">{practiced}</p>}
          </div>
        )}

        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
