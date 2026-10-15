// "Tông môn" sheet: membership, rank and contribution, yearly mission, sect
// techniques, asking for a master; or the list of sects to apply to.
import { Fold } from './Fold';
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import {
  currentSect, masterBlocked, masterChance, missionViews, nextRankNeed, sectEligibility, sectTechniques,
} from '../../systems/sect';
import { merit, treasuryViews } from '../../systems/sectTreasury';
import { chainViews } from '../../systems/sectChains';
import { sectmateViews, tournamentViews } from '../../systems/sectmates';
import { learnBlocked, techniqueById } from '../../systems/technique';
import { TermText } from './Tooltip';
import { OwnSectSection } from './OwnSectSection';

export type SectAction =
  | { kind: 'join'; sectId: string }
  | { kind: 'mission'; missionId: string }
  | { kind: 'learn'; techniqueId: string }
  | { kind: 'master' }
  | { kind: 'talk'; npcId: string; talkId: string }
  | { kind: 'tournament'; id: string }
  | { kind: 'chain'; id: string; start: boolean }
  | { kind: 'buy'; id: string }
  | { kind: 'leave' }
  | { kind: 'found'; name: string; rules: string[] }
  | { kind: 'decide'; decisionId: string }
  | { kind: 'build'; buildingId: string }
  | { kind: 'donate' }
  | { kind: 'elder'; npcId: string }
  | { kind: 'recruit'; npcId: string };

