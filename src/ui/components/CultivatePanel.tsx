// "Bản thân" and "Tu luyện" sheets (9.7 split one sheet in two): realm, root, yearly progress, breakthrough; võ đạo, đường đời, bách nghệ.
import { Fold } from './Fold';
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { identityLine } from '../../systems/dock';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { bodyLabel, inBottleneck, majorBreakthroughInfo, realmLabel, rootLabel, rootUsable, yearlyGain } from '../../systems/cultivation';
import { daoView } from '../../systems/daoGate';
import { craftViews } from '../../systems/crafts';
import { careerIncome, careerLabel, careerViews } from '../../systems/career';
import { jobLine, jobViews } from '../../systems/jobs';
import { currentTechnique, learnBlocked, techniqueById, techniqueSummary } from '../../systems/technique';
import { martialView, mortalManual } from '../../systems/martial';
import { questView } from '../../systems/martialQuest';
import type { QuestAction } from './MiniGamePopup';
import { pathsView } from '../../systems/paths';
import { rankingBoard } from '../../systems/rankings';
import { seclusionView } from '../../systems/seclusion';
import { caveView } from '../../systems/cave';
import { activeFormation, formationViews } from '../../systems/formation';
import type { BeastAction, FieldAction, FormationAction } from './FormationPopup';
import { fieldView, harvestChance } from '../../systems/spiritField';
import { beastBlocked, beastView, captureChance } from '../../systems/spiritBeast';
import { currentTier, tierName } from '../../systems/realmGrade';
import { recipeViews } from '../../systems/crafting';
import { Meter } from './Meter';
import { TermText } from './Tooltip';

