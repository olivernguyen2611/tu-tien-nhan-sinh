// "Gia đạo" tab (backlog 2): luận bàn, luận đạo, truyền công pháp and tặng vật phẩm with children and
// the đạo lữ. All rules are in systems/familyBond; this only shows and sends the choice.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { bondViews, type BondAction, type BondTarget } from '../../systems/familyBond';
import { GroupedSelect } from './GroupedSelect';

type Result = { text: string; tone: Tone; changes: string };

export function BondSection({ state, content, onBond }: {
  state: GameState;
  content: Content;
  onBond: (target: BondTarget, action: BondAction, arg?: string) => Result;
}) {
  const views = bondViews(state, content);
  // Chosen technique or item per person and action.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [result, setResult] = useState<(Result & { key: string }) | null>(null);
  if (views.length === 0) {
    return <p class="story">Chưa có con cái hay đạo lữ để cùng luận bàn, luận đạo. Gia đạo mở ra khi ngươi có người thân đồng hành.</p>;
  }
  return (
    <>
      <p class="profile-note">Luận bàn, luận đạo, truyền công pháp, tặng vật phẩm cho con cái và đạo lữ. Mỗi việc làm được một lần mỗi năm với mỗi người.</p>
      <ul class="family-list">
        {views.map((v) => (
          <li class="relative" key={v.key}>
            <div class="relative-head">
              <span class="relation">{v.label}</span>
              <b>{v.name}</b>
              <span class="relative-age">{v.age} tuổi</span>
            </div>
            {v.note && <p class="profile-note npc-line">{v.note}</p>}
            {v.actions.map((a) => {
              const pk = `${v.key}:${a.id}`;
              const chosen = a.options?.some((o) => o.id === picked[pk]) ? picked[pk] : a.options?.[0]?.id ?? '';
              const needsPick = a.options !== null;
              const empty = needsPick && a.options!.length === 0;
              return (
                <div class="bond-row" key={a.id}>
                  {needsPick && !empty && (
                    <GroupedSelect value={chosen} onChange={(id) => setPicked({ ...picked, [pk]: id })} label={`${a.name} cho ${v.name}`}
                      options={a.options!} />
                  )}
                  <button class="chip-btn" disabled={!!a.blocked || empty} title={a.blocked ?? undefined}
                    onClick={() => setResult({ key: v.key, ...onBond(v.target, a.id, needsPick ? chosen : undefined) })}>
                    {a.name}
                  </button>
                  {a.blocked && <span class="craft-note">{a.blocked}</span>}
                  {!a.blocked && empty && <span class="craft-note">{a.id === 'teach' ? 'Chưa học công pháp nào.' : 'Túi trống.'}</span>}
                </div>
              );
            })}
            {result?.key === v.key && result.text && (
              <p class={`action-result ${result.tone}`}>
                {result.text}
                {result.changes && <span class="changes">{result.changes}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
