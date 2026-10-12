// "Bản đồ đại vực" (task 4.8): where the player is, which regions are open, who keeps each one.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { currentRegion, regionOpen, travelBlock, type TravelBlock } from '../../systems/regions';

const BLOCK_TEXT: Record<TravelBlock, string> = {
  locked: 'Cảnh giới chưa đủ',
  here: 'Đang ở đây',
  movedThisYear: 'Năm nay đã lên đường',
  busy: 'Đang bận việc khác',
};

export function MapPanel({ state, content, unlimited, onTravel, onClose }: {
  state: GameState;
  content: Content;
  /** Dev mode: every region open, no yearly limit. */
  unlimited: boolean;
  /** Arrival goes to the life log; the panel closes so it shows. */
  onTravel: (regionId: string) => string | null;
  onClose: () => void;
}) {
  const here = currentRegion(state, content);
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id;

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Bản đồ đại vực" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Khám phá</div>
        <h2>Bản đồ {content.world.name}</h2>
        {here && <p class="profile-note">Đang ở <b>{here.name}</b>.</p>}
        <ul class="bag-list">
          {content.regions.map((r) => {
            const open = unlimited || regionOpen(state, content, r);
            const block = travelBlock(state, content, r.id, unlimited);
            const seen = state.region.visited.includes(r.id) || r.id === content.regions[0]?.id;
            return (
              <li class={`bag-item region-row${r.id === here?.id ? ' here' : ''}${open ? '' : ' locked'}`} key={r.id}>
                <div>
                  <b>{r.name}</b> <span class="profile-note">Linh khí ×{r.qi}</span>
                  {open ? (
                    <>
                      <span class="profile-note">{r.description}</span>
                      <span class="profile-note">{r.summary}</span>
                      <span class="profile-note">
                        Trấn giữ: {r.guardian.title} {seen ? r.guardian.name : '(chưa rõ danh tính)'} · {realmName(r.guardian.realm)}
                      </span>
                    </>
                  ) : (
                    <span class="profile-note">Cần {realmName(r.minRealm ?? '')} mới đặt chân tới được.</span>
                  )}
                </div>
                <button class="chip-btn" disabled={!!block} onClick={() => onTravel(r.id) && onClose()}>
                  {block ? BLOCK_TEXT[block] : 'Lên đường'}
                </button>
              </li>
            );
          })}
        </ul>
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
