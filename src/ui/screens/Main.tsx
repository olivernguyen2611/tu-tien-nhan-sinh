// Layout preview for task 0.5. The character and log below are placeholder
// data only; real state arrives with GameState in GĐ 1.
import { useState } from 'preact/hooks';
import { Meter } from '../components/Meter';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ThemePref } from '../theme';

const TABS = [
  { id: 'cultivate', glyph: '修', label: 'Tu luyện' },
  { id: 'sect', glyph: '宗', label: 'Tông môn' },
  { id: 'bag', glyph: '囊', label: 'Túi đồ' },
  { id: 'bonds', glyph: '緣', label: 'Quan hệ' },
  { id: 'explore', glyph: '遊', label: 'Khám phá' },
  { id: 'self', glyph: '我', label: 'Nhân vật' },
] as const;

const PREVIEW_LOG = [
  { year: 0, lines: ['Ngươi chào đời tại Thanh Vân trấn, con thứ hai của một nhà nông.', 'Bà đỡ bảo đứa bé khóc to như sấm, ắt có phúc lớn.'] },
  { year: 3, lines: ['Ngươi ăn trộm bánh bao của chó nhà hàng xóm. Con chó không tha thứ.'] },
  { year: 7, lines: ['Một lão đạo sĩ đi ngang qua làng, nhìn ngươi rất lâu rồi lắc đầu bỏ đi.'] },
  { year: 9, lines: ['Ngươi theo cha lên núi hái thuốc, nhặt được một chiếc nhẫn cũ gỉ sét.'] },
];

export function MainScreen({ theme, onToggleTheme }: { theme: ThemePref; onToggleTheme: () => void }) {
  const [tab, setTab] = useState<string>('self');

  return (
    <div class="main-screen">
      <header class="char-card">
        <div class="char-head">
          <div class="avatar" aria-hidden="true">李</div>
          <div class="who">
            <div class="name">Lý Thanh Phong</div>
            <div class="meta">9 tuổi · Phàm Nhân</div>
          </div>
          <ThemeToggle pref={theme} onChange={onToggleTheme} />
        </div>
        <div class="meters">
          <Meter label="Tu vi" value={0} max={100} color="var(--bar-cult)" text="Chưa tu luyện" />
          <Meter label="Thọ nguyên" value={9} max={72} color="var(--bar-life)" text="Còn ~63 năm" />
        </div>
        <div class="stats">
          <div class="stat"><b>82</b><small>Sức khỏe</small></div>
          <div class="stat"><b>64</b><small>Hạnh phúc</small></div>
          <div class="stat"><b>58</b><small>Trí tuệ</small></div>
          <div class="stat"><b>47</b><small>Mị lực</small></div>
        </div>
      </header>

      <section class="life-log" aria-label="Nhật ký đời người">
        <span class="preview-tag">Xem trước bố cục · dữ liệu mẫu</span>
        {PREVIEW_LOG.map((entry) => (
          <article class="year-block" key={entry.year}>
            <h3>Năm {entry.year} tuổi</h3>
            {entry.lines.map((line) => <p>{line}</p>)}
          </article>
        ))}
      </section>

      <div class="action-bar">
        <button class="btn-primary" disabled title="Sẽ hoạt động từ GĐ 1">Qua một năm</button>
      </div>

      <nav class="tab-bar" aria-label="Các mục">
        {TABS.map((t) => (
          <button class="tab" key={t.id} aria-current={tab === t.id ? 'true' : undefined} onClick={() => setTab(t.id)}>
            <span class="glyph" aria-hidden="true">{t.glyph}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
