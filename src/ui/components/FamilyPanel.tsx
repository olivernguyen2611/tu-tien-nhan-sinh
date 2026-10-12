// "Quan hệ" sheet: family members with affinity (tap one to act together), and people met
// along the way (task 3.4: Người quen with realm, character and the favor/grudge ledger).
import { DiscipleActs } from './DiscipleActs';
import type { DiscipleAct } from '../../systems/discipleActs';
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { availableActions, relationLabel } from '../../systems/relationships';
import { npcLabel } from '../../systems/npcs';
import { hasHook } from '../../systems/cultivation';
import { childRootLabel, romanceLabel, romanceViews, type RomanceAction } from '../../systems/romance';
import { disciples, maxDisciples, recruitBlocked, teachBlocked } from '../../systems/disciples';
import { ClanSection, type ClanAction } from './ClanSection';
import { BondSection } from './BondSection';
import type { BondAction, BondTarget } from '../../systems/familyBond';
import { Meter } from './Meter';
import { ImportSection } from './ImportSection';
import type { ImportSetup, SavedPerson } from '../../systems/npcLibrary';

export function FamilyPanel({ state, content, onAction, onRomance, onDisciple, onClan, onBond, onSaveNpc, getSources, onImport, onClose }: {
  state: GameState;
  content: Content;
  /** Returns the outcome text to show under the relative. */
  onAction: (relativeId: string, actionId: string) => { text: string; tone: Tone; changes: string };
  /** Task 3.6: courting someone met along the way. */
  onRomance: (npcId: string, action: RomanceAction) => { text: string; tone: Tone; changes: string };
  /** Task 4.9: take a disciple (no id) or teach one. */
  onDisciple: (npcId: string | null, act?: DiscipleAct) => { text: string; tone: Tone; changes: string } | null;
  /** Task 5.4: found the clan or buy a property; returns the log text. */
  onClan: (action: ClanAction) => string | null;
  /** Backlog 2: Gia đạo, an action with a child or the đạo lữ (arg: technique or item id). */
  onBond: (target: BondTarget, action: BondAction, arg?: string) => { text: string; tone: Tone; changes: string };
  /** Backlog 11: write this NPC into the Sổ nhân vật; returns the line to show. */
  onSaveNpc: (npcId: string) => { text: string; tone: Tone };
  /** Backlog 12: the people that can be brought in (read when the form opens), and bringing one in. */
  getSources: () => SavedPerson[];
  onImport: (person: SavedPerson, setup: ImportSetup) => { ok: boolean; text: string };
  onClose: () => void;
}) {
  const age = state.character.age;
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; text: string; tone: Tone; changes: string } | null>(null);
  const [tab, setTab] = useState<'family' | 'npcs' | 'bond'>('family');
  // Alive first, then the closest (or most hated) at the top.
  const npcs = state.npcs.slice().sort((a, b) => Number(b.alive) - Number(a.alive) || b.favor + b.grudge + b.affinity - (a.favor + a.grudge + a.affinity));

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quan hệ" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Quan hệ</div>
        <div class="tabs" role="tablist">
          <button role="tab" class={`tab${tab === 'family' ? ' on' : ''}`} aria-selected={tab === 'family'} onClick={() => setTab('family')}>Gia đình</button>
          <button role="tab" class={`tab${tab === 'npcs' ? ' on' : ''}`} aria-selected={tab === 'npcs'} onClick={() => setTab('npcs')}>
            Người quen{npcs.length > 0 && ` (${npcs.filter((n) => n.alive).length})`}
          </button>
          <button role="tab" class={`tab${tab === 'bond' ? ' on' : ''}`} aria-selected={tab === 'bond'} onClick={() => setTab('bond')}>Gia đạo</button>
        </div>
        {tab === 'npcs' && maxDisciples(state, content) > 0 && (
          <div class="disciples">
            <p class="profile-note">Đồ đệ: {disciples(state).length}/{maxDisciples(state, content)}</p>
            <button class="chip-btn" disabled={!!recruitBlocked(state, content)} title={recruitBlocked(state, content) ?? undefined}
              onClick={() => { const r = onDisciple(null); if (r) setResult({ id: 'recruit', ...r }); }}>
              Thu đồ đệ
            </button>
            {result?.id === 'recruit' && <p class={`action-result ${result.tone}`}>{result.text}</p>}
          </div>
        )}
        {tab === 'npcs' && <ImportSection content={content} getSources={getSources} onImport={onImport} />}
        {tab === 'npcs' && (npcs.length === 0 ? (
          <p class="story">Giang hồ mênh mông, ngươi chưa quen được ai.</p>
        ) : (
          <ul class="family-list">
            {npcs.map((n) => {
              const l = npcLabel(content, n, hasHook(state, content, 'readMind'));
              const love = romanceLabel(state, content, n);
              const views = n.alive ? romanceViews(state, content, n.id) : [];
              return (
                <li class={`relative${n.alive ? '' : ' dead'}`} key={n.id}>
                  <div class="relative-head">
                    <span class="relation">{love.role ?? n.role}</span>
                    <b>{n.name}</b>
                    <span class="relative-age">{n.alive ? `${n.age} tuổi` : `mất năm ${n.age} tuổi`}</span>
                  </div>
                  {n.chosen && (
                    <p class="profile-note npc-line chosen-line">
                      Khí vận chi tử · {content.chosenOnes.templates.find((t) => t.id === n.chosen!.template)?.name ?? n.chosen.template}
                      {n.chosen.role && ` · ${content.chosenOnes.roles[n.chosen.role].name}`}
                    </p>
                  )}
                  <p class="profile-note npc-line">
                    {l.realm}
                    {l.surface && ` · ${l.surface}`}
                    {` · Bản chất: ${l.nature ?? '?'}`}
                  </p>
                  {n.alive && <Meter label={`Thiện cảm · ${love.tier}`} value={n.affinity} tone="auto" />}
                  {n.alive && n.disciple && (
                    <div class="action-chips">
                      <button class="chip-btn" disabled={!!teachBlocked(state, n)} title={teachBlocked(state, n) ?? undefined}
                        onClick={() => { const r = onDisciple(n.id); if (r) setResult({ id: n.id, ...r }); }}>
                        Chỉ điểm
                      </button>
                    </div>
                  )}
                  {n.alive && n.disciple && (
                    <DiscipleActs state={state} content={content} npc={n} onAct={(act) => { const r = onDisciple(n.id, act); if (r) setResult({ id: n.id, ...r }); }} />
                  )}
                  {views.length > 0 && (
                    <div class="action-chips">
                      {views.map((v) => (
                        <button class="chip-btn" key={v.action} disabled={!!v.blocked} title={v.blocked ?? undefined}
                          onClick={() => setResult({ id: n.id, ...onRomance(n.id, v.action) })}>
                          {v.label}{v.cost && <span class="chip-cost"> · {v.cost}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div class="action-chips">
                    <button class="chip-btn" title="Ghi người này vào Sổ nhân vật (trong Sổ lưu) để mang sang đời khác"
                      onClick={() => setResult({ id: n.id, changes: '', ...onSaveNpc(n.id) })}>Ghi vào sổ nhân vật</button>
                  </div>
                  {result?.id === n.id && result.text && (
                    <p class={`action-result ${result.tone}`}>
                      {result.text}
                      {result.changes && <span class="changes">{result.changes}</span>}
                    </p>
                  )}
                  {(n.favor > 0 || n.grudge > 0) && (
                    <p class="npc-ledger">
                      {n.favor > 0 && <span class="good">Ân {n.favor}</span>}
                      {n.grudge > 0 && <span class="bad">Oán {n.grudge}</span>}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
        {tab === 'family' && state.family.some((r) => r.alive) && <p class="profile-note">Chạm vào một người để tương tác. Mỗi việc làm được một lần mỗi năm.</p>}
        {tab === 'family' && (state.family.length === 0 ? (
          <p class="story">Ngươi không cha không mẹ, một thân một mình giữa trời đất.</p>
        ) : (
          <ul class="family-list">
            {state.family.map((r) => (
              <li class={`relative${r.alive ? '' : ' dead'}`} key={r.id}>
                <button class="relative-head" disabled={!r.alive} aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <span class="relation">{relationLabel(r, age)}</span>
                  <b>{r.name}</b>
                  <span class="relative-age">{r.alive ? `${r.age} tuổi` : `mất năm ${r.age} tuổi`}</span>
                </button>
                {childRootLabel(content, r) && <p class="profile-note npc-line">{childRootLabel(content, r)}</p>}
                {r.alive && <Meter label="Thiện cảm" value={r.affinity} tone="auto" />}
                {r.alive && open === r.id && (
                  <div class="action-chips">
                    {availableActions(state, content, r).map((a) => (
                      <button class="chip-btn" key={a.id} disabled={a.disabled} title={a.reason ?? undefined}
                        onClick={() => setResult({ id: r.id, ...onAction(r.id, a.id) })}>
                        {a.name}{a.cost > 0 && <span class="chip-cost"> · {a.cost} bạc</span>}
                      </button>
                    ))}
                  </div>
                )}
                {result?.id === r.id && result.text && (
                  <p class={`action-result ${result.tone}`}>
                    {result.text}
                    {result.changes && <span class="changes">{result.changes}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ))}
        {tab === 'bond' && <BondSection state={state} content={content} onBond={onBond} />}
        {tab === 'family' && <ClanSection state={state} content={content} onClan={onClan} />}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
