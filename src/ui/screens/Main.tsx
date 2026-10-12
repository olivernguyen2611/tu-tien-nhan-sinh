// Main screen in a BitLife-style layout: who-you-are bar on top, life log in the
// middle, a dock with the big age button, and stat bars underneath.
import type { DiscipleAct } from '../../systems/discipleActs';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import type { SaveMeta } from '../../systems/save';
import type { RewindOption } from '../../systems/timeline';
import { activeExtremes, extremeWarnings } from '../../systems/extremes';
import { DevPanel } from '../components/DevPanel';
import { BagPanel } from '../components/BagPanel';
import { GoldenFingerPanel } from '../components/GoldenFingerPanel';
import { fingerActionViews } from '../../systems/fingerActions';
import { MarketPanel, type MarketAction } from '../components/MarketPanel';
import { MapPanel } from '../components/MapPanel';
import { currentRegion } from '../../systems/regions';
import { CombatPanel } from '../components/CombatPanel';
import type { CombatAction } from '../../core/schemas';
import type { Aftermath } from '../../systems/combat';
import type { RomanceAction } from '../../systems/romance';
import { FamilyPanel } from '../components/FamilyPanel';
import { CultivatePanel } from '../components/CultivatePanel';
import { SectPanel, type SectAction } from '../components/SectPanel';
import { FatePopup } from '../components/FatePopup';
import { CorePopup } from '../components/CorePopup';
import { MiniGamePopup, type QuestAction } from '../components/MiniGamePopup';
import type { BondAction, BondTarget } from '../../systems/familyBond';
import { HeartDemonPopup } from '../components/HeartDemonPopup';
import type { HeartDemonOption } from '../../systems/heartDemon';
import type { ClanAction } from '../components/ClanSection';
import { EventPopup, type PopupResult } from '../components/EventPopup';
import { Meter } from '../components/Meter';
import { Term, TermText } from '../components/Tooltip';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ThemePref } from '../theme';
import { bodyLabel, realmLabel, rootLabel } from '../../systems/cultivation';
import { difficultyName } from '../../systems/difficulty';
import { currentGoal, pendingTip } from '../../systems/tutorial';
import { careerLabel } from '../../systems/career';
import { sectLabel } from '../../systems/sect';
import { inventoryLabel } from '../../systems/items';
import { fingerDef } from '../../systems/goldenFinger';

const DOCK_LEFT = [
  { id: 'cultivate', glyph: '修', label: 'Tu luyện' },
  { id: 'sect', glyph: '宗', label: 'Tông môn' },
];
const DOCK_RIGHT = [
  { id: 'bonds', glyph: '緣', label: 'Quan hệ' },
  { id: 'explore', glyph: '遊', label: 'Khám phá' },
];

const APTITUDE_LABELS = [
  ['physique', 'Căn cốt', '骨', 'can_cot'],
  ['comprehension', 'Ngộ tính', '悟', 'ngo_tinh'],
  ['luck', 'Khí vận', '運', 'khi_van'],
  ['daoHeart', 'Đạo tâm', '心', 'dao_tam'],
] as const;

