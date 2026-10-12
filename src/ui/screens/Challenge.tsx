// Thử thách tuần (task 5b.6): this week's challenge, its rules and the player's record. Display only.
import type { Content } from '../../core/content';
import type { ChallengeFile } from '../../core/schemas';

export function ChallengeScreen({ content, week, challenge, record, onStart, onBack, devPick }: {
  content: Content;
  week: string;
  challenge: ChallengeFile[number] | null;
  record: { tries: number; best: number; done: boolean } | undefined;
  onStart: () => void;
  onBack: () => void;
  /** Developer mode: try any challenge of the world. */
  devPick?: ((id: string) => void) | null;
}) {
  const origin = content.origins.find((o) => o.id === challenge?.rules.origin);
  const difficulty = content.difficulties.find((d) => d.id === challenge?.rules.difficulty);
  const traits = (challenge?.rules.traits ?? []).map((id) => content.traits.find((t) => t.id === id)?.name ?? id);
  return (
    <main class="create-screen challenge-screen">
      <header class="create-head">
        <button class="icon-btn" onClick={onBack} aria-label="Quay lại">‹</button>
        <h1>Thử Thách Tuần</h1>
      </header>
      {!challenge ? (
        <p class="destiny-intro">Thế giới này chưa có thử thách nào.</p>
      ) : (
        <>
          <p class="kicker">Tuần {week.replace('-W', ' · tuần ')}</p>
          {devPick && (
            <select class="dev-input" value={challenge.id} aria-label="Dev: chọn thử thách" onChange={(e) => devPick((e.target as HTMLSelectElement).value)}>
              {content.challenges.map((c) => <option key={c.id} value={c.id}>[Dev] {c.name}</option>)}
            </select>
          )}
          <div class="golden-finger-card">
            <b>{challenge.name}</b>
            <p class="trait-flavor">{challenge.text}</p>
            <p class="trait-summary"><b>Mục tiêu:</b> {challenge.goalText}</p>
            <ul class="challenge-rules">
              <li>Ai cũng sinh ra giống nhau trong tuần này (cùng hạt giống).</li>
              {origin && <li>Xuất thân: {origin.name}.</li>}
              {difficulty && <li>Độ khó: {difficulty.name}.</li>}
              {traits.length > 0 && <li>Khí vận định sẵn: {traits.join(', ')}.</li>}
              <li>{challenge.rules.rerolls ? `${challenge.rules.rerolls} lượt bốc lại mệnh.` : 'Không được bốc lại mệnh.'}</li>
              <li>Không mang theo thiên phú luân hồi, Phúc báo hay Kim Thủ Chỉ.</li>
            </ul>
          </div>
          <p class="destiny-intro">
            {record ? <>Đã thử {record.tries} lần · điểm cao nhất {record.best} · {record.done ? 'đã đạt mục tiêu' : 'chưa đạt mục tiêu'}.</> : 'Tuần này ngươi chưa thử.'}
          </p>
          <div class="create-action">
            <button class="btn-primary" onClick={onStart}>Nhận thử thách</button>
          </div>
        </>
      )}
    </main>
  );
}
