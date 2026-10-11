// Main screen in a BitLife-style layout: who-you-are bar on top, life log in the
// middle, a dock with the big age button, and stat bars underneath.
// Task 0.5 shows placeholder data (see ../preview.ts); GĐ 1 wires real state.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Meter } from '../components/Meter';
import { ThemeToggle } from '../components/ThemeToggle';
import { PREVIEW_NEXT, PREVIEW_POPUP, PREVIEW_START, type PreviewYear } from '../preview';
import type { ThemePref } from '../theme';

const DOCK_LEFT = [
  { id: 'cultivate', glyph: '修', label: 'Tu luyện' },
  { id: 'sect', glyph: '宗', label: 'Tông môn' },
];
const DOCK_RIGHT = [
  { id: 'bonds', glyph: '緣', label: 'Quan hệ' },
  { id: 'explore', glyph: '遊', label: 'Khám phá' },
];

export function MainScreen({ theme, onToggleTheme }: { theme: ThemePref; onToggleTheme: () => void }) {
  const [years, setYears] = useState<PreviewYear[]>(PREVIEW_START);
  const [popupOpen, setPopupOpen] = useState(false);
  const logRef = useRef<HTMLElement>(null);
  const age = years[years.length - 1].age;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [years.length]);

  const ageUp = () => {
    const next = PREVIEW_NEXT.find((y) => y.age > age);
    if (!next) return;
    setYears([...years, next]);
    if (next.popup) setPopupOpen(true);
  };

  const dockItem = (t: { id: string; glyph: string; label: string }) => (
    <button class="dock-item" key={t.id}>
      <span class="glyph" aria-hidden="true">{t.glyph}</span>
      <span>{t.label}</span>
    </button>
  );

  return (
    <div class="main-screen">
      <header class="top-bar">
        <button class="avatar" aria-label="Nhân vật">李</button>
        <div class="who">
          <div class="name">Lý Thanh Phong</div>
          <div class="title">{age} tuổi · Phàm Nhân</div>
        </div>
        <div class="purse">
          <span class="silver">12 lượng bạc</span>
          <span class="stone">0 linh thạch</span>
        </div>
        <div class="top-actions">
          <button class="icon-btn" aria-label="Túi đồ" title="Túi đồ">囊</button>
          <span class="desktop-only">
            <ThemeToggle pref={theme} onChange={onToggleTheme} />
          </span>
        </div>
      </header>

      <section class="life-log" aria-label="Nhật ký đời người" ref={logRef}>
        <span class="preview-tag">Xem trước bố cục · dữ liệu mẫu · bấm nút đỏ để thử</span>
        {years.map((y, i) => (
          <article class={`age-block${i === years.length - 1 ? ' current' : ''}`} key={y.age}>
            <h3>{y.age === 0 ? 'Chào đời' : `Tuổi ${y.age}`}</h3>
            {y.lines.map((l) => <p class={l.tone ?? ''}>{l.text}</p>)}
          </article>
        ))}
      </section>

      <nav class="dock" aria-label="Hành động">
        {DOCK_LEFT.map(dockItem)}
        <button class="age-btn" onClick={ageUp} aria-label="Qua một năm">
          <span class="big">+1</span>
          <span class="small">năm</span>
        </button>
        {DOCK_RIGHT.map(dockItem)}
      </nav>

      <section class="stats-panel" aria-label="Chỉ số">
        <span class="panel-title">Chỉ số</span>
        <div class="stat-row"><span class="icon">樂</span><Meter label="Hạnh phúc" value={64} tone="auto" /></div>
        <div class="stat-row"><span class="icon">體</span><Meter label="Sức khỏe" value={82} tone="auto" /></div>
        <div class="stat-row"><span class="icon">智</span><Meter label="Trí tuệ" value={58} tone="auto" /></div>
        <div class="stat-row"><span class="icon">貌</span><Meter label="Mị lực" value={27} tone="auto" /></div>
        <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" value={0} color="var(--bar-cult)" text="Chưa tu luyện" /></div>
        <div class="stat-row wide"><span class="icon">壽</span><Meter label="Thọ nguyên" value={age} max={72} color="var(--bar-life)" text={`Còn ~${72 - age} năm`} /></div>
      </section>

      {popupOpen && (
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label={PREVIEW_POPUP.title}>
          <div class="event-card">
            <div class="kicker">{PREVIEW_POPUP.kicker}</div>
            <h2>{PREVIEW_POPUP.title}</h2>
            <p class="story">{PREVIEW_POPUP.story}</p>
            {PREVIEW_POPUP.choices.map((c) => (
              <button class={`choice${c.hidden ? ' hidden-choice' : ''}`} onClick={() => setPopupOpen(false)}>
                {c.text}
                <span class="hint">{c.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
