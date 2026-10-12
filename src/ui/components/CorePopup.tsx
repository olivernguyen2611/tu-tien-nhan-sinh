// Kết đan (task 4.2): three rounds of placing a qi strand into the core. It cannot
// be dismissed; the year waits until the core forms or shatters.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { coreChancePct, coreGradeFor, strandEffect } from '../../systems/goldenCore';
import { Meter } from './Meter';

export function CorePopup({ state, content, onPlace }: {
  state: GameState;
  content: Content;
  onPlace: (element: string) => void;
}) {
  const f = state.cult.coreForming;
  if (!f) return null;
  const cfg = content.balance.coreForming;
  const grade = content.cultivation.realms.coreGradeNames[coreGradeFor(content, f.purity) - 1];
  const placed = f.placed.map((e) => content.cultivation.roots.elements.find((x) => x.id === e)?.name ?? e);
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Kết đan">
      <div class="event-card">
        <div class="kicker">Đột phá Kim Đan · lượt {f.round + 1}/{cfg.rounds}</div>
        <h2>Kết đan</h2>
        <p class="story">Chọn một luồng linh khí dẫn vào đan điền. Hợp linh căn, tương sinh với luồng trước, hợp công pháp thì đan thuần hơn. Tương khắc thì đan rạn; rạn {cfg.crackLimit} lần là vỡ.</p>
        <div class="stat-row wide"><span class="icon">丹</span><Meter label={`Độ thuần · ${grade}`} value={f.purity} color="var(--bar-cult)" /></div>
        <p class="profile-note">
          {placed.length > 0 ? `Đã dẫn: ${placed.join(' → ')}` : 'Chưa dẫn luồng nào.'}
          {` · Vết rạn: ${f.cracks}/${cfg.crackLimit} · Tỉ lệ thành công khoảng ${Math.round(coreChancePct(state, content))}%`}
        </p>
        {f.offered.map((e) => {
          const v = strandEffect(state, content, e);
          const hint = v.crack ? `Tương khắc · rạn · ${v.purity}` : `${v.kind === 'root' ? 'Hợp linh căn' : v.kind === 'flow' ? 'Tương sinh' : 'Bình thường'} · +${v.purity}`;
          return (
            <button class="choice" key={e} onClick={() => onPlace(e)}>
              Luồng {v.name}
              <span class={v.crack ? 'hint bad' : 'hint'}>{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
