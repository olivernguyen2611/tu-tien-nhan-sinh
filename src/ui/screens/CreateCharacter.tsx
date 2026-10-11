// New-life screen: pick a name, gender and origin, or leave them to fate.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import { Rng } from '../../core/rng';
import { randomName, type NewLifeInput } from '../../core/state';
import type { Gender } from '../../core/types';

function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function CreateCharacterScreen({ content, onCreate, onBack }: {
  content: Content;
  onCreate: (input: NewLifeInput) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [originId, setOriginId] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState(content.balance.defaultDifficulty);
  const chosen = content.difficulties.find((d) => d.id === difficulty);

  const rollName = () => {
    // A rolled name fits one gender, so "Trời định" settles on that gender.
    const rng = new Rng(newSeed());
    const g: Gender = gender ?? (rng.chance(0.5) ? 'nam' : 'nu');
    setGender(g);
    setName(randomName(rng, content, g));
  };

  return (
    <main class="create-screen">
      <header class="create-head">
        <button class="icon-btn" onClick={onBack} aria-label="Quay lại">‹</button>
        <h1>Một kiếp mới</h1>
      </header>

      <section class="field">
        <label for="name">Danh tính</label>
        <div class="name-row">
          <input id="name" type="text" maxLength={24} placeholder="Để trống: trời đặt tên" value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          <button class="icon-btn" onClick={rollName} title="Tên ngẫu nhiên" aria-label="Tên ngẫu nhiên">卜</button>
        </div>
      </section>

      <section class="field">
        <span class="field-label">Giới tính</span>
        <div class="segmented" role="radiogroup" aria-label="Giới tính">
          {([['nam', 'Nam'], ['nu', 'Nữ'], [undefined, 'Trời định']] as const).map(([v, label]) => (
            <button role="radio" aria-checked={gender === v} class={gender === v ? 'on' : ''} onClick={() => setGender(v)}>{label}</button>
          ))}
        </div>
      </section>

      <section class="field">
        <span class="field-label">Độ khó</span>
        <div class="segmented" role="radiogroup" aria-label="Độ khó">
          {content.difficulties.map((d) => (
            <button role="radio" key={d.id} aria-checked={difficulty === d.id} class={difficulty === d.id ? 'on' : ''} onClick={() => setDifficulty(d.id)}>{d.name}</button>
          ))}
        </div>
        {chosen && <p class="field-hint">{chosen.description}</p>}
      </section>

      <section class="field">
        <span class="field-label">Xuất thân</span>
        <div class="origin-list" role="radiogroup" aria-label="Xuất thân">
          <button role="radio" aria-checked={originId === undefined} class={`origin${originId === undefined ? ' on' : ''}`} onClick={() => setOriginId(undefined)}>
            <b>Để trời định</b>
            <span>Đầu thai ngẫu nhiên, nhà nông thì nhiều, thế gia thì hiếm.</span>
          </button>
          {content.origins.map((o) => (
            <button role="radio" aria-checked={originId === o.id} class={`origin${originId === o.id ? ' on' : ''}`} key={o.id} onClick={() => setOriginId(o.id)}>
              <b>{o.name}</b>
              <span>{o.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div class="create-action">
        <button class="btn-primary" onClick={() => onCreate({ seed: newSeed(), name, gender, originId, difficulty })}>Đầu thai</button>
      </div>
    </main>
  );
}
