// A fight in progress (task 3.3): blow-by-blow lines, the five actions with
// their odds, then spare / loot / kill after a win. It cannot be dismissed.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import { COMBAT_ACTIONS, type CombatAction } from '../../core/schemas';
import type { GameState } from '../../core/types';
import { battleItems, combatPower, fleeChance, pleaChance, roundChance, type Aftermath } from '../../systems/combat';
import { itemById } from '../../systems/items';

const pct = (p: number) => `${Math.round(p * 100)}%`;
const AFTER: [Aftermath, string][] = [['spare', 'Tha'], ['loot', 'Cướp đồ'], ['kill', 'Giết']];

export function CombatPanel({ state, content, onAct, onSettle }: {
  state: GameState;
  content: Content;
  onAct: (action: CombatAction, itemId?: string) => void;
  onSettle: (choice: Aftermath) => void;
}) {
  const [picking, setPicking] = useState(false);
  const battle = state.combat;
  if (!battle) return null;
  const t = content.combat;
  const realm = content.cultivation.realms.realms.find((r) => r.id === battle.foe.realm)?.name ?? '';
  const items = battleItems(state, content);
  const odds = (a: CombatAction): string =>
    a === 'flee' ? pct(fleeChance(state, content)) : a === 'plead' ? pct(pleaChance(state, content)) : a === 'item' ? '' : pct(roundChance(state, content, a));

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Giao chiến">
      <div class="event-card combat-card">
        <div class="kicker">Giao chiến{battle.source ? ` · ${battle.source}` : ''}</div>
        <h2>{battle.foe.name}</h2>
        <div class="combat-score">
          <span>Ngươi <b>{Math.round(combatPower(state, content))}</b></span>
          <span class="rounds" aria-label={`Thắng ${battle.won}, thua ${battle.lost}`}>
            {'●'.repeat(battle.won)}{'○'.repeat(battle.lost)}
          </span>
          <span>{realm} <b>{Math.round(battle.foe.power)}</b></span>
        </div>
        <p class="profile-note">Sức khỏe {state.stats.health} · ai thắng {content.balance.combat.winRounds} hiệp trước là thắng.</p>
        <div class="combat-lines" role="log">
          {battle.lines.map((l, i) => <p key={i} class={l.tone === 'normal' ? '' : l.tone}>{l.text}</p>)}
        </div>

        {battle.phase === 'won' ? (
          <div class="combat-actions">
            {AFTER.map(([id, label]) => <button key={id} class="choice" onClick={() => onSettle(id)}>{label}</button>)}
          </div>
        ) : picking ? (
          <div class="combat-actions">
            {items.map((id) => (
              <button key={id} class="choice" onClick={() => { setPicking(false); onAct('item', id); }}>
                {itemById(content, id)?.name} <span class="odds">{pct(roundChance(state, content, 'item', id))}</span>
              </button>
            ))}
            <button class="choice" onClick={() => setPicking(false)}>Thôi</button>
          </div>
        ) : (
          <div class="combat-actions">
            {COMBAT_ACTIONS.map((a) => (
              <button key={a} class="choice" title={t.actions[a].hint} disabled={a === 'item' && items.length === 0}
                onClick={() => (a === 'item' ? setPicking(true) : onAct(a))}>
                <b>{t.actions[a].name}</b> <span class="odds">{odds(a)}</span>
                <small>{a === 'item' && items.length === 0 ? 'Trong túi không có pháp bảo hay phù dùng được.' : t.actions[a].hint}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
