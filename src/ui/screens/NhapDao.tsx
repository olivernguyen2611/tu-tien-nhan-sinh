// 9.1 Màn nhập đạo: shown once when a life enters a new tầng (Phàm gian → Tu chân giới…), with a short look
// back at the life so far. Display only.
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { lifeRecap } from '../../systems/rebirth';
import { activeLifestyles, tierDef } from '../../systems/tiers';

export function NhapDaoScreen({ state, content, onContinue }: { state: GameState; content: Content; onContinue: () => void }) {
  const tier = tierDef(content, state.tierScreen ?? undefined);
  if (!tier) return null;
  const from = content.world.tiers[content.world.tiers.indexOf(tier) - 1];
  const years = from ? state.character.age - (state.tierHistory?.[from.id] ?? 0) : state.character.age;
  const ways = activeLifestyles(state, content).filter((l) => l.id !== 'tu_tien').map((l) => l.name);
  return (
    <main class="destiny-screen nhap-dao">
      <header class="create-head"><h1>{tier.name}</h1></header>
      <p class="destiny-intro">Năm {state.character.age} tuổi, {state.character.name} bước vào {tier.name}.</p>
      {tier.enterText && <p class="story">{tier.enterText}</p>}
      {from && (
        <section class="nhap-dao-recap" aria-label={`${years} năm ở ${from.name}`}>
          <h2 class="panel-sub">{years} năm ở {from.name}</h2>
          <ul>
            {ways.length > 0 && <li><b>Lối sống:</b> {ways.join(', ')}</li>}
            {lifeRecap(state, content).filter((l) => l.label !== 'Cảnh giới').slice(0, 6).map((l) => <li key={l.label}><b>{l.label}:</b> {l.value}</li>)}
          </ul>
        </section>
      )}
      <button class="btn-primary wide" onClick={onContinue}>Bước tiếp</button>
    </main>
  );
}
