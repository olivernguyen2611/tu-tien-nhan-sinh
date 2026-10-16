// Developer mode panel: play-testing cheats. All changes go through systems/dev.
// Sections fold (details) so the panel stays usable on a phone.
import { BalancePanel } from './BalancePanel';
import type { ComponentChildren } from 'preact';
import { GroupedSelect, type SelectOption } from './GroupedSelect';
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { DeathCause, GameState } from '../../core/types';
import { STAT_LABELS } from '../../systems/deltas';
import { activeCombos } from '../../systems/destiny';
import { fingerDef } from '../../systems/goldenFinger';
import { bodyLabel, innateRootLabel, rootLabel } from '../../systems/cultivation';
import { npcById } from '../../systems/npcs';
import { romanceBlocked } from '../../systems/romance';
import { devPeople, devPersonCheat, personCheatsAvailable, type PersonCheat } from '../../systems/devPeople';
import { DevPersonSheet } from './DevPersonSheet';
import type { SaveMeta } from '../../systems/save';
import type { RewindOption } from '../../systems/timeline';
import {
  DEV_STATS, devAddKarma, devAddLifespan, devAddMoney, devAddStat, devClearHeartDemon, devFillProgress, devFindEvents, devFoundClan, devFoundSect,
  devGiveAllItems, devGiveAllScrolls, devGiveItem, devHeal, devLearnTechnique, devJoinSect, devWorldEvent, devKill, devMeetNpc, devMetaFingerPity, devMetaPoints, devMetaTalent, devMetaUnlockAll, devNextStage, devPastSect, devPastTie, devSpecial, devSystemPoints, devSystemBetray, devDrift, devMerit,
  devAwakenBody, devResetBond, devChildrenRoot, devSetBody, devStartMartialQuest, devQuestStep, devMarry, devResetEventHistory, devRootOptions, devSetMartial, devSetRoot, devSpouseAffinity,
  devResetItemUse, devResetFingerCooldowns, devSetFingerLevel, devSetFlag, devSetGoldenFinger, devSetRealm, devSkipYears, devStartFight, devTakeChosen, devToggleTrait, devTriggerEvent,
} from '../../systems/dev';

const DEATHS: [DeathCause, string][] = [['old_age', 'Thọ tận'], ['illness', 'Bệnh'], ['combat', 'Tử trận'], ['breakthrough', 'Đột phá thất bại'], ['tribulation', 'Lôi kiếp'], ['ordeal', 'Tai kiếp'], ['calamity', 'Tai ương']];

function Section({ title, open, children }: { title: string; open?: boolean; children: ComponentChildren }) {
  return (
    <details class="dev-section" open={open}>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

function Pick({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: ComponentChildren }) {
  return (
    <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)} aria-label={label}>
      {children}
    </select>
  );
}

/** A Pick whose options sit under group headings (long lists: items, techniques, events…). */
function GPick({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: SelectOption[] }) {
  return <GroupedSelect value={value} onChange={onChange} label={label} options={options} />;
}

const RARITY_ORDER = ['pham', 'luong', 'uu', 'tuyet', 'thien', 'than', 'ac'];
const RARITY_NAME: Record<string, string> = { pham: 'Phàm', luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần', ac: 'Ác vận' };
const KIND_ORDER = ['pill', 'artifact', 'talisman', 'array', 'material', 'misc'];
const GRADE_ORDER = ['hoang', 'huyen', 'dia', 'thien', 'vo_thuong'];
const byOrder = (order: string[]) => (a: string, b: string) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99);

