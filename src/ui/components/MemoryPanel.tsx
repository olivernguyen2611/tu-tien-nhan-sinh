// 9.S3 Ký ức kiếp trước: what a Trùng sinh soul remembers, recalled as the realm rises. Display only.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { breakChance, memoryDef, memoryText } from '../../systems/trungSinh';

const KIND: Record<string, string> = { bao_vat: 'Bảo vật', tai_hoa: 'Tai họa', ke_thu: 'Kẻ thù', quy_nhan: 'Quý nhân', co_duyen: 'Cơ duyên' };

export function MemoryPanel({ state, content, onClose }: { state: GameState; content: Content; onClose: () => void }) {
  const ts = state.trungSinh;
  if (!ts) return null;
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id;
  return (
    <div class="modal-backdrop sheet" role="dialog" aria-modal="true" aria-label="Ký ức kiếp trước" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Trùng sinh</div>
        <h2>Ký ức kiếp trước</h2>
        <p class="profile-note">Lịch sử đã lệch <b>{Math.round(ts.drift)}%</b>. Ký ức càng dùng nhiều, thế gian càng khác đi; khả năng một ký ức sắp tới không còn đúng: {Math.round(breakChance(state, content) * 100)}%.</p>
        <ul class="memory-list">
          {ts.memories.map((m) => {
            const def = memoryDef(content, m.id);
            return (
              <li key={m.id} class={`memory ${m.state}`}>
                <b>{m.recalled ? `${KIND[def?.kind ?? ''] ?? ''} · ${m.age} tuổi` : '???'}</b>
                <span>{m.recalled ? memoryText(content, m) : `Mờ mịt, tới ${realmName(def?.recallRealm ?? '')} mới nhớ ra.`}</span>
                {m.state !== 'waiting' && <span class="muted">{m.state === 'done' ? ' · đã ứng nghiệm' : ' · đã lệch'}</span>}
              </li>
            );
          })}
        </ul>
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
