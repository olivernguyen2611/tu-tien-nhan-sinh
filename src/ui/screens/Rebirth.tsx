// Luân Hồi đài (task 5b.1): spend Luân Hồi points on thiên phú luân hồi kept for every later life.
import type { Content } from '../../core/content';
import { talentShop } from '../../systems/rebirthTalents';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export function RebirthScreen({ content, points, owned, known, onBuy, onBack }: {
  content: Content;
  points: number;
  owned: Record<string, number>;
  /** 9.R5b: talents about cultivation stay hidden until the Sổ tri thức knows of it. */
  known: string[];
  onBuy: (talentId: string) => void;
  onBack: () => void;
}) {
  const rows = talentShop(content, owned, points, known);
  return (
    <main class="create-screen rebirth-screen">
      <header class="create-head">
        <button class="icon-btn" onClick={onBack} aria-label="Quay lại">‹</button>
        <h1>Luân Hồi Đài</h1>
      </header>
      <p class="destiny-intro">
        Điểm Luân Hồi: <b>{points}</b>. Thiên phú mua ở đây theo ngươi qua mọi kiếp sau.
      </p>
      <ul class="talent-shop">
        {rows.map((r) => r.locked ? (
          <li key={r.id} class="talent-row">
            <div class="talent-head"><b>???</b></div>
            <p class="trait-flavor">Một thiên phú về con đường kiếp này chưa biết tới.</p>
          </li>
        ) : (
          <li key={r.id} class={`talent-row${r.level > 0 ? ' owned' : ''}`}>
            <div class="talent-head">
              <b>{r.name}</b>
              <span class="talent-level">{r.level > 0 ? `Tầng ${ROMAN[r.level] ?? r.level}` : 'Chưa mở'} / {ROMAN[r.max] ?? r.max}</span>
            </div>
            <p class="trait-flavor">{r.text}</p>
            {r.current && <p class="talent-now">Đang có: {r.current}</p>}
            {r.next ? (
              <button class="chip-btn" disabled={!r.next.affordable} onClick={() => onBuy(r.id)}>
                {r.level > 0 ? 'Nâng' : 'Mở'}: {r.next.summary} · {r.next.cost} điểm
              </button>
            ) : <p class="talent-now">Đã viên mãn.</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