export function DevPanel({ state, content, meta, rewinds, onRewindTime, onChange: onApply, onMeta, onDisable, onClose }: {
  state: GameState;
  content: Content;
  /** Save meta (Luân Hồi points, thiên phú, Thiên Thư, thành tựu). */
  meta: SaveMeta;
  onChange: (next: GameState) => void;
  /** Rewinds on offer (only where a snapshot exists) and the action. */
  rewinds: RewindOption[];
  onRewindTime: (years: number) => void;
  onMeta: (next: SaveMeta) => void;
  onDisable: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const events = devFindEvents(content, query);
  const [eventId, setEventId] = useState(content.events[0]?.id ?? '');
  const [itemId, setItemId] = useState(content.items[0]?.id ?? '');
  const [techId, setTechId] = useState(content.techniques[0]?.id ?? '');
  const [realmId, setRealmId] = useState(content.cultivation.realms.realms[1]?.id ?? '');
  const [traitId, setTraitId] = useState(content.traits[0]?.id ?? '');
  const [fingerId, setFingerId] = useState(content.goldenFingers.fingers[0]?.id ?? '');
  const [talentId, setTalentId] = useState(content.rebirthTalents.talents[0]?.id ?? '');
  const [templateId, setTemplateId] = useState(content.chosenOnes.templates[0]?.id ?? '');
  const [sectId, setSectId] = useState(content.sects[0]?.id ?? '');
  const [worldEventId, setWorldEventId] = useState(content.worldEvents?.[0]?.id ?? '');
  const [flag, setFlag] = useState('');
  const roots = devRootOptions(content);
  const [rootKey, setRootKey] = useState(roots[0]?.key ?? '');
  const [bodyId, setBodyId] = useState(content.cultivation.roots.bodies[0]?.id ?? '');
  const [martialStage, setMartialStage] = useState('0');
  const spouse = npcById(state, state.romance.partner);
  // A cheat that changes nothing says why, instead of looking like a dead button.
  const [notice, setNotice] = useState<string | null>(null);
  const onChange = (next: GameState, why?: string | null) => {
    if (next === state) { setNotice(why ?? 'Không có gì thay đổi: điều kiện của nút này chưa đủ lúc này.'); return; }
    setNotice(null);
    onApply(next);
  };
  const people = devPeople(state);
  const [personKey, setPersonKey] = useState('');
  const person = people.find((p) => p.key === personKey) ?? people[0];
  const [personRealm, setPersonRealm] = useState(content.cultivation.realms.realms[1]?.id ?? '');
  const can = (k: PersonCheat['kind']) => !!person && personCheatsAvailable(person).includes(k);
  const cheat = (c: PersonCheat) => person && onChange(devPersonCheat(state, content, person.key, c));
  const live = state.alive;
  const stats: Record<string, number> = { ...state.stats, ...state.aptitudes };
  const picked = events.some((e) => e.id === eventId) ? eventId : events[0]?.id ?? '';
  const finger = fingerDef(content, state.goldenFinger?.id);
  const talent = content.rebirthTalents.talents.find((t) => t.id === talentId);
  const talentLv = meta.rebirthTalents[talentId] ?? 0;
  const flags = Object.keys(state.flags).filter((k) => state.flags[k]);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Developer mode" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card dev-panel">
        <div class="kicker">Developer mode</div>
        <h2>Bảng thử nghiệm</h2>
        <p class="profile-note">Seed <code>{state.seed}</code> · mọi thay đổi ghi [Dev] trong nhật ký.</p>
        {notice && <p class="action-result bad dev-notice" role="status">{notice}</p>}

        <Section title="Chỉ số" open>
          <ul class="dev-stats">
            {DEV_STATS.map((k) => (
              <li key={k}>
                <span>{STAT_LABELS[k]}</span>
                <b>{stats[k]}</b>
                <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddStat(state, k, -10))}>−10</button>
                <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddStat(state, k, 10))}>+10</button>
              </li>
            ))}
          </ul>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddMoney(state, 100, 0))}>+100 bạc</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddMoney(state, 0, 10))}>+10 linh thạch</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddMoney(state, 0, 500))}>+500 linh thạch</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddKarma(state, -10))}>Nhân quả −10</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddKarma(state, 10))}>Nhân quả +10</button>
          </div>
        </Section>

        <Section title="Tu luyện & thời gian">
          <p class="profile-note">Thọ {state.cult.lifespan} · tu vi {state.cult.progress}% · tâm ma {state.cult.heartDemon}</p>
          <div class="dev-event">
            <Pick value={realmId} onChange={setRealmId} label="Cảnh giới">
              {content.cultivation.realms.realms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetRealm(state, content, realmId))}>Đặt</button>
          </div>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devNextStage(state, content))}>Lên 1 tầng</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devFillProgress(state))}>Đầy tu vi</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAddLifespan(state, 50))}>Thọ +50</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devClearHeartDemon(state))}>Xóa tâm ma</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSkipYears(state, content, 1))}>Qua 1 năm</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSkipYears(state, content, 10))}>Qua 10 năm</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devHeal(state))}>Hồi đầy sức khỏe</button>
            {content.balance.dev.rewindSteps.map((y) => (
              <button key={y} class="chip-btn" disabled={!rewinds.some((r) => r.years === y)} title="Về lại đầu năm đó, làm lại các lựa chọn" onClick={() => onRewindTime(y)}>Tua ngược {y} năm</button>
            ))}
          </div>
        </Section>

        <Section title="Linh căn & võ đạo">
          <p class="profile-note">Linh căn: {rootLabel(state, content)}{innateRootLabel(state, content) && ` (ẩn: ${innateRootLabel(state, content)})`} · thể chất: {bodyLabel(state, content)} · võ đạo: {state.martial.stage < 0 ? 'chưa nhập môn' : content.martial.stages[state.martial.stage]?.name}</p>
          <div class="dev-event">
            <GPick value={rootKey} onChange={setRootKey} label="Linh căn" options={roots.map((r) => ({ id: r.key, name: r.label, group: r.group }))} />
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetRoot(state, content, roots.find((r) => r.key === rootKey)!.root))}>Đặt</button>
          </div>
          <div class="dev-event">
            <Pick value={bodyId} onChange={setBodyId} label="Thể chất">
              {content.cultivation.roots.bodies.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devAwakenBody(state, content, bodyId))}>Thức tỉnh</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetBody(state, content, bodyId))}>Đặt (không thưởng)</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetBody(state, content, null))}>Về phàm thể</button>
          </div>
          <div class="dev-event">
            <Pick value={martialStage} onChange={setMartialStage} label="Võ đạo">
              <option value="-1">Chưa nhập môn</option>
              {content.martial.stages.map((m, i) => <option key={m.name} value={String(i)}>{m.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live || state.cult.realm !== 'pham_nhan'} onClick={() => onChange(devSetMartial(state, content, Number(martialStage)), 'Chỉ phàm nhân mới có võ đạo.')}>Đặt</button>
          </div>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live || state.cult.realm !== 'pham_nhan'} onClick={() => onChange(devStartMartialQuest(state, content), 'Giai đoạn võ đạo này không có chuỗi nhiệm vụ (chỉ Hóa cảnh và Tam hoa tụ đỉnh có).')}>Bắt đầu chuỗi võ đạo</button>
            <button class="chip-btn" disabled={!live || !state.martial.quest} onClick={() => onChange(devQuestStep(state, content, 'win'))}>Qua ải ngay</button>
            <button class="chip-btn" disabled={!live || !state.martial.quest} onClick={() => onChange(devQuestStep(state, content, 'retry'))}>Được thử lại năm nay</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devResetBond(state))}>Gia đạo: làm lại trong năm</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devChildrenRoot(state, content, true))}>Con cái → không linh căn</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devChildrenRoot(state, content, false))}>Con cái → song linh căn</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetFlag(state, 'cam_ung_tam_hoa', true))}>Cảm ứng Tam hoa</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetFlag(state, 'cam_ung_ngu_khi', true))}>Cảm ứng Ngũ khí</button>
          </div>
        </Section>

        <Section title="Khí vận & Kim Thủ Chỉ">
          <p class="profile-note">
            Khí vận: {state.traits.map((id) => content.traits.find((t) => t.id === id)?.name ?? id).join(', ') || 'không'}
            {activeCombos(state, content).length > 0 && <> · Tổ hợp: {activeCombos(state, content).map((c) => c.name).join(', ')}</>}
          </p>
          <div class="dev-event">
            <GPick value={traitId} onChange={setTraitId} label="Khí vận" options={content.traits.slice().sort((a, b) => byOrder(RARITY_ORDER)(a.rarity, b.rarity)).map((t) => ({ id: t.id, name: `${state.traits.includes(t.id) ? '✓ ' : ''}${t.name}`, group: `Khí vận ${RARITY_NAME[t.rarity] ?? t.rarity}` }))} />
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devToggleTrait(state, content, traitId))}>{state.traits.includes(traitId) ? 'Bỏ' : 'Thêm'}</button>
          </div>
          <p class="profile-note">Kim Thủ Chỉ: {finger ? `${finger.name} cấp ${state.goldenFinger!.level}/${finger.levels.length}` : 'không'}</p>
          <div class="dev-event">
            <Pick value={fingerId} onChange={setFingerId} label="Kim Thủ Chỉ">
              {content.goldenFingers.fingers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devSetGoldenFinger(state, content, fingerId))}>Nhận</button>
          </div>
          <div class="action-chips">
            {finger && finger.levels.map((l, i) => (
              <button class="chip-btn" key={l.name} disabled={!live} onClick={() => onChange(devSetFingerLevel(state, content, i + 1))}>Cấp {i + 1}</button>
            ))}
            <button class="chip-btn" disabled={!live || !finger} onClick={() => onChange(devResetFingerCooldowns(state))}>Dùng lại hành động</button>
            <button class="chip-btn" disabled={!live || !finger} onClick={() => onChange(devSetGoldenFinger(state, content, null))}>Bỏ Kim Thủ Chỉ</button>
          </div>
        </Section>

        <Section title="Tông môn, gia tộc, người quen">
          <div class="dev-event">
            <Pick value={sectId} onChange={setSectId} label="Tông môn">
              {content.sects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devJoinSect(state, content, sectId))}>Vào tông</button>
          </div>
          {(content.worldEvents ?? []).length > 0 && (
            <div class="dev-event">
              <Pick value={worldEventId} onChange={setWorldEventId} label="Sự kiện thiên hạ">
                {(content.worldEvents ?? []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Pick>
              <button class="chip-btn" disabled={!live} onClick={() => onChange(devWorldEvent(state, content, worldEventId))}>Bắt đầu</button>
              <button class="chip-btn" disabled={!live || !state.world?.active} onClick={() => onChange(devWorldEvent(state, content, null))}>Dừng</button>
            </div>
          )}
          <div class="action-chips">
            <button class="chip-btn" disabled={!live || !!state.ownSect} onClick={() => onChange(devFoundSect(state, content))}>Khai tông miễn phí</button>
            <button class="chip-btn" disabled={!live || !!state.clan} onClick={() => onChange(devFoundClan(state, content))}>Lập gia tộc miễn phí</button>
            <button class="chip-btn" disabled={!live || !!state.pastSect} onClick={() => onChange(devPastSect(state))}>Có tông môn đời trước</button>
            {(content.specialOrigins ?? []).map((o) => (
              <button key={o.id} class="chip-btn" disabled={!live || !!state.special?.ids.includes(o.id)} onClick={() => onChange(devSpecial(state, content, o.id))}>Thiên cơ: {o.name}</button>
            ))}
            <button class="chip-btn" disabled={!live || !state.system || state.system.gone} onClick={() => onChange(devSystemPoints(state, content, 100))}>Hệ thống +100 điểm</button>
            <button class="chip-btn" disabled={!live || !state.system || state.system.gone} onClick={() => onChange(devSystemBetray(state, content))}>Hệ thống phản bội ngay</button>
            <button class="chip-btn" disabled={!live || !state.trungSinh} onClick={() => onChange(devDrift(state, 25))}>Lịch sử lệch +25</button>
            <button class="chip-btn" disabled={!live || !state.trungSinh} onClick={() => onChange(devDrift(state, -100))}>Lịch sử về 0</button>
            {(content.thanDao?.paths ?? []).map((p) => (
              <button key={p.id} class="chip-btn" disabled={!live} onClick={() => onChange(devMerit(state, p.id, 30))}>{p.name} +30</button>
            ))}
            {([['dao_lu', 'Đạo lữ'], ['an', 'Ân nhân'], ['oan', 'Oán'], ['ke_thu', 'Kẻ thù']] as const).map(([k, label]) => (
              <button key={k} class="chip-btn" disabled={!live || (k === 'dao_lu' && state.character.age < 18)} onClick={() => onChange(devPastTie(state, content, k))}>Cố nhân: {label}</button>
            ))}
          </div>
          <div class="dev-event">
            <Pick value={templateId} onChange={setTemplateId} label="Khí vận chi tử">
              {content.chosenOnes.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Pick>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devTakeChosen(state, content, templateId))}>Nhận đồ đệ</button>
          </div>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devMeetNpc(state, content, 'friend'))}>Gặp bằng hữu</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devMeetNpc(state, content, 'enemy'))}>Gặp kẻ thù (oán 40)</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devMeetNpc(state, content, 'debtor'))}>Gặp người mang ơn (ân 40)</button>
          </div>
        </Section>

        <Section title="Người có quan hệ">
          <p class="profile-note">Chọn tên một người thân hoặc người quen rồi chỉnh họ. Người thân không có sổ ân oán, cảnh giới hay tư chất. Mở "Hồ sơ đầy đủ" để xem mọi thứ (cả phần ẩn) và đặt số tùy ý.</p>
          {people.length === 0 ? <p class="profile-note">Chưa có ai.</p> : (
            <>
              <div class="dev-event">
                <GPick value={person?.key ?? ''} onChange={setPersonKey} label="Người có quan hệ" options={people.map((p) => ({ id: p.key, name: p.name, group: p.group }))} />
              </div>
              {person && (
                <>
                  <div class="action-chips">
                    {can('affinity') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'affinity', delta: -20 })}>Thiện cảm −20</button>}
                    {can('affinity') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'affinity', delta: 20 })}>Thiện cảm +20</button>}
                    {can('favor') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'favor', delta: 20 })}>Ân +20</button>}
                    {can('grudge') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'grudge', delta: 20 })}>Oán +20</button>}
                    {can('aptitude') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'aptitude', delta: 10 })}>Tư chất +10</button>}
                    <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'age', delta: -10 })}>Tuổi −10</button>
                    <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'age', delta: 10 })}>Tuổi +10</button>
                    <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'lifespan', delta: 50 })}>Thọ +50</button>
                    <button class="chip-btn" disabled={!live || !person.alive} onClick={() => cheat({ kind: 'alive', on: false })}>Cho chết</button>
                    <button class="chip-btn" disabled={!live || person.alive} onClick={() => cheat({ kind: 'alive', on: true })}>Cho sống lại</button>
                    <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'root', on: true })}>Cho linh căn</button>
                    <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'root', on: false })}>Bỏ linh căn</button>
                    {can('stage') && <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'stage' })}>Lên 1 tầng</button>}
                    {can('remove') && <button class="chip-btn danger" disabled={!live} onClick={() => cheat({ kind: 'remove' })}>Xóa khỏi thế giới</button>}
                  </div>
                  {can('realm') && (
                    <div class="dev-event">
                      <Pick value={personRealm} onChange={setPersonRealm} label="Cảnh giới của người này">
                        {content.cultivation.realms.realms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </Pick>
                      <button class="chip-btn" disabled={!live} onClick={() => cheat({ kind: 'realm', realmId: personRealm })}>Đặt cảnh giới</button>
                    </div>
                  )}
                  <DevPersonSheet key={person.key} state={state} content={content} person={person} live={live} onCheat={(c) => cheat(c)} />
                </>
              )}
            </>
          )}
        </Section>

        <Section title="Phu thê">
          <p class="profile-note">{spouse ? `Bạn đời: ${spouse.name}, thiện cảm ${spouse.affinity}` : 'Chưa có bạn đời.'}</p>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live || !!spouse} onClick={() => onChange(devMarry(state, content), romanceBlocked(state, content) ?? 'Đã có bạn đời.')}>Thành thân ngay</button>
            <button class="chip-btn" disabled={!live || !spouse} onClick={() => onChange(devSpouseAffinity(state, -20))}>Thiện cảm −20</button>
            <button class="chip-btn" disabled={!live || !spouse} onClick={() => onChange(devSpouseAffinity(state, 20))}>Thiện cảm +20</button>
          </div>
        </Section>

        <Section title="Vật phẩm & đánh thử">
          <div class="dev-event">
            <GPick value={itemId} onChange={setItemId} label="Vật phẩm" options={content.items.slice().sort((a, b) => byOrder(KIND_ORDER)(a.kind, b.kind)).map((it) => ({ id: it.id, name: `${it.name} (${state.inventory[it.id] ?? 0})`, group: content.lifeTexts.familyBond.kindNames[it.kind] ?? it.kind }))} />
            <button class="chip-btn" disabled={!live || !itemId} onClick={() => onChange(devGiveItem(state, content, itemId))}>+1</button>
          </div>
          <div class="dev-event">
            <GPick value={techId} onChange={setTechId} label="Công pháp" options={content.techniques.slice().sort((a, b) => byOrder(GRADE_ORDER)(a.grade, b.grade)).map((t) => ({ id: t.id, name: `${t.name}${state.cult.technique === t.id ? ' (đang tu)' : state.cult.learned.includes(t.id) ? ' (đã học)' : ''}`, group: `Công pháp ${content.cultivation.realms.gradeNames[t.grade] ?? t.grade}` }))} />
            <button class="chip-btn" disabled={!live || !techId} onClick={() => onChange(devLearnTechnique(state, content, techId), state.cult.technique === techId ? 'Đang tu công pháp này rồi.' : undefined)}>Học ngay</button>
          </div>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devGiveAllItems(state, content))}>Nhận mọi vật phẩm</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devGiveAllScrolls(state, content))}>Nhận mọi bí tịch</button>
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devResetItemUse(state))}>Xóa kháng thuốc</button>
            <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'below', 'rob'), 'Đang trong một trận đấu.'); onClose(); }}>Đánh kẻ yếu hơn</button>
            <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'same', 'teach')); onClose(); }}>Đánh ngang sức</button>
            <button class="chip-btn" disabled={!live || !!state.combat} onClick={() => { onChange(devStartFight(state, content, 'above', 'kill')); onClose(); }}>Đánh kẻ mạnh hơn</button>
          </div>
        </Section>

        <Section title="Sự kiện & cờ">
          <input class="dev-input" type="search" placeholder="Lọc theo id, tên, loại…" value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} aria-label="Lọc sự kiện" />
          <div class="dev-event">
            <GPick value={picked} onChange={setEventId} label="Sự kiện" options={events.map((ev) => ({ id: ev.id, name: `${ev.title} (${ev.id})`, group: ev.category }))} />
            <button class="chip-btn" disabled={!live || !picked} onClick={() => { onChange(devTriggerEvent(state, content, picked)); onClose(); }}>Gọi</button>
          </div>
          <p class="profile-note">{events.length} sự kiện. Cờ đang bật: {flags.join(', ') || 'không'}</p>
          <div class="dev-event">
            <input class="dev-input" placeholder="tên cờ, vd. biet_truoc" value={flag} onInput={(e) => setFlag((e.target as HTMLInputElement).value)} aria-label="Cờ" />
            <button class="chip-btn" disabled={!live || !flag.trim()} onClick={() => onChange(devSetFlag(state, flag, true))}>Bật</button>
            <button class="chip-btn" disabled={!live || !flag.trim()} onClick={() => onChange(devSetFlag(state, flag, false))}>Tắt</button>
          </div>
          <div class="action-chips">
            <button class="chip-btn" disabled={!live} onClick={() => onChange(devResetEventHistory(state))}>Xóa lịch sử sự kiện</button>
          </div>
        </Section>

        <Section title="Kết thúc đời">
          <p class="profile-note">Chết ngay để thử màn tổng kết, huy hiệu, cáo phó, trùng sinh, quỷ tu.</p>
          <div class="action-chips">
            {DEATHS.map(([cause, label]) => (
              <button class="chip-btn danger" key={cause} disabled={!live} onClick={() => { onChange(devKill(state, content, cause)); onClose(); }}>{label}</button>
            ))}
          </div>
        </Section>

        <Section title="Luân hồi (lưu qua mọi đời)">
          <p class="profile-note">Điểm Luân Hồi {meta.rebirthPoints} · {Object.keys(meta.achievements).length}/{content.achievements.achievements.length} thành tựu · bảo hiểm Kim Thủ Chỉ {meta.fingerPity}/{content.balance.goldenFinger.pityLives}</p>
          <div class="action-chips">
            <button class="chip-btn" onClick={() => onMeta(devMetaPoints(meta, 100))}>+100 điểm</button>
            <button class="chip-btn" onClick={() => onMeta(devMetaPoints(meta, 1000))}>+1000 điểm</button>
            <button class="chip-btn" onClick={() => onMeta(devMetaPoints(meta, -meta.rebirthPoints))}>Về 0 điểm</button>
            <button class="chip-btn" onClick={() => onMeta(devMetaUnlockAll(meta, content))}>Mở hết Thiên Thư & thành tựu</button>
            <button class="chip-btn" onClick={() => onMeta(devMetaFingerPity(meta, content))}>Đời sau chắc có Kim Thủ Chỉ</button>
          </div>
          <div class="dev-event">
            <Pick value={talentId} onChange={setTalentId} label="Thiên phú luân hồi">
              {content.rebirthTalents.talents.map((t) => <option key={t.id} value={t.id}>{t.name} ({meta.rebirthTalents[t.id] ?? 0}/{t.levels.length})</option>)}
            </Pick>
            <button class="chip-btn" disabled={talentLv <= 0} onClick={() => onMeta(devMetaTalent(meta, content, talentId, talentLv - 1))}>−</button>
            <button class="chip-btn" disabled={!talent || talentLv >= talent.levels.length} onClick={() => onMeta(devMetaTalent(meta, content, talentId, talentLv + 1))}>+</button>
          </div>
          <p class="profile-note">Thiên phú luân hồi áp dụng từ đời sau. Thử thách tuần: chọn thử thách bất kỳ ở màn Thử Thách Tuần.</p>
        </Section>
        <Section title="Bảng cân bằng">
          <BalancePanel content={content} />
        </Section>

        <div class="dev-foot">
          <button class="chip-btn danger" onClick={onDisable}>Tắt Developer mode</button>
          <button class="choice" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