export function SectPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  /** Returns the log text to show, or null when nothing happened. */
  onAction: (action: SectAction) => { text: string; good: boolean } | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ text: string; good: boolean } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const sect = currentSect(state, content);
  const act = (a: SectAction) => setResult(onAction(a));
  const realmName = (id: string) => content.cultivation.realms.realms.find((r) => r.id === id);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tông môn" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Tông môn</div>
        {state.ownSect ? null : sect ? (
          <>
            <h2>{sect.name}</h2>
            <p class="profile-note"><TermText text={sect.description} /></p>
            <p class="story">Đệ tử {sect.ranks[state.sect.rank]} · cống hiến {state.sect.contribution}{state.sect.master ? ` · sư phụ: ${state.sect.master}` : ''}</p>
            {(() => {
              const need = nextRankNeed(state, content);
              if (!need) return state.sect.rank === 0 ? null : <p class="profile-note">Đã ở cấp cao nhất.</p>;
              const r = realmName(need.realm);
              return (
                <p class="profile-note">
                  Lên {sect.ranks[state.sect.rank + 1]}: cống hiến {need.contribution}, tu vi {r?.name} {r?.stages[need.stage]}.
                </p>
              );
            })()}
            {state.sect.rank === 0 && <p class="profile-note">Ký danh một năm thì thành đệ tử chính thức.</p>}
            <p class="profile-note">Nghĩa vụ: {sect.duty}</p>

            <Fold id="sect:Nhiệm vụ tông môn" title="Nhiệm vụ tông môn" count={missionViews(state, content).length}>
                <p class="profile-note">Bảng nhiệm vụ đổi mỗi năm, lên cấp thì có việc lớn hơn. Mỗi năm nhận được một việc.</p>
                {missionViews(state, content).map((m) => (
                  <div class="career-row" key={m.id}>
                    <div class="craft-head"><b>{m.name}</b><span class="muted">{Math.round(m.chance * 100)}%</span></div>
                    <p class="profile-note">{m.text}</p>
                    <button class="chip-btn" disabled={!!m.blocked} onClick={() => act({ kind: 'mission', missionId: m.id })}>Nhận việc</button>
                    {m.blocked && <span class="craft-note">{m.blocked}</span>}
                  </div>
                ))}
            </Fold>

            {chainViews(state, content).length > 0 && (
              <Fold id="sect:Chuỗi nhiệm vụ" title="Chuỗi nhiệm vụ">
                  <p class="profile-note">Việc dài nhiều bước, mỗi năm làm một bước (tính vào nhiệm vụ của năm). Hỏng hai bước thì bị rút lại.</p>
                  {chainViews(state, content).map((c) => (
                    <div class="career-row" key={c.id}>
                      <div class="craft-head"><b>{c.name}</b><span class="muted">{c.active ? `bước ${c.step + 1}/${c.steps} · ${Math.round((c.chance ?? 0) * 100)}%` : `${c.steps} bước`}</span></div>
                      <p class="profile-note">{c.text}</p>
                      <button class="chip-btn" disabled={!!c.blocked} onClick={() => act({ kind: 'chain', id: c.id, start: !c.active })}>{c.active ? 'Làm bước này' : 'Nhận chuỗi'}</button>
                      {c.blocked && <span class="craft-note">{c.blocked}</span>}
                    </div>
                  ))}
              </Fold>
            )}

            <Fold id="sect:Bảo khố" title="Bảo khố" count={treasuryViews(state, content).length}>
                <p class="profile-note">Cống hiến còn dùng được: {merit(state)} (đổi đồ không làm tụt cấp bậc).</p>
                {treasuryViews(state, content).map((t) => (
                  <div class="career-row" key={t.id}>
                    <div class="craft-head"><b>{t.name}</b><span class="muted">{t.cost} cống hiến · còn {t.left}</span></div>
                    <p class="profile-note">{t.text}</p>
                    <button class="chip-btn" disabled={!!t.blocked} onClick={() => act({ kind: 'buy', id: t.id })}>Đổi</button>
                    {t.blocked && <span class="craft-note">{t.blocked}</span>}
                  </div>
                ))}
            </Fold>

            <Fold id="sect:techniques" title={<><TermText text="Công pháp" /> của tông môn</>}>
                {sectTechniques(state, content).map((t) => {
                  const tech = techniqueById(content, t.id);
                  if (!tech) return null;
                  const current = state.cult.technique === t.id;
                  const blocked = current ? 'Đang tu.' : !t.open ? `Cần là đệ tử ${sect.ranks[t.rank]}.` : learnBlocked(state, content, tech);
                  return (
                    <div class="career-row" key={t.id}>
                      <div class="craft-head"><b>{tech.name}</b><span class="muted">{content.cultivation.realms.gradeNames[tech.grade]} phẩm</span></div>
                      <p class="profile-note"><TermText text={tech.flavor} /></p>
                      <button class="chip-btn" disabled={!!blocked} onClick={() => act({ kind: 'learn', techniqueId: t.id })}>
                        {state.cult.technique ? 'Đổi sang tu' : 'Học'}
                      </button>
                      {blocked && <span class="craft-note">{blocked}</span>}
                      {!blocked && state.cult.technique && <span class="craft-note">Đổi công pháp mất {content.balance.techniques.switchLossPct}% thanh tu vi.</span>}
                    </div>
                  );
                })}
            </Fold>

            <Fold id="sect:Sư phụ" title="Sư phụ">
                {state.sect.master ? <p class="story">{state.sect.master}</p> : (
                  <>
                    <button class="chip-btn" disabled={!!masterBlocked(state, content)} onClick={() => act({ kind: 'master' })}>
                      Xin bái sư · {Math.round(masterChance(state, content) * 100)}%
                    </button>
                    {masterBlocked(state, content) && <span class="craft-note">{masterBlocked(state, content)}</span>}
                  </>
                )}
            </Fold>

            {tournamentViews(state, content).filter((t) => !t.blocked || t.blocked === 'Năm nay đã dự rồi.').map((t) => (
              <div class="crafts" key={t.id}>
                <h3 class="panel-sub">{t.name}</h3>
                <p class="profile-note">{t.text}</p>
                <button class="chip-btn" disabled={!!t.blocked} onClick={() => act({ kind: 'tournament', id: t.id })}>Ghi danh</button>
                {t.blocked && <span class="craft-note">{t.blocked}</span>}
                {t.best !== null && <span class="craft-note">Thành tích tốt nhất: thắng {t.best} trận.</span>}
              </div>
            ))}

            <Fold id="sect:Đồng môn" title="Đồng môn" count={sectmateViews(state, content).length}>
                <p class="profile-note">Mỗi năm đi lại được vài người, mỗi người một lần. Thân thiết thì mới được chỉ điểm.</p>
                {sectmateViews(state, content).map((v) => (
                  <div class="career-row" key={v.npc.id}>
                    <div class="craft-head"><b>{v.title} {v.npc.name}</b><span class="muted">thiện cảm {v.npc.affinity}</span></div>
                    <p class="profile-note">{v.npc.age} tuổi · {content.cultivation.realms.realms.find((r) => r.id === v.npc.realm)?.name}</p>
                    {v.talks.map((t) => (
                      <div key={t.id}>
                        <button class="chip-btn" disabled={!!t.blocked} title={t.text} onClick={() => act({ kind: 'talk', npcId: v.npc.id, talkId: t.id })}>
                          {t.name} · {Math.round(t.chance * 100)}%
                        </button>
                        {t.blocked && <span class="craft-note">{t.blocked}</span>}
                      </div>
                    ))}
                  </div>
                ))}
            </Fold>

            {leaving ? (
              <>
                <p class="profile-note">Rời đi thì mất cấp bậc, cống hiến, sư phụ, và không được quay lại {sect.name}.</p>
                <button class="choice" onClick={() => { setLeaving(false); act({ kind: 'leave' }); }}>Rời tông môn</button>
                <button class="choice" onClick={() => setLeaving(false)}>Ở lại</button>
              </>
            ) : (
              <button class="link-btn" onClick={() => setLeaving(true)}>Rời tông môn…</button>
            )}
          </>
        ) : (
          <>
            <h2>Chưa có tông môn</h2>
            <p class="profile-note">Có linh căn thì có thể lên núi xin bái nhập. Không linh căn mà Đạo tâm vững, cửa chùa vẫn mở.</p>
            {content.sects.filter((s) => s.recruitable).map((s) => {
              const reason = sectEligibility(state, content, s.id);
              return (
                <div class="career-row" key={s.id}>
                  <div class="craft-head"><b>{s.name}</b><span class="muted">{content.cultivation.realms.lineageNames[s.lineage]}</span></div>
                  <p class="profile-note"><TermText text={s.description} /></p>
                  <button class="chip-btn" disabled={!!reason} onClick={() => act({ kind: 'join', sectId: s.id })}>Xin bái nhập</button>
                  {reason && <span class="craft-note">{reason.charAt(0).toUpperCase() + reason.slice(1)}.</span>}
                </div>
              );
            })}
          </>
        )}

        <OwnSectSection state={state} content={content} onFound={(name, rules) => act({ kind: 'found', name, rules })}
          onDecide={(decisionId) => act({ kind: 'decide', decisionId })} onBuild={(buildingId) => act({ kind: 'build', buildingId })} onDonate={() => act({ kind: 'donate' })} onElder={(npcId) => act({ kind: 'elder', npcId })} onRecruit={(npcId) => act({ kind: 'recruit', npcId })} />

        {result && <p class={`action-result ${result.good ? 'good' : 'bad'}`}>{result.text}</p>}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
