// Thiên Thư (task 5b.4): what every life has seen, kept across lives. Display only.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import { chronicleStats, type Chronicle } from '../../systems/chronicle';
import { codexProgress, storyText, type Codex } from '../../systems/codex';
import { knowledgeByGroup } from '../../systems/knowledge';
import { TermText } from '../components/Tooltip';

type Tab = 'lives' | 'endings' | 'regions' | 'special' | 'knowledge' | 'traits' | 'combos' | 'fingers' | 'stories' | 'achievements';

/** 9.R5a: Sổ tri thức groups. */
const GROUP_LABEL: Record<string, string> = {
  tien_dao: 'Tiên đạo', vo_dao: 'Võ đạo', the_gioi: 'Thế giới', the_luc: 'Thế lực', nhan_vat: 'Nhân vật', cong_phap: 'Công pháp, bảo vật', bi_canh: 'Bí cảnh',
};

const RARITY_LABEL: Record<string, string> = {
  pham: 'Phàm', luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần', ac: 'Ác vận',
};

export function CodexScreen({ content, codex, achievements, chronicle, onBack }: {
  content: Content;
  codex: Codex;
  /** Task 5b.5: thành tựu held → the life that earned it. */
  achievements: Record<string, { name: string; life: number }>;
  /** 9.R8: Sổ luân hồi. */
  chronicle: Chronicle;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>('lives');
  const p = codexProgress(codex, content);
  const cs = chronicleStats(chronicle, content);
  const endings = content.endings ?? [];
  const origins = content.specialOrigins ?? [];
  const tabs: [Tab, string][] = [
    ['lives', `Các kiếp ${cs.lives}`],
    ['endings', `Kết cục ${cs.endings[0]}/${cs.endings[1]}`],
    ['regions', `Bản đồ ${cs.regions[0]}/${cs.regions[1]}`],
    ['special', `Thiên cơ ${origins.filter((o) => (chronicle.special?.[o.id] ?? 0) > 0).length}/${origins.length}`],
    ['knowledge', `Tri thức ${p.knowledge[0]}/${p.knowledge[1]}`],
    ['traits', `Khí vận ${p.traits[0]}/${p.traits[1]}`],
    ['combos', `Tổ hợp ${p.combos[0]}/${p.combos[1]}`],
    ['fingers', `Kim Thủ Chỉ ${p.fingers[0]}/${p.fingers[1]}`],
    ['stories', `Truyện ${codex.stories.length}`],
    ['achievements', `Thành tựu ${content.achievements.achievements.filter((a) => a.id in achievements).length}/${content.achievements.achievements.length}`],
  ];
  return (
    <main class="create-screen codex-screen">
      <header class="create-head">
        <button class="icon-btn" onClick={onBack} aria-label="Quay lại">‹</button>
        <h1>Thiên Thư</h1>
      </header>
      <p class="destiny-intro">{content.codex.intro}</p>
      <div class="tabs codex-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button role="tab" key={id} class={`tab${tab === id ? ' on' : ''}`} aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'knowledge' && knowledgeByGroup(codex.knowledge, content).map(({ group, entries }) => (
        <section key={group}>
          <h3>{GROUP_LABEL[group] ?? group} {entries.filter((e) => e.known).length}/{entries.length}</h3>
          <ul class="trait-chips codex-list">
            {entries.map(({ entry, known }) => known ? (
              <li class="trait-chip r-uu" key={entry.id}><b>{entry.name}</b><span>{entry.text}</span></li>
            ) : (
              <li class="trait-chip unknown" key={entry.id}><b>???</b><span>Chưa từng nghe tới.</span></li>
            ))}
          </ul>
        </section>
      ))}

      {tab === 'traits' && (
        <ul class="trait-chips codex-list">
          {content.traits.map((t) => codex.traits.includes(t.id) ? (
            <li class={`trait-chip r-${t.rarity}`} key={t.id}><b>{t.name} · {RARITY_LABEL[t.rarity]}</b><span><TermText text={t.summary} /></span></li>
          ) : (
            <li class={`trait-chip r-${t.rarity} unknown`} key={t.id}><b>??? · {RARITY_LABEL[t.rarity]}</b><span>Chưa từng mang.</span></li>
          ))}
        </ul>
      )}

      {tab === 'combos' && (
        <ul class="trait-chips codex-list">
          {content.traitCombos.combos.map((c) => codex.combos.includes(c.id) ? (
            <li class="trait-chip r-thien" key={c.id}>
              <b>{c.name}</b>
              <span>{c.traits.map((id) => content.traits.find((t) => t.id === id)?.name ?? id).join(' + ')}</span>
              <span><TermText text={c.summary} /></span>
            </li>
          ) : (
            <li class="trait-chip unknown" key={c.id}><b>Tổ hợp ẩn ???</b><span>Cần {c.traits.length} khí vận nhất định cùng lúc.</span></li>
          ))}
        </ul>
      )}

      {tab === 'fingers' && (
        <ul class="trait-chips codex-list">
          {content.goldenFingers.fingers.map((f) => codex.fingers.includes(f.id) ? (
            <li class="trait-chip r-than" key={f.id}><b>{f.name}</b><span>{f.flavor}</span><span><TermText text={f.summary} /></span></li>
          ) : (
            <li class="trait-chip unknown" key={f.id}><b>Kim Thủ Chỉ ???</b><span>Chưa từng có.</span></li>
          ))}
        </ul>
      )}

      {tab === 'achievements' && (
        <ul class="trait-chips codex-list">
          {content.achievements.achievements.map((a) => {
            const got = achievements[a.id];
            if (!got && a.hidden) return <li class="trait-chip unknown" key={a.id}><b>Thành tựu ẩn ???</b><span>Tự khám phá.</span></li>;
            return (
              <li class={`trait-chip${got ? ' r-tuyet' : ' unknown'}`} key={a.id}>
                <b>{a.name}</b>
                <span>{a.text}{a.unlockFinger && ' Mở khóa một Kim Thủ Chỉ.'}</span>
                {got && <span>Đạt ở kiếp thứ {got.life}: {got.name}.</span>}
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'lives' && (chronicle.lives.length === 0 ? (
        <p class="story">Sổ luân hồi còn trống. Hết một kiếp mới ghi được một dòng.</p>
      ) : (
        <>
          <p class="story">Đã ghi {cs.lives} kiếp · thọ cao nhất {cs.longest} tuổi · bình quân {cs.meanAge} tuổi · tổng {cs.points} điểm luân hồi.</p>
          <ul class="trait-chips codex-list">
            {chronicle.lives.slice().reverse().map((l) => (
              <li class="trait-chip r-luong" key={l.key}>
                <b>Kiếp {l.life} · {l.name}</b>
                <span>{l.age} tuổi · {l.realm} · {l.path}</span>
                <span>{endings.find((e) => e.id === l.ending)?.name ?? 'Không rõ kết cục'} · {l.points} điểm</span>
              </li>
            ))}
          </ul>
        </>
      ))}

      {tab === 'endings' && (
        <ul class="trait-chips codex-list">
          {endings.map((e) => {
            const seen = chronicle.endings.includes(e.id);
            return (
              <li class={`trait-chip ${seen ? 'r-uu' : 'r-pham locked'}`} key={e.id}>
                <b>{seen ? e.name : '???'}</b>
                <span>{seen ? e.text : 'Chưa kiếp nào đi tới kết cục này.'}</span>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'regions' && (
        <ul class="trait-chips codex-list">
          {content.regions.map((r) => {
            const seen = chronicle.regions.includes(r.id);
            return (
              <li class={`trait-chip ${seen ? 'r-luong' : 'r-pham locked'}`} key={r.id}>
                <b>{seen ? r.name : '???'}</b>
                <span>{seen ? r.description : 'Chưa kiếp nào đặt chân tới.'}</span>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'special' && (
        <ul class="trait-chips codex-list">
          {origins.map((o) => {
            const n = chronicle.special?.[o.id] ?? 0;
            return (
              <li class={`trait-chip ${n > 0 ? 'r-thien' : 'r-pham locked'}`} key={o.id}>
                <b>{n > 0 ? `${o.name} · ${n} kiếp` : '???'}</b>
                <span>{n > 0 ? o.text : 'Thiên cơ chưa từng lệch theo hướng này.'}</span>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'stories' && (codex.stories.length === 0 ? (
        <p class="story">Chưa chứng kiến câu chuyện nào của khí vận chi tử.</p>
      ) : (
        <ul class="trait-chips codex-list">
          {codex.stories.slice().reverse().map((s) => (
            <li class="trait-chip r-tuyet" key={s.life}>
              <b>{content.chosenOnes.templates.find((t) => t.id === s.template)?.name ?? s.template} · {s.npc}</b>
              <span>{storyText(s, content)}</span>
            </li>
          ))}
        </ul>
      ))}
    </main>
  );
}