export function MainScreen({ state, content, saveWarning, onAdvance, onFastForward, onSeclude, onPlaceStrand, onMeetIllusion, onCraft, onDisciple, onClan, onChoose, onFamilyAction, onRomance, onBond, onUseItem, onFingerAction, onMarket, onTravel, onCombat, onSettle, onBreakthrough, onPractice, onJoinCareer, onLearn, onTrain, onQuest, onSectAction, onFate, onTip, onNewLife, onSummary, onSaves, dev, theme, onToggleTheme }: {
  state: GameState;
  content: Content;
  /** Shown when autosave failed. */
  saveWarning: string | null;
  onAdvance: () => void;
  /** Pass several quiet years at once. */
  onFastForward: () => void;
  /** Returns the outcome to show on the card. */
  onChoose: (index: number) => PopupResult;
  /** Task 5.4: gia tộc. */
  onClan: (action: ClanAction) => string | null;
  /** Task 4.9: take a disciple (null) or teach one. */
  onDisciple: (npcId: string | null, act?: DiscipleAct) => { text: string; tone: Tone; changes: string } | null;
  /** Task 4.7: luyện đan / luyện khí; returns the log text, or null. */
  onCraft: (recipeId: string) => string | null;
  /** Task 4.4: meet the current tâm ma illusion. */
  onMeetIllusion: (option: HeartDemonOption) => void;
  /** Task 4.2: place one qi strand while forming the golden core. */
  onPlaceStrand: (element: string) => void;
  /** Task 4.1: bế quan for this many years. */
  onSeclude: (years: number) => void;
  onFamilyAction: (relativeId: string, actionId: string) => { text: string; tone: Tone; changes: string };
  /** Task 3.6: theo đuổi, tặng quà, tỏ tình. */
  onRomance: (npcId: string, action: RomanceAction) => { text: string; tone: Tone; changes: string };
  /** Use one item from the bag. */
  onUseItem: (itemId: string) => { text: string; tone: Tone; changes: string };
  /** Playtest 2: one Kim Thủ Chỉ action. */
  onFingerAction: (actionId: string) => { text: string; tone: Tone; changes: string } | null;
  /** One round of the fight in progress, and the choice after winning (task 3.3). */
  onCombat: (action: CombatAction, itemId?: string) => void;
  onSettle: (choice: Aftermath) => void;
  /** Buy, sell or bargain at a market (Phường thị). */
  onMarket: (marketId: string, action: MarketAction) => { text: string; tone: Tone };
  /** Task 4.8: travel to a region; the arrival text, or null. */
  onTravel: (regionId: string) => string | null;
  /** Practise a craft from the "Tu luyện" sheet. */
  onPractice: (craftId: string) => string | null;
  /** Take up a mortal career from the "Tu luyện" sheet. */
  onJoinCareer: (careerId: string) => string | null;
  /** A year of martial training (task 3.11). */
  onTrain: () => string | null;
  onBond: (target: BondTarget, action: BondAction, arg?: string) => { text: string; tone: Tone; changes: string };
  onQuest: (a: QuestAction) => string | null;
  /** Practise a technique from a scroll (task 2.8). */
  onLearn: (techniqueId: string) => string | null;
  /** Nghịch Thiên Cải Mệnh: take a talent, or refresh the offer (task 2.7). */
  onFate: (action: { choose: string } | { reroll: true }) => void;
  /** Sect sheet actions (task 2.5). */
  onSectAction: (action: SectAction) => { text: string; good: boolean } | null;
  /** Tutorial tip read ("Đã hiểu") or tips turned off. */
  onTip: (tipId: string, turnOff: boolean) => void;
  /** Big breakthrough from the "Tu luyện" sheet; null when it cannot be tried. */
  onBreakthrough: () => { text: string; tone: Tone; changes: string } | null;
  onNewLife: () => void;
  /** Open the end-of-life summary (after death). */
  onSummary: () => void;
  /** Open the save slots (Sổ lưu). */
  onSaves: () => void;
  /** Set when developer mode is on: apply a cheat, or turn the mode off. */
  dev: { rewinds: RewindOption[]; onRewindTime: (years: number) => void; meta: SaveMeta; onChange: (next: GameState) => void; onMeta: (next: SaveMeta) => void; onDisable: () => void } | null;
  theme: ThemePref;
  onToggleTheme: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [result, setResult] = useState<PopupResult | null>(null);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [fingerOpen, setFingerOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [cultivateOpen, setCultivateOpen] = useState(false);
  // Kết đan and tâm ma take over the screen; the Tu luyện sheet steps aside so its outcome shows in the log (task 4.2).
  useEffect(() => {
    if (state.cult.coreForming || state.cult.heartDemonTrial || state.martial.quest?.game) setCultivateOpen(false);
  }, [!!state.cult.coreForming, !!state.cult.heartDemonTrial, !!state.martial.quest?.game]);
  const [sectOpen, setSectOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const logRef = useRef<HTMLElement>(null);
  const { character: c, stats, cult, money } = state;
  const origin = content.origins.find((o) => o.id === c.originId);
  const warn = extremeWarnings(state, content);
  const finger = fingerDef(content, state.goldenFinger?.id);
  const states = activeExtremes(state, content);
  const goal = currentGoal(state, content);
  const tip = pendingTip(state, content);
  const region = currentRegion(state, content);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.log.length]);

  const dockActions: Record<string, () => void> = { bonds: () => setFamilyOpen(true), cultivate: () => setCultivateOpen(true), sect: () => setSectOpen(true), explore: () => setMarketOpen(true) };
  const dockItem = (t: { id: string; glyph: string; label: string }) => (
    <button class="dock-item" key={t.id} title={dockActions[t.id] ? t.label : 'Sắp có'} onClick={dockActions[t.id]}>
      <span class="glyph" aria-hidden="true">{t.glyph}</span>
      <span>{t.label}</span>
    </button>
  );

  return (
    <div class="main-screen">
      <header class="top-bar">
        <button class="avatar" aria-label="Nhân vật" onClick={() => setProfileOpen(true)}>{c.name.split(' ')[0]}</button>
        <div class="who">
          <div class="name">{c.name}</div>
          <div class="title">{c.age} tuổi · {realmLabel(state, content)}{region ? ` · ${region.name}` : ''}</div>
        </div>
        <div class="purse">
          <span class="silver">{money.silver} <Term id="luong_bac">lượng bạc</Term></span>
          <span class="stone">{money.spiritStones} <Term id="linh_thach">linh thạch</Term></span>
        </div>
        <div class="top-actions">
          {dev && <button class="icon-btn dev-btn" aria-label="Developer mode" title="Developer mode" onClick={() => setDevOpen(true)}>Dev</button>}
          {content.regions.length > 0 && <button class="icon-btn" aria-label="Bản đồ" title="Bản đồ" onClick={() => setMapOpen(true)}>圖</button>}
          {finger && (
            <button class={`icon-btn finger-btn${fingerActionViews(state, content).some((a) => !a.blocked) ? ' ready' : ''}`}
              aria-label={`Kim Thủ Chỉ: ${finger.name}`} title={`Kim Thủ Chỉ: ${finger.name}`} onClick={() => setFingerOpen(true)}>指</button>
          )}
          <button class="icon-btn" aria-label="Túi đồ" title="Túi đồ" onClick={() => setBagOpen(true)}>囊</button>
          <button class="icon-btn" aria-label="Sổ lưu" title="Sổ lưu" onClick={onSaves}>簿</button>
          <span class="desktop-only">
            <ThemeToggle pref={theme} onChange={onToggleTheme} />
          </span>
        </div>
      </header>

      <section class="life-log" aria-label="Nhật ký đời người" ref={logRef}>
        {(goal || tip) && (
          <div class="guide">
            {goal && <p class="goal-line"><span class="goal-label">Mục tiêu</span> <TermText text={goal} /></p>}
            {tip && !state.events.pending && (
              <aside class="tip-card" aria-label="Hướng dẫn">
                <p><TermText text={tip.text} /></p>
                <div class="tip-actions">
                  <button class="chip-btn" onClick={() => onTip(tip.id, false)}>Đã hiểu</button>
                  <button class="link-btn" onClick={() => onTip(tip.id, true)}>Tắt hướng dẫn</button>
                </div>
              </aside>
            )}
          </div>
        )}
        {saveWarning && <p class="save-warning" role="alert">{saveWarning}</p>}
        {state.log.map((y, i) => (
          <article class={`age-block${i === state.log.length - 1 ? ' current' : ''}`} key={y.age}>
            <h3>{y.age === 0 ? 'Chào đời' : `Tuổi ${y.age}`}</h3>
            {y.lines.map((l) => <p class={l.tone === 'normal' ? '' : l.tone}><TermText text={l.text} /></p>)}
          </article>
        ))}
      </section>

      <nav class="dock" aria-label="Hành động">
        {DOCK_LEFT.map(dockItem)}
        {state.alive ? (
          <div class="age-wrap">
            <button class="age-btn" onClick={onAdvance} aria-label="Qua một năm" disabled={!!state.events.pending || !!state.fate || !!state.combat || !!result}>
              <span class="big">+1</span>
              <span class="small">năm</span>
            </button>
            <button class="ff-btn" onClick={onFastForward} aria-label="Tua nhanh tới khi có chuyện" title="Tua nhanh tới khi có chuyện"
              disabled={!!state.events.pending || !!state.fate || !!state.combat || !!result}>»</button>
          </div>
        ) : (
          <button class="age-btn ended" onClick={onSummary} aria-label="Xem tổng kết đời người" disabled={!!result}>
            <span class="big">終</span>
            <span class="small">Tổng kết</span>
          </button>
        )}
        {DOCK_RIGHT.map(dockItem)}
      </nav>

      <section class="stats-panel" aria-label="Chỉ số">
        <span class="panel-title">Chỉ số</span>
        <div class="stat-row"><span class="icon">樂</span><Meter label="Hạnh phúc" term="hanh_phuc" value={stats.happiness} tone="auto" warn={warn.includes('happiness')} /></div>
        <div class="stat-row"><span class="icon">體</span><Meter label="Sức khỏe" term="suc_khoe" value={stats.health} tone="auto" warn={warn.includes('health')} /></div>
        <div class="stat-row"><span class="icon">智</span><Meter label="Trí tuệ" term="tri_tue" value={stats.intellect} tone="auto" warn={warn.includes('intellect')} /></div>
        <div class="stat-row"><span class="icon">貌</span><Meter label="Mị lực" term="mi_luc" value={stats.charm} tone="auto" warn={warn.includes('charm')} /></div>
        <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" term="tu_vi" value={cult.progress} color="var(--bar-cult)"
          text={cult.realm === 'pham_nhan' ? 'Chưa tu luyện' : `${realmLabel(state, content)} · ${Math.floor(cult.progress)}%`} /></div>
        <div class="stat-row wide"><span class="icon">壽</span><Meter label="Tuổi" term="tho_nguyen" value={c.age} max={cult.lifespan} color="var(--bar-life)" text={`${c.age} tuổi`} /></div>
      </section>

      <EventPopup state={state} content={content} result={result}
        onChoose={(i) => setResult(onChoose(i))} onClose={() => setResult(null)} />

      {dev && devOpen && (
        <DevPanel state={state} content={content} meta={dev.meta} onChange={dev.onChange} rewinds={dev.rewinds} onRewindTime={dev.onRewindTime} onMeta={dev.onMeta} onClose={() => setDevOpen(false)}
          onDisable={() => { setDevOpen(false); dev.onDisable(); }} />
      )}

      {state.fate && !cultivateOpen && (
        <FatePopup state={state} content={content} unlimited={!!dev}
          onChoose={(id) => onFate({ choose: id })} onReroll={() => onFate({ reroll: true })} />
      )}

      {state.combat && !result && <CombatPanel state={state} content={content} onAct={onCombat} onSettle={onSettle} />}

      {sectOpen && <SectPanel state={state} content={content} onAction={onSectAction} onClose={() => setSectOpen(false)} />}

      {cultivateOpen && <CultivatePanel state={state} content={content} onBreakthrough={onBreakthrough} onPractice={onPractice} onJoinCareer={onJoinCareer} onLearn={onLearn} onTrain={onTrain} onQuest={onQuest} onSeclude={onSeclude} onCraft={onCraft} onClose={() => setCultivateOpen(false)} />}

      {mapOpen && <MapPanel state={state} content={content} unlimited={!!dev} onTravel={onTravel} onClose={() => setMapOpen(false)} />}

      {marketOpen && <MarketPanel state={state} content={content} onAction={onMarket} onClose={() => setMarketOpen(false)} />}

      {bagOpen && <BagPanel state={state} content={content} onUse={onUseItem} onClose={() => setBagOpen(false)} />}

      {fingerOpen && <GoldenFingerPanel state={state} content={content} onAction={onFingerAction} onClose={() => setFingerOpen(false)} />}

      {familyOpen && <FamilyPanel state={state} content={content} onAction={onFamilyAction} onRomance={onRomance} onBond={onBond} onDisciple={onDisciple} onClan={onClan} onClose={() => setFamilyOpen(false)} />}

      {profileOpen && (
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Nhân vật" onClick={(e) => e.target === e.currentTarget && setProfileOpen(false)}>
          <div class="event-card">
            <div class="kicker">Nhân vật</div>
            <h2>{c.name}</h2>
            <p class="story">
              {c.gender === 'nam' ? 'Nam' : 'Nữ'} · {origin?.name} · quê {c.hometown} · độ khó {difficultyName(state, content)}
            </p>
            <div class="profile-grid">
              {APTITUDE_LABELS.map(([key, label, glyph, term]) => (
                <div class="stat-row" key={key}><span class="icon">{glyph}</span><Meter label={label} term={term} value={state.aptitudes[key]} tone="auto" warn={warn.includes(key)} /></div>
              ))}
            </div>
            <p class="profile-root"><TermText text={`Linh căn: ${rootLabel(state, content)}`} /></p>
            <p class="profile-root"><TermText text={`Thể chất: ${bodyLabel(state, content)}`} /></p>
            {careerLabel(state, content) && <p class="profile-note">Đường đời: {careerLabel(state, content)}</p>}
            {sectLabel(state, content) && <p class="profile-note">Tông môn: {sectLabel(state, content)}</p>}
            {inventoryLabel(state, content) && <p class="profile-note">Mang theo: {inventoryLabel(state, content)}</p>}
            <p class="profile-note"><TermText text="Tư chất tiên thiên định từ lúc sinh, chỉ đổi được nhờ kỳ ngộ hay khí vận." /></p>
            {states.length > 0 && (
              <ul class="trait-chips" aria-label="Trạng thái đặc biệt">
                {states.map((d) => (
                  <li class={`trait-chip extreme-${d.zone}`} key={d.id}>
                    <b>{d.name}</b>
                    <span>{d.text}{d.note ? ` ${d.note}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
            {finger && (
              <ul class="trait-chips" aria-label="Kim Thủ Chỉ">
                <li class="trait-chip r-than golden-finger">
                  <b>{finger.name} · {finger.levels[state.goldenFinger!.level - 1]?.name ?? 'Chưa thức tỉnh'}</b>
                  <span><TermText text={`${finger.summary} Rủi ro: ${finger.risk}`} /></span>
                </li>
              </ul>
            )}
            {state.talents.length > 0 && (
              <ul class="trait-chips" aria-label="Thiên phú">
                {state.talents.map((id) => {
                  const t = content.fateTalents.find((x) => x.id === id);
                  return t && <li class={`trait-chip r-${t.rarity}`} key={id}><b>{t.name}</b><span><TermText text={t.summary} /></span></li>;
                })}
              </ul>
            )}
            {state.traits.length > 0 && (
              <ul class="trait-chips" aria-label="Tiên thiên khí vận">
                {state.traits.map((id) => {
                  const t = content.traits.find((x) => x.id === id);
                  return t && <li class={`trait-chip r-${t.rarity}`} key={id} title={t.summary}><b>{t.name}</b><span><TermText text={t.summary} /></span></li>;
                })}
              </ul>
            )}
            <button class="choice" onClick={() => setProfileOpen(false)}>Đóng</button>
            <button class="choice danger" onClick={() => { setProfileOpen(false); onNewLife(); }}>Bỏ kiếp này, đầu thai lại</button>
          </div>
        </div>
      )}
      {/* Kết đan sits above every sheet: the year waits for it (task 4.2). */}
      {state.cult.coreForming && <CorePopup state={state} content={content} onPlace={onPlaceStrand} />}
      {state.martial.quest?.game && <MiniGamePopup state={state} content={content} onAction={onQuest} />}
      {state.cult.heartDemonTrial && <HeartDemonPopup state={state} content={content} onMeet={onMeetIllusion} />}
    </div>
  );
}
