// "Sổ lưu": the save slots (play, export, delete, import); settings live in Cài đặt (Preferences.tsx).
// In pick mode the player chooses a slot for a new life or an imported save.
import { useRef, useState } from 'preact/hooks';
import type { SlotSummary } from '../../systems/save';
import type { SavedPerson } from '../../systems/npcLibrary';
import { ConfirmDialog } from '../components/ConfirmDialog';

export interface SlotView {
  slot: number;
  /** Null when empty or unreadable; `taken` tells the two apart. */
  summary: SlotSummary | null;
  taken: boolean;
  /** Khó and still alive: no export (task 2.10). */
  locked: boolean;
}

type Pending = { kind: 'delete' | 'overwrite'; slot: number } | null;

const when = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export function SettingsScreen({ slots, library, realmName, onSavePlayer, onRemovePerson, pick, worldName, message, onPlay, onExport, onDelete, onImport, onPick, onBack, onSettings }: {
  slots: SlotView[];
  /** Backlog 11: the Sổ nhân vật, and writing a slot's protagonist into it. */
  library: SavedPerson[];
  realmName: (id: string) => string;
  onSavePlayer: (slot: number) => void;
  onRemovePerson: (id: string) => void;
  /** Set in pick mode: what the chosen slot is for ("đời mới", "save vừa nhập"). */
  pick: string | null;
  worldName: (id: string) => string;
  message: { text: string; tone: 'good' | 'bad' } | null;
  onPlay: (slot: number) => void;
  onExport: (slot: number) => void;
  onDelete: (slot: number) => void;
  onImport: (file: File) => void;
  onPick: (slot: number) => void;
  onBack: () => void;
  /** Opens the Cài đặt screen. */
  onSettings: () => void;
}) {
  const [pending, setPending] = useState<Pending>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingSlot = pending && slots.find((s) => s.slot === pending.slot);
  const pendingName = pendingSlot?.summary?.name ?? 'save hỏng';

  const choose = (s: SlotView) => (s.taken ? setPending({ kind: 'overwrite', slot: s.slot }) : onPick(s.slot));

  return (
    <main class="settings-screen">
      <header class="settings-head">
        <button class="icon-btn" aria-label="Quay lại" onClick={onBack}>←</button>
        <h1>{pick ? 'Chọn ô lưu' : 'Sổ lưu'}</h1>
      </header>
      {pick && <p class="settings-note">Chọn một ô để đặt {pick}. Ô đã có đời khác sẽ bị ghi đè.</p>}
      {message && <p class={`settings-msg ${message.tone}`} role="status">{message.text}</p>}

      <ol class="slot-list">
        {slots.map((s) => (
          <li class={`slot-card${s.taken ? '' : ' empty'}`} key={s.slot}>
            <div class="slot-no">{s.slot}</div>
            <div class="slot-info">
              {s.summary ? (
                <>
                  <b>{s.summary.name}</b>
                  <span>{s.summary.age} tuổi · {s.summary.alive ? 'Đang sống' : 'Đã mất'} · {worldName(s.summary.worldId)}</span>
                  <span class="muted">Lưu lúc {when(s.summary.savedAt)}</span>
                </>
              ) : (
                <b class="muted">{s.taken ? 'Save hỏng, không đọc được' : 'Trống'}</b>
              )}
            </div>
            <div class="slot-actions">
              {pick ? (
                <button class="chip-btn" onClick={() => choose(s)}>{s.taken ? 'Ghi đè' : 'Chọn'}</button>
              ) : (
                <>
                  {s.summary && <button class="chip-btn" onClick={() => onPlay(s.slot)}>Chơi</button>}
                  {s.summary && <button class="chip-btn" title="Ghi nhân vật này vào Sổ nhân vật để mang sang đời khác" onClick={() => onSavePlayer(s.slot)}>Ghi vào sổ nhân vật</button>}
                  {s.summary && !s.locked && <button class="chip-btn" onClick={() => onExport(s.slot)}>Xuất file</button>}
                  {s.summary && s.locked && <span class="muted slot-lock" title="Độ khó Khó: đời còn sống thì không xuất file">Khó · không xuất file</span>}
                  {s.taken && <button class="chip-btn danger" onClick={() => setPending({ kind: 'delete', slot: s.slot })}>Xóa</button>}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!pick && (
        <section class="library" aria-label="Sổ nhân vật">
          <h2>Sổ nhân vật</h2>
          {library.length === 0 ? (
            <p class="settings-note">Chưa ghi ai. Ghi nhân vật từ ô lưu ở trên, hoặc ghi người quen trong bảng Quan hệ, rồi mang họ vào đời khác.</p>
          ) : (
            <ul class="slot-list">
              {library.map((p) => (
                <li class="slot-card" key={p.id}>
                  <div class="slot-info">
                    <b>{p.name}</b>
                    <span>{p.alive ? `${p.age} tuổi` : 'Đã mất'} · {p.root ? realmName(p.realm) : 'Phàm nhân'} · {p.source === 'player' ? 'Nhân vật chính' : 'Người quen'}</span>
                    <span class="muted">Từ đời của {p.from} · {worldName(p.worldId)}</span>
                  </div>
                  <div class="slot-actions"><button class="chip-btn danger" onClick={() => onRemovePerson(p.id)}>Xóa</button></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!pick && (
        <>
          <button class="btn-secondary wide" onClick={() => fileRef.current?.click()}>Nhập file save (.json)</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden
            onChange={(e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) onImport(f);
              (e.target as HTMLInputElement).value = '';
            }} />
          <p class="settings-note">Game tự lưu mỗi năm vào ô đang chơi. Save nằm trong trình duyệt này; muốn chơi trên máy khác hay giữ phòng hờ thì xuất file.</p>
          <button class="btn-secondary wide" onClick={onSettings}>Cài đặt</button>
        </>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'delete' ? `Xóa ô ${pending.slot}?` : `Ghi đè ô ${pending.slot}?`}
          text={pending.kind === 'delete'
            ? `Đời của ${pendingName} sẽ mất hẳn. Nếu muốn giữ, hãy xuất file trước.`
            : `Đời của ${pendingName} trong ô này sẽ bị thay bằng ${pick}.`}
          confirmLabel={pending.kind === 'delete' ? 'Xóa' : 'Ghi đè'}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const p = pending;
            setPending(null);
            if (p.kind === 'delete') onDelete(p.slot);
            else onPick(p.slot);
          }}
        />
      )}
    </main>
  );
}