export function CultivatePanel({ state, content, view, extra, onBreakthrough, onPractice, onJoinCareer, onTakeJob, onLearn, onTrain, onQuest, onSeclude, onRentCave, onCraft, onFormation, onBeast, onField, onClose }: {
  state: GameState;
  content: Content;
  /** 9.7: "self" is the Bản thân sheet (võ đạo, đường đời, bách nghệ), "cultivate" the Tu luyện one. */
  view: 'self' | 'cultivate';
  /** Rows shown under the sheet (the activities of its groups). */
  extra?: ComponentChildren;
  /** Returns the outcome to show in the sheet. */
  onBreakthrough: () => { text: string; tone: Tone; changes: string } | null;
  /** Practise a craft this year; returns the log text, or null. */
  onPractice: (craftId: string) => string | null;
  /** Take up a mortal career; returns the log text, or null. */
  onJoinCareer: (careerId: string) => string | null;
  /** 10.3: take a job; returns the log text, or null. */
  onTakeJob: (jobId: string) => string | null;
  /** Practise a technique from a scroll; returns the log text, or null. */
  onLearn: (techniqueId: string) => string | null;
  /** A year of martial training (task 3.11); returns the log text, or null. */
  onTrain: () => string | null;
  /** Backlog 7: do this year's step of the martial quest; returns the log text for a check, or null. */
  onQuest: (a: QuestAction) => string | null;
  /** Task 4.7: make one batch of a recipe; returns the log text, or null. */
  onCraft: (recipeId: string) => string | null;
  /** 13.7b: lay a trận (opens the trận kỳ game). */
  onFormation?: (a: FormationAction) => string | null;
  /** 13.7c: hatch, capture, feed or release the linh thú. */
  onBeast?: (a: BeastAction) => string | null;
  /** 13.7d: sow in the linh điền. */
  onField?: (a: FieldAction) => string | null;
  /** Task 4.1: bế quan; the sheet closes so the log shows the years. */
  onSeclude: (years: number) => void;
  /** 6b.14: rent a cave on a spirit vein for this many years; returns the log line. */
  onRentCave: (years: number) => string | null;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const { cult } = state;
  const mortal = cult.realm === 'pham_nhan';
  const gain = yearlyGain(state, content);
  const info = majorBreakthroughInfo(state, content);
  const crafts = craftViews(state, content);
  const formations = formationViews(state, content);
  const laid = activeFormation(state, content);
  const pet = beastView(state, content);
  const field = fieldView(state, content);
  const [practiced, setPracticed] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  const [careerOpen, setCareerOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [hired, setHired] = useState<string | null>(null);
  const jobs = mortal ? jobViews(state, content) : [];
  const currentJob = jobLine(state, content);
  const careers = mortal ? careerViews(state, content) : [];
  const currentCareer = careerLabel(state, content);
  const paths = mortal ? null : pathsView(state, content);
  const board = rankingBoard(state, content);
  const seclusion = seclusionView(state, content);
  const cave = caveView(state, content);
  const [caveNote, setCaveNote] = useState<string | null>(null);
  const foundation = content.cultivation.realms.foundations.find((g) => g.id === cult.foundation);
  const coreGrade = cult.coreGrade !== null ? content.cultivation.realms.coreGradeNames[cult.coreGrade - 1] : null;
  const tier = currentTier(state, content);
  const grade = tier !== null ? `${tierName(content, cult.realm, tier)} (${content.cultivation.realms.realmGrades?.tiers[tier - 1]})` : null;
  const pattern = content.corePatterns.find((p) => p.id === cult.corePattern);
  const soul = content.nascentSouls.forms.find((f) => f.id === cult.soulForm);
  const self = view === 'self';
  const identity = identityLine(state, content);

  return (
    <div class="modal-backdrop sheet" role="dialog" aria-modal="true" aria-label={self ? 'Bản thân' : 'Tu luyện'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">{self ? 'Bản thân' : 'Tu luyện'}</div>
        <h2>{self ? state.character.name : realmLabel(state, content)}</h2>
        {self && identity && <p class="profile-note">Thân phận: {identity}</p>}
        {daoView(state).root && <p class="profile-root"><TermText text={`Linh căn: ${rootLabel(state, content)}`} /></p>}
        {daoView(state).root && <p class="profile-root"><TermText text={`Thể chất: ${bodyLabel(state, content)}`} /></p>}
        {!self && currentTechnique(state, content) && (
          <div class="technique">
            <p class="story"><b>Công pháp: {currentTechnique(state, content)!.name}</b></p>
            <p class="profile-note">{techniqueSummary(state, content)}</p>
            <p class="profile-note"><TermText text={currentTechnique(state, content)!.flavor} /></p>
            {currentTechnique(state, content)!.note && <p class="profile-note">{currentTechnique(state, content)!.note}</p>}
          </div>
        )}
        {(!self || mortal) && state.cult.scrolls.length > 0 && state.alive && (
          <Fold id="cult:Bí tịch" title="Bí tịch">
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
          </Fold>
        )}
        {!self && foundation && <p class="profile-note"><TermText text={`Đạo cơ ${foundation.name}: ${foundation.description}`} /></p>}
        {!self && grade && <p class="profile-note">Phẩm cấp: <b>{grade}</b></p>}
        {!self && coreGrade && <p class="profile-note"><TermText text={`Kim Đan ${coreGrade}${pattern ? `, ${pattern.name}: ${pattern.summary}` : ''}`} /></p>}
        {!self && soul && <p class="profile-note"><TermText text={`Nguyên Anh: ${soul.name}. ${soul.summary}`} /></p>}
        {self && !mortal ? null : mortal ? !cult.root ? null : (
          <p class="story">
            <TermText text={rootUsable(state, content) ? 'Có linh căn nhưng chưa nhập đạo: cần một công pháp nhập môn, tông môn hoặc tiên sư dẫn đường.' : 'Không có linh căn, linh khí không đọng lại trong người. Đường tu tiên tạm thời khép cửa.'} />
          </p>
        ) : (
          <>
            <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" term="tu_vi" value={cult.progress} color="var(--bar-cult)" text={`${Math.floor(cult.progress)}%`} /></div>
            <p class="profile-note">Mỗi năm tăng khoảng {gain.toFixed(1)}% thanh tu vi.{inBottleneck(state, content) ? ' Đang gặp bình cảnh.' : ''}</p>
          </>
        )}

        {!self && seclusion.options.length > 0 && (
          <Fold id="cult:seclusion" title={<TermText text="Bế quan" />}>
              <p class="profile-note">Tu vi ×{content.balance.seclusion.speedMul}, không có sự kiện. Năm tháng vẫn trôi, người thân vẫn già.</p>
              <div class="action-chips">
                {seclusion.options.map((y) => (
                  <button class="chip-btn" key={y} disabled={!!seclusion.blocked} title={seclusion.blocked ?? undefined}
                    onClick={() => { onSeclude(y); onClose(); }}>
                    {y} năm
                  </button>
                ))}
              </div>
              {seclusion.blocked && <span class="craft-note">{seclusion.blocked}</span>}
          </Fold>
        )}

        {!self && cave.blocked !== 'Chưa tu hành.' && cave.blocked !== 'Đã qua đời.' && (
          <Fold id="cult:Động phủ linh mạch" title="Động phủ linh mạch">
              <p class="profile-note">Thuê chỗ ngồi trên linh mạch: tu vi ×{cave.speedMul} suốt thời hạn thuê, cộng dồn với bế quan.{cave.until !== null ? ` Đang thuê tới năm ${cave.until} tuổi.` : ''}</p>
              <div class="action-chips">
                {cave.leases.map((l) => (
                  <button class="chip-btn" key={l.years} disabled={!!l.blocked} title={l.blocked ?? undefined}
                    onClick={() => setCaveNote(onRentCave(l.years))}>
                    {l.years} năm · {l.cost} linh thạch
                  </button>
                ))}
              </div>
              {caveNote && <p class="action-result good">{caveNote}</p>}
              {!caveNote && cave.leases.every((l) => l.blocked) && cave.until === null && <span class="craft-note">{cave.leases[0]?.blocked}</span>}
          </Fold>
        )}

        {!self && info && state.alive && (
          <div class="breakthrough">
            <p class="story"><TermText text={`Đột phá ${info.target.name}: tỉ lệ thành công khoảng ${Math.round(info.chancePct)}%.`} /></p>
            {info.heartDemon && <p class="profile-note warn-note">Lòng còn vướng bận: trước khi đột phá phải qua tâm ma.</p>}
            {info.tribulation && (
              <p class="profile-note">
                Thành công thì phải qua thiên kiếp: {info.tribulation.strikes} đạo lôi, tổng cộng khoảng {info.tribulation.damage} sức khỏe
                (đã giảm {info.tribulation.reducePct}% nhờ giáp, pháp bảo, căn cốt). Sức khỏe hiện có: {state.stats.health}.
              </p>
            )}
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
        {self && mortal && state.alive && (() => {
          const m = martialView(state, content);
          return (
            <Fold id="cult:Võ đạo" title="Võ đạo">
                <p class="story">{m.stage ? `Cảnh giới võ đạo: ${m.stage}` : 'Chưa nhập môn võ đạo.'}</p>
                {(() => {
                  const manual = mortalManual(state, content);
                  return manual && <p class="profile-note"><b>{manual.name}</b>: {manual.flavor} (sức chiến +{Math.round(manual.power * 100)}%, thọ nguyên +{manual.lifespan} năm).</p>;
                })()}
                {m.next && <p class="profile-note">Đã luyện {m.years} năm. Năm nay luyện võ có khoảng {Math.round(m.yearChance * 100)}% đột phá lên {m.next}; tỉ lệ tăng dần tới năm thứ {m.need} (cao nhất {Math.round(m.chance * 100)}%, theo Căn cốt và Ngộ tính).</p>}
                {m.gate && <p class="profile-note">{m.gate}</p>}
                <button class="chip-btn" disabled={!!m.blocked} onClick={() => setPracticed(onTrain())}>Luyện võ</button>
                {m.blocked && <span class="craft-note">{m.blocked}</span>}
                {(() => {
                  const q = questView(state, content);
                  if (!q) return null;
                  return (
                    <div class="quest">
                      <h3 class="panel-sub">{q.quest.name} · ải {q.stepIndex + 1}/{q.total}</h3>
                      <p class="story"><b>{q.step.title}.</b> {q.step.text}</p>
                      {q.chance !== null && <p class="profile-note">Thử sức: khoảng {Math.round(q.chance * 100)}% qua ải (theo {q.step.check!.stats.map((k) => ({ physique: 'Căn cốt', health: 'Sức khỏe', daoHeart: 'Đạo tâm', comprehension: 'Ngộ tính', intellect: 'Trí tuệ', charm: 'Mị lực', luck: 'Khí vận', happiness: 'Vui vẻ' }[k])).join(', ')}).</p>}
                      <button class="chip-btn" disabled={!!q.blocked} onClick={() => setPracticed(onQuest({ kind: 'step', aid: false }))}>{q.step.game ? 'Vào ải' : 'Thử sức'}</button>
                      {q.aid && <button class="chip-btn" disabled={!!q.blocked || !q.aid.have} title={q.aid.text} onClick={() => setPracticed(onQuest({ kind: 'step', aid: true }))}>{`${q.aid.text} (${q.aid.name}${q.aid.have ? '' : ', chưa có'})`}</button>}
                      {q.blocked && <span class="craft-note">{q.blocked}</span>}
                    </div>
                  );
                })()}
            </Fold>
          );
        })()}

        {self && mortal && state.alive && (
          <Fold id="cult:Đường đời" title="Đường đời">
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
          </Fold>
        )}

        {self && mortal && state.alive && jobs.length > 0 && (
          <Fold id="cult:Việc làm" title="Việc làm">
              {currentJob ? (
                <p class="story">{currentJob}. Làm chăm, nịnh chủ hay ăn bớt ở mục Nghề bên dưới.</p>
              ) : (
                <p class="profile-note">Chưa có việc. Có việc thì có lương hằng năm; hiệu suất cao được lên bậc, thấp thì bị đuổi.</p>
              )}
              <button class="chip-btn" aria-expanded={jobOpen} onClick={() => setJobOpen(!jobOpen)}>{currentJob ? 'Đổi việc' : 'Tìm việc'}</button>
              {jobOpen && (content.jobs?.groups ?? []).map((g) => {
                const rows = jobs.filter((j) => j.group === g.id && !j.current);
                if (rows.length === 0) return null;
                return (
                  <div key={g.id}>
                    <h3 class="panel-sub">{g.glyph} {g.name}</h3>
                    {rows.map((j) => (
                      <div class="career-row" key={j.id}>
                        <div class="craft-head"><b>{j.name}</b> · {j.pay} lượng/năm · {j.months} tháng</div>
                        <p class="profile-note">{j.description}</p>
                        <button class="chip-btn" disabled={!!j.blocked} onClick={() => { setHired(onTakeJob(j.id)); setJobOpen(false); }}>Xin làm</button>
                        {j.blocked && <span class="craft-note">{j.blocked}</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
              {hired && <p class="action-result good">{hired}</p>}
          </Fold>
        )}

        {!self && paths && (
          <Fold id="cult:Đạo thống · con đường" title="Đạo thống · con đường">
              {paths.lineage && (
                <p class="profile-note"><b>{paths.lineage.name}</b>: {paths.lineage.strengths} Cái giá: {paths.lineage.costs}</p>
              )}
              <p class="profile-note">Con đường chính: {paths.main}</p>
              {paths.paths.map((p) => (
                <div class="craft-row" key={p.id}>
                  <div class="craft-head">
                    <b><TermText text={p.name} /></b>
                    {p.main && <span class="muted">chính</span>}
                  </div>
                  <Meter label={`${p.value}`} value={p.value} color="var(--bar-cult)" text="" />
                </div>
              ))}
          </Fold>
        )}

        {self && crafts.length > 0 && (
          <Fold id="cult:crafts" title={<TermText text="Bách nghệ" />}>
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
                  {c.id === 'farming' && onField && field && (
                    <details class="recipes">
                      <summary>Linh điền · {field.growing.length}/{field.plots} ô · gặt thành {Math.round(harvestChance(state, content) * 100)}%</summary>
                      {field.news && <p class="craft-note">{field.news}</p>}
                      {field.growing.map((g, i) => (
                        <p class="craft-note" key={i}>{g.herb}: chín năm {g.ready} tuổi{g.fit === 'wrong' ? ' (trồng trái tiết)' : g.fit === 'right' ? ' (hợp tiết)' : ''}</p>
                      ))}
                      {field.herbs.map((h) => (
                        <div class="recipe" key={h.id}>
                          <button class="chip-btn" disabled={!!h.blocked} title={h.blocked ?? undefined} onClick={() => setPracticed(onField({ kind: 'sow', id: h.id }))}>
                            Gieo {h.name} · {h.seedCost} linh thạch · {h.years} năm
                          </button>
                          <span class="craft-note">{h.text}{h.blocked && ` · ${h.blocked}`}</span>
                        </div>
                      ))}
                    </details>
                  )}
                  {c.id === 'beast' && onBeast && state.cult.realm !== 'pham_nhan' && (
                    <details class="recipes">
                      <summary>Linh thú{pet && ` · ${pet.name} (${pet.species}, ${pet.stage})`}</summary>
                      {pet ? (
                        <>
                          <p class="craft-note">{pet.text} Đã theo ngươi {pet.years} năm.</p>
                          <Meter label={pet.stage} value={pet.growth} color="var(--bar-cult)" text="" />
                          {pet.feeds.filter((f) => f.have > 0).map((f) => (
                            <button class="chip-btn" key={f.item} onClick={() => setPracticed(onBeast({ kind: 'feed', item: f.item }))}>Cho ăn {f.name} ({f.have})</button>
                          ))}
                          <button class="chip-btn" onClick={() => setPracticed(onBeast({ kind: 'release' }))}>Thả về rừng</button>
                        </>
                      ) : (
                        <>
                          <button class="chip-btn" disabled={!!beastBlocked(state, content, 'hatch')} title={beastBlocked(state, content, 'hatch') ?? undefined} onClick={() => setPracticed(onBeast({ kind: 'hatch' }))}>Ấp trứng linh thú</button>
                          <button class="chip-btn" disabled={!!beastBlocked(state, content, 'capture')} title={beastBlocked(state, content, 'capture') ?? undefined} onClick={() => setPracticed(onBeast({ kind: 'capture' }))}>
                            Thu phục linh thú · {Math.round(captureChance(state, content) * 100)}%
                          </button>
                          {beastBlocked(state, content, 'capture') && <span class="craft-note">{beastBlocked(state, content, 'capture')}</span>}
                        </>
                      )}
                    </details>
                  )}
                  {c.id === 'formation' && onFormation && formations.length > 0 && (
                    <details class="recipes">
                      <summary>Bày trận{laid && ` · ${laid.name} tới ${laid.until} tuổi`}</summary>
                      {formations.map((f) => (
                        <div class="recipe" key={f.id}>
                          <button class="chip-btn" disabled={!!f.blocked} title={f.blocked ?? undefined} onClick={() => setPracticed(onFormation({ kind: 'begin', id: f.id }))}>
                            {f.name} · {f.cost} linh thạch · {f.years} năm
                          </button>
                          <span class="craft-note">{f.text}{f.blocked && ` · ${f.blocked}`}</span>
                        </div>
                      ))}
                    </details>
                  )}
                  {recipeViews(state, content, c.id).length > 0 && (
                    <details class="recipes">
                      <summary>Luyện chế</summary>
                      {recipeViews(state, content, c.id).map((r) => (
                        <div class="recipe" key={r.id}>
                          <button class="chip-btn" disabled={!!r.blocked} title={r.blocked ?? undefined} onClick={() => setPracticed(onCraft(r.id))}>
                            {r.product}{r.count > 1 && ` ×${r.count}`} · {Math.round(r.chance * 100)}%
                          </button>
                          <span class="craft-note">{r.needs}{r.blocked && ` · ${r.blocked}`}</span>
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              ))}
              {practiced && <p class="action-result good">{practiced}</p>}
          </Fold>
        )}

        {board.length > 0 && self === mortal && (
          <Fold id="cult:rankings" title={content.rankings.title}>
              <p class="profile-note">{content.rankings.note}</p>
              <ol class="ranking">
                {board.map((r) => (
                  <li key={r.rank} class={r.player ? 'me' : undefined}>
                    <span class="rank-no">{r.rank}</span>
                    <span class="rank-name">
                      <b>{r.name}</b> · {r.realm}
                      <span class="muted rank-sub">{r.sect} · {r.age} tuổi</span>
                    </span>
                  </li>
                ))}
              </ol>
          </Fold>
        )}

        {extra}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
