// Thiên Thư (task 5b.4): what every life has seen, kept across lives. Display only.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import { codexProgress, storyText, type Codex } from '../../systems/codex';
import { TermText } from '../components/Tooltip';

type Tab = 'traits' | 'combos' | 'fingers' | 'stories';

const RARITY_LABEL: Record<string, string> = {
  pham: 'Phàm', luong: 'Lương', uu: 'Ưu', tuyet: 'Tuyệt', thien: 'Thiên', than: 'Thần', ac: 'Ác vận',
};

export function CodexScreen({ content, codex, onBack }: { content: Content; codex: Codex; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('traits');
  const p = codexProgress(codex, content);
  const tabs: [Tab, string][] = [
    ['traits', `Khí vận ${p.traits[0]}/${p.traits[1]}`],
    ['combos', `Tổ hợp ${p.combos[0]}/${p.combos[1]}`],
    ['fingers', `Kim Thủ Chỉ ${p.fingers[0]}/${p.fingers[1]}`],
    ['stories', `Truyện ${codex.stories.length}`],
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
