// "Nhập nhân vật" (backlog 12): bring a saved person into this life as an NPC. The player picks who,
// then sets their role and ledger toward the protagonist. Rules live in systems/npcLibrary.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import { defaultSetup, type ImportSetup, type SavedPerson } from '../../systems/npcLibrary';

type Result = { ok: boolean; text: string };

const CUSTOM = '__custom';

export function ImportSection({ content, getSources, onImport }: {
  content: Content;
  /** Read when the form opens: the Sổ nhân vật plus the protagonists of the save slots. */
  getSources: () => SavedPerson[];
  onImport: (person: SavedPerson, setup: ImportSetup) => Result;
}) {
  const [sources, setSources] = useState<SavedPerson[] | null>(null);
  const [who, setWho] = useState('');
  const [role, setRole] = useState(content.lifeTexts.npcLibrary.roles[0].id);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [keepAge, setKeepAge] = useState(true);
  const [nums, setNums] = useState(() => defaultSetup(content, content.lifeTexts.npcLibrary.roles[0].id));
  const [result, setResult] = useState<Result | null>(null);
  const roles = content.lifeTexts.npcLibrary.roles;
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id;

  if (!sources) {
    return (
      <div class="import-box">
        <button class="chip-btn" onClick={() => { const list = getSources(); setSources(list); setWho(list.find((p) => p.alive)?.id ?? ''); setName(list.find((p) => p.alive)?.name ?? ''); }}>
          Nhập nhân vật đã lưu
        </button>
        {result && <p class={`action-result ${result.ok ? 'good' : 'bad'}`}>{result.text}</p>}
      </div>
    );
  }
  const person = sources.find((p) => p.id === who);
  const pickPreset = (id: string) => { setRole(id); if (id !== CUSTOM) setNums({ ...defaultSetup(content, id), keepAge }); };
  const setup: ImportSetup = {
    ...nums, keepAge, name: name.trim() || undefined,
    roleId: role === CUSTOM ? null : role, customRole: role === CUSTOM ? custom : undefined,
  };
  const field = (label: string, key: 'affinity' | 'favor' | 'grudge') => (
    <label class="import-field">
      <span>{label} {nums[key]}</span>
      <input type="range" min={0} max={100} step={5} value={nums[key]} onInput={(e) => setNums({ ...nums, [key]: Number((e.target as HTMLInputElement).value) })} />
    </label>
  );

  return (
    <div class="import-box" role="group" aria-label="Nhập nhân vật">
      {sources.length === 0 ? (
        <p class="profile-note">Sổ nhân vật trống và không có ô lưu nào khác. Hãy ghi một người vào sổ trước (Sổ lưu).</p>
      ) : (
        <>
          <label class="import-field">
            <span>Nhân vật</span>
            <select value={who} aria-label="Nhân vật" onChange={(e) => { const id = (e.target as HTMLSelectElement).value; setWho(id); setName(sources.find((p) => p.id === id)?.name ?? ''); }}>
              {sources.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.alive}>
                  {p.name} · {p.alive ? `${p.age} tuổi` : 'đã mất'} · {p.root ? realmName(p.realm) : 'phàm nhân'} · {p.source === 'player' ? 'nhân vật chính' : 'người quen'}
                </option>
              ))}
            </select>
          </label>
          <label class="import-field">
            <span>Tên trong đời này</span>
            <input type="text" value={name} maxLength={30} aria-label="Tên" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>
          <label class="import-field">
            <span>Vai trò với ngươi</span>
            <select value={role} aria-label="Vai trò" onChange={(e) => pickPreset((e.target as HTMLSelectElement).value)}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              <option value={CUSTOM}>Tự đặt…</option>
            </select>
          </label>
          {role === CUSTOM && (
            <label class="import-field">
              <span>Vai trò (tự đặt)</span>
              <input type="text" value={custom} maxLength={30} aria-label="Vai trò tự đặt" onInput={(e) => setCustom((e.target as HTMLInputElement).value)} />
            </label>
          )}
          {field('Thiện cảm', 'affinity')}
          {field('Ân', 'favor')}
          {field('Oán', 'grudge')}
          <label class="import-check">
            <input type="checkbox" checked={keepAge} onChange={(e) => setKeepAge((e.target as HTMLInputElement).checked)} /> Giữ nguyên tuổi{person ? ` (${person.age})` : ''}; bỏ chọn thì bằng tuổi ngươi
          </label>
          <div class="action-chips">
            <button class="chip-btn" disabled={!person || !person.alive} onClick={() => {
              const r = onImport(person!, setup);
              setResult(r);
              if (r.ok) setSources(null);
            }}>Nhập vào đời này</button>
            <button class="chip-btn" onClick={() => setSources(null)}>Thôi</button>
          </div>
        </>
      )}
      {result && <p class={`action-result ${result.ok ? 'good' : 'bad'}`}>{result.text}</p>}
    </div>
  );
}
