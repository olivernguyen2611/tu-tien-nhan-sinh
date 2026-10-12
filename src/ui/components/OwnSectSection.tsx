// Khai tông lập phái (task 5.1): found one's own sect from the Tông môn sheet,
// or see the sect already founded.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { buildingViews, decisionViews, foundBlocked, prestigeOf, prestigeTier, sectNameProblem, suggestSectName } from '../../systems/ownSect';
import { elderViews } from '../../systems/sectElders';

export function OwnSectSection({ state, content, onFound, onDecide, onBuild, onDonate, onElder }: {
  state: GameState;
  content: Content;
  onFound: (name: string, rules: string[]) => void;
  /** Task 5.2: a decision of the yearly report; raise a building. */
  onDecide: (decisionId: string) => void;
  onBuild: (buildingId: string) => void;
  onDonate: () => void;
  /** Task 5c.7: reward a named elder. */
  onElder: (npcId: string) => void;
}) {
  const [salt, setSalt] = useState(0);
  const [name, setName] = useState(() => suggestSectName(state, content));
  const [rules, setRules] = useState<string[]>([]);
  const own = state.ownSect;
  const cfg = content.balance.founding;
  const lineageName = (id: string) => content.lineages.find((l) => l.id === id)?.name ?? id;

  if (own) {
    return (
      <div class="crafts">
        <h3 class="panel-sub">{own.name}</h3>
        <p class="story">Chưởng môn {state.character.name} · {lineageName(own.lineage)} · khai tông năm {own.founded} tuổi · {own.members} đệ tử · kho {own.treasury} linh thạch</p>
        <p class="profile-note">Danh vọng: {prestigeTier(state, content).name} ({Math.round(prestigeOf(state, content))}/100). Đông đệ tử và nhiều công trình thì danh vọng lên, danh vọng cao thì người đến bái sư càng đông.</p>
        {elderViews(state, content).length > 0 && (
          <div class="crafts">
            <h3 class="panel-sub">Trưởng lão</h3>
            {elderViews(state, content).map((v) => (
              <div class="career-row" key={v.npc.id}>
                <div class="craft-head"><b>{v.npc.name}</b><span class="muted">thiện cảm {v.npc.affinity}</span></div>
                <p class="profile-note">{v.npc.age} tuổi · {content.cultivation.realms.realms.find((r) => r.id === v.npc.realm)?.name}</p>
                <button class="chip-btn" disabled={!!v.blocked} onClick={() => onElder(v.npc.id)}>Ban thưởng · {content.balance.founding.elders.rewardCost} linh thạch</button>
                {v.blocked && <span class="craft-note">{v.blocked}</span>}
              </div>
            ))}
          </div>
        )}
        {own.report && own.report.age === state.character.age && (
          <div class="sect-report">
            <p class="profile-note">{own.report.text}</p>
            {decisionViews(state, content).map((d) => (
              <div class="career-row" key={d.id}>
                <div class="craft-head"><b>{d.name}</b>{d.cost > 0 && <span class="muted">{d.cost} linh thạch</span>}</div>
                <p class="profile-note">{d.text}</p>
                <button class="chip-btn" disabled={!!d.blocked} onClick={() => onDecide(d.id)}>Quyết</button>
                {d.blocked && <span class="craft-note">{d.blocked}</span>}
              </div>
            ))}
            <p class="profile-note">Việc nào không quyết, trưởng lão tự lo như mọi năm.</p>
          </div>
        )}
        <button class="chip-btn" disabled={state.money.spiritStones < content.balance.founding.donation} onClick={onDonate}>
          Góp {content.balance.founding.donation} linh thạch vào kho
        </button>
        <h3 class="panel-sub">Công trình</h3>
        {buildingViews(state, content).map((b) => (
          <div class="career-row" key={b.id}>
            <div class="craft-head"><b>{b.name}</b><span class="muted">cấp {b.level}/{b.maxLevel}</span></div>
            <p class="profile-note">{b.text}</p>
            {b.cost !== null && (
              <button class="chip-btn" disabled={!!b.blocked} onClick={() => onBuild(b.id)}>
                {b.level === 0 ? 'Xây' : 'Nâng cấp'} · {b.cost} linh thạch
              </button>
            )}
            {b.blocked && <span class="craft-note">{b.blocked}</span>}
          </div>
        ))}
        {own.rules.length > 0 && (
          <ul class="sect-rules">
            {own.rules.map((id) => {
              const r = content.founding.rules.find((x) => x.id === id);
              return r && <li key={id}><b>{r.name}</b>: {r.text}</li>;
            })}
          </ul>
        )}
      </div>
    );
  }

  const blocked = foundBlocked(state, content);
  const nameProblem = sectNameProblem(name, content);
  const toggle = (id: string) => setRules((rs) => (rs.includes(id) ? rs.filter((x) => x !== id) : rs.length < cfg.maxRules ? [...rs, id] : rs));
  return (
    <div class="crafts">
      <h3 class="panel-sub">Khai tông lập phái</h3>
      <p class="profile-note">Mở sơn môn theo {lineageName(state.cult.lineage ?? 'tien')}, tốn {cfg.cost} linh thạch. Đang ở tông môn nào thì phải rời đi.</p>
      {blocked ? <p class="craft-note">{blocked}</p> : (
        <>
          <label class="field">
            <span>Tên tông môn</span>
            <input value={name} maxLength={cfg.nameLength[1]} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>
          <button class="link-btn" onClick={() => { setSalt(salt + 1); setName(suggestSectName(state, content, salt + 1)); }}>Gợi ý tên khác</button>
          <p class="profile-note">Tông quy (chọn tối đa {cfg.maxRules}):</p>
          {content.founding.rules.map((r) => (
            <label class="rule-option" key={r.id}>
              <input type="checkbox" checked={rules.includes(r.id)} disabled={!rules.includes(r.id) && rules.length >= cfg.maxRules} onChange={() => toggle(r.id)} />
              <span><b>{r.name}</b>: {r.text}</span>
            </label>
          ))}
          {nameProblem && <p class="craft-note">{nameProblem}</p>}
          <button class="btn-primary" disabled={!!nameProblem} onClick={() => onFound(name, rules)}>Khai tông</button>
        </>
      )}
    </div>
  );
}
