// Main screen in a BitLife-style layout: who-you-are bar on top, life log in the
// middle, a dock with the big age button, and stat bars underneath.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { FamilyPanel } from '../components/FamilyPanel';
import { EventPopup, type PopupResult } from '../components/EventPopup';
import { Meter } from '../components/Meter';
import { Term, TermText } from '../components/Tooltip';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ThemePref } from '../theme';

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

export function MainScreen({ state, content, saveWarning, onAdvance, onChoose, onFamilyAction, onNewLife, onSummary, onSaves, theme, onToggleTheme }: {
  state: GameState;
  content: Content;
  /** Shown when autosave failed. */
  saveWarning: string | null;
  onAdvance: () => void;
  /** Returns the outcome to show on the card. */
  onChoose: (index: number) => PopupResult;
  onFamilyAction: (relativeId: string, actionId: string) => { text: string; tone: Tone };
  onNewLife: () => void;
  /** Open the end-of-life summary (after death). */
  onSummary: () => void;
  /** Open the save slots (Sổ lưu). */
  onSaves: () => void;
  theme: ThemePref;
  onToggleTheme: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [result, setResult] = useState<PopupResult | null>(null);
  const [familyOpen, setFamilyOpen] = useState(false);
  const logRef = useRef<HTMLElement>(null);
  const { character: c, stats, cult, money } = state;
  const origin = content.origins.find((o) => o.id === c.originId);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.log.length]);

  const dockActions: Record<string, () => void> = { bonds: () => setFamilyOpen(true) };
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
          <div class="title">{c.age} tuổi · Phàm Nhân</div>
        </div>
        <div class="purse">
          <span class="silver">{money.silver} <Term id="luong_bac">lượng bạc</Term></span>
          <span class="stone">{money.spiritStones} <Term id="linh_thach">linh thạch</Term></span>
        </div>
        <div class="top-actions">
          <button class="icon-btn" aria-label="Túi đồ" title="Túi đồ">囊</button>
          <button class="icon-btn" aria-label="Sổ lưu" title="Sổ lưu" onClick={onSaves}>簿</button>
          <span class="desktop-only">
            <ThemeToggle pref={theme} onChange={onToggleTheme} />
          </span>
        </div>
      </header>

      <section class="life-log" aria-label="Nhật ký đời người" ref={logRef}>
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
          <button class="age-btn" onClick={onAdvance} aria-label="Qua một năm" disabled={!!state.events.pending || !!result}>
            <span class="big">+1</span>
            <span class="small">năm</span>
          </button>
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
        <div class="stat-row"><span class="icon">樂</span><Meter label="Hạnh phúc" term="hanh_phuc" value={stats.happiness} tone="auto" /></div>
        <div class="stat-row"><span class="icon">體</span><Meter label="Sức khỏe" term="suc_khoe" value={stats.health} tone="auto" /></div>
        <div class="stat-row"><span class="icon">智</span><Meter label="Trí tuệ" term="tri_tue" value={stats.intellect} tone="auto" /></div>
        <div class="stat-row"><span class="icon">貌</span><Meter label="Mị lực" term="mi_luc" value={stats.charm} tone="auto" /></div>
        <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" term="tu_vi" value={cult.progress} color="var(--bar-cult)" text="Chưa tu luyện" /></div>
        <div class="stat-row wide"><span class="icon">壽</span><Meter label="Tuổi" term="tho_nguyen" value={c.age} max={cult.lifespan} color="var(--bar-life)" text={`${c.age} tuổi`} /></div>
      </section>

      <EventPopup state={state} content={content} result={result}
        onChoose={(i) => setResult(onChoose(i))} onClose={() => setResult(null)} />

      {familyOpen && <FamilyPanel state={state} content={content} onAction={onFamilyAction} onClose={() => setFamilyOpen(false)} />}

      {profileOpen && (
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Nhân vật" onClick={(e) => e.target === e.currentTarget && setProfileOpen(false)}>
          <div class="event-card">
            <div class="kicker">Nhân vật</div>
            <h2>{c.name}</h2>
            <p class="story">
              {c.gender === 'nam' ? 'Nam' : 'Nữ'} · {origin?.name} · quê {c.hometown}
            </p>
            <div class="profile-grid">
              {APTITUDE_LABELS.map(([key, label, glyph, term]) => (
                <div class="stat-row" key={key}><span class="icon">{glyph}</span><Meter label={label} term={term} value={state.aptitudes[key]} tone="auto" /></div>
              ))}
            </div>
            <p class="profile-note"><TermText text="Tư chất tiên thiên định từ lúc sinh, chỉ đổi được nhờ kỳ ngộ hay khí vận." /></p>
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
    </div>
  );
}
