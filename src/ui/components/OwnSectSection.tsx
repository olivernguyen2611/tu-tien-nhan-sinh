// Khai tông lập phái (task 5.1): found one's own sect from the Tông môn sheet,
// or see the sect already founded.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { foundBlocked, sectNameProblem, suggestSectName } from '../../systems/ownSect';

export function OwnSectSection({ state, content, onFound }: {
  state: GameState;
  content: Content;
  onFound: (name: string, rules: string[]) => void;
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
        <p class="story">Chưởng môn {state.character.name} · {lineageName(own.lineage)} · khai tông năm {own.founded} tuổi · {own.members} đệ tử</p>
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
