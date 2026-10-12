// Gia tộc tu tiên (task 5.4): found the clan, buy sản nghiệp, read the tộc phả.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { clanBlocked, clanName, familyTree, propertyViews } from '../../systems/clan';

export type ClanAction = { kind: 'found'; rules: string[] } | { kind: 'buy'; propertyId: string };

export function ClanSection({ state, content, onClan }: {
  state: GameState;
  content: Content;
  onClan: (action: ClanAction) => string | null;
}) {
  const [rules, setRules] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const clan = state.clan;
  const cfg = content.balance.clan;
  const tree = familyTree(state, content);
  const blocked = clanBlocked(state, content);
  const toggle = (id: string) => setRules((rs) => (rs.includes(id) ? rs.filter((x) => x !== id) : rs.length < cfg.maxRules ? [...rs, id] : rs));

  return (
    <div class="crafts clan">
      <h3 class="panel-sub">{clan ? clan.name : 'Gia tộc'}</h3>
      {clan ? (
        <>
          <p class="profile-note">Lập tộc năm {clan.founded} tuổi, thủy tổ {clan.founder}.</p>
          {clan.rules.length > 0 && (
            <ul class="sect-rules">
              {clan.rules.map((id) => {
                const r = content.clan.rules.find((x) => x.id === id);
                return r && <li key={id}><b>{r.name}</b>: {r.text}</li>;
              })}
            </ul>
          )}
          <p class="profile-note">Sản nghiệp</p>
          {propertyViews(state, content).map((p) => (
            <div class="career-row" key={p.id}>
              <div class="craft-head"><b>{p.name}</b><span class="muted">{p.count}/{p.max} · mỗi năm {p.income}</span></div>
              <p class="profile-note">{p.text}</p>
              <button class="chip-btn" disabled={!!p.blocked} onClick={() => setNote(onClan({ kind: 'buy', propertyId: p.id }))}>Mua · {p.cost}</button>
              {p.blocked && <span class="craft-note">{p.blocked}</span>}
            </div>
          ))}
        </>
      ) : blocked ? (
        <p class="craft-note">{blocked}</p>
      ) : (
        <>
          <p class="profile-note">Dựng từ đường cho {clanName(state, content)}, tốn {cfg.cost} linh thạch. Gia quy (chọn tối đa {cfg.maxRules}):</p>
          {content.clan.rules.map((r) => (
            <label class="rule-option" key={r.id}>
              <input type="checkbox" checked={rules.includes(r.id)} disabled={!rules.includes(r.id) && rules.length >= cfg.maxRules} onChange={() => toggle(r.id)} />
              <span><b>{r.name}</b>: {r.text}</span>
            </label>
          ))}
          <button class="btn-primary" onClick={() => setNote(onClan({ kind: 'found', rules }))}>Lập gia tộc</button>
        </>
      )}
      {note && <p class="action-result good">{note}</p>}
      {(clan || tree.length > 1) && (
        <div class="ancestry">
          <p class="kicker">Tộc phả</p>
          <ol>
            {tree.map((m, i) => <li key={i} class={m.current ? 'me' : undefined}><b>{m.name}</b> · {m.note}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
