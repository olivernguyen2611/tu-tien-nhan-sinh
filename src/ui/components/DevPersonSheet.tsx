// 9.R6b: the full dev sheet of one person: every stored field (hidden ones too) and free edits.
// Display and actions only; the changes are devPersonCheat in systems/devPeople.ts.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { devPersonSheet, type DevPerson, type PersonCheat } from '../../systems/devPeople';
import { GroupedSelect } from './GroupedSelect';

type Field = Extract<PersonCheat, { kind: 'set' }>['field'];
const NPC_FIELDS: [Field, string][] = [['affinity', 'Thiện cảm'], ['favor', 'Ân'], ['grudge', 'Oán'], ['aptitude', 'Tư chất'], ['age', 'Tuổi'], ['lifespan', 'Thọ nguyên'], ['progress', 'Tiến độ (%)']];
const REL_FIELDS: [Field, string][] = [['affinity', 'Thiện cảm'], ['insight', 'Ngộ tính'], ['age', 'Tuổi'], ['lifespan', 'Thọ nguyên']];
const SLOTS = [['surface', 'Tính nết'], ['nature', 'Bản chất'], ['goal', 'Chí hướng']] as const;

export function DevPersonSheet({ state, content, person, live, onCheat }: {
  state: GameState;
  content: Content;
  person: DevPerson;
  live: boolean;
  onCheat: (c: PersonCheat) => void;
}) {
  const npc = person.kind === 'npc';
  const fields = npc ? NPC_FIELDS : REL_FIELDS;
  const [field, setField] = useState<Field>('affinity');
  const [value, setValue] = useState('50');
  const [slot, setSlot] = useState<(typeof SLOTS)[number][0]>('nature');
  const traits = slot === 'goal' ? content.npcTraits.goals : content.npcTraits[slot];
  const [traitId, setTraitId] = useState('');
  const [techId, setTechId] = useState(content.techniques[0]?.id ?? '');
  const f = fields.some(([k]) => k === field) ? field : fields[0][0];
  const t = traits.some((x) => x.id === traitId) ? traitId : traits[0]?.id ?? '';
  const n = npc ? state.npcs.find((x) => `npc:${x.id}` === person.key) : null;

  return (
    <details class="dev-section">
      <summary>Hồ sơ đầy đủ</summary>
      <dl class="npc-info">
        {devPersonSheet(state, content, person.key).map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
      </dl>
      <div class="dev-event">
        <select value={f} onChange={(e) => setField((e.target as HTMLSelectElement).value as Field)} aria-label="Chỉ số">
          {fields.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
        </select>
        <input type="number" value={value} onInput={(e) => setValue((e.target as HTMLInputElement).value)} aria-label="Giá trị" />
        <button class="chip-btn" disabled={!live || value === ''} onClick={() => onCheat({ kind: 'set', field: f, value: Number(value) })}>Đặt</button>
      </div>
      {npc && (
        <div class="dev-event">
          <select value={slot} onChange={(e) => setSlot((e.target as HTMLSelectElement).value as typeof slot)} aria-label="Nét tính cách">
            {SLOTS.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
          </select>
          <select value={t} onChange={(e) => setTraitId((e.target as HTMLSelectElement).value)} aria-label="Chọn nét">
            {traits.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <button class="chip-btn" disabled={!live || !t} onClick={() => onCheat({ kind: 'trait', slot, id: t })}>Đặt</button>
        </div>
      )}
      {npc && n && (
        <div class="action-chips">
          <button class="chip-btn" disabled={!live} onClick={() => onCheat({ kind: 'revealNature', on: !n.natureKnown })}>{n.natureKnown ? 'Giấu bản chất' : 'Lộ bản chất'}</button>
        </div>
      )}
      <div class="dev-event">
        <GroupedSelect value={techId} onChange={setTechId} label="Công pháp truyền cho người này"
          options={content.techniques.map((x) => ({ id: x.id, name: x.name, group: `Công pháp ${content.cultivation.realms.gradeNames[x.grade] ?? x.grade}` }))} />
        <button class="chip-btn" disabled={!live || !techId} onClick={() => onCheat({ kind: 'technique', id: techId })}>Truyền</button>
        <button class="chip-btn" disabled={!live} onClick={() => onCheat({ kind: 'technique', id: null })}>Bỏ</button>
      </div>
    </details>
  );
}
