// 9.S1 Thiên cơ biến động: shown once, right after birth, when a life drew a Tình tiết đặc biệt hiếm. Display only.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { describeEffects } from '../../systems/effectText';
import { originDef } from '../../systems/specialOrigin';

const RARITY: Record<string, string> = { hiem: 'Hiếm', rat_hiem: 'Rất hiếm', cuc_hiem: 'Cực hiếm' };
const GROUP: Record<string, string> = { he_thong: 'Hệ thống', trung_sinh: 'Trùng sinh', phe_vat: 'Phế vật nghịch tập', thanh_tien: 'Đường thành tiên', khac: 'Dị số' };

export function ThienCoScreen({ state, content, onContinue }: { state: GameState; content: Content; onContinue: () => void }) {
  const list = (state.special?.ids ?? []).map((id) => originDef(content, id)).filter((o) => !!o);
  return (
    <main class="destiny-screen thien-co">
      <header class="create-head"><h1>Thiên cơ biến động</h1></header>
      <p class="destiny-intro">Lúc {state.character.name} chào đời, thiên cơ lệch đi một nhịp. Kiếp này sẽ không giống những kiếp trước.</p>
      <div class="destiny-cards">
        {list.map((o) => (
          <div class={`trait-card r-${o.rarity === 'cuc_hiem' ? 'than' : o.rarity === 'rat_hiem' ? 'thien' : 'tuyet'}`} key={o.id}>
            <div class="trait-face trait-front">
              <div class="trait-head"><b>{o.name}</b><span class="trait-rarity">{RARITY[o.rarity]} · {GROUP[o.group]}</span></div>
              <p>{o.text}</p>
              <ul class="trait-effects">
                {describeEffects([...o.effects, ...o.costs], content).map((l) => <li class={l.good ? 'up' : 'down'} key={l.text}>{l.text}</li>)}
              </ul>
              <p class="trait-cost">Cái giá: {o.costText}</p>
            </div>
          </div>
        ))}
      </div>
      <button class="btn-primary wide" onClick={onContinue}>Nhận mệnh</button>
    </main>
  );
}
