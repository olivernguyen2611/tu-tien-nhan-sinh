// 9.R12 Bảng cân bằng (developer mode): run N simulated lives in a Web Worker and show the spread
// (age, causes, realms, roots, tiên duyên gates, Kim Thủ Chỉ, khí vận, kết cục). A balance patch
// typed here applies to that run only, in memory; balance.json is never written.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { BotProfile, Group, Report } from '../../systems/simulate';
import type { BalanceReply, BalanceRun } from '../balanceWorker';

const CAUSES: Record<string, string> = { old_age: 'Thọ tận', illness: 'Bệnh', combat: 'Tử trận', breakthrough: 'Đột phá thất bại', tribulation: 'Lôi kiếp', ordeal: 'Tai kiếp', calamity: 'Tai ương', stuck: 'Kẹt' };
const PROFILES: [BotProfile, string][] = [['player', 'Như người chơi'], ['steady', 'Chắc chắn'], ['random', 'Ngẫu nhiên']];
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function Bars({ title, rows }: { title: string; rows: [string, number, string?][] }) {
  if (rows.length === 0) return null;
  return (
    <div class="bal-block">
      <p class="kicker">{title}</p>
      <ul class="bal-bars">
        {rows.map(([label, v, note]) => (
          <li key={label}><span>{label}</span><i style={{ width: `${Math.min(100, v * 100)}%` }} /><b>{pct(v)}</b>{note && <small>{note}</small>}</li>
        ))}
      </ul>
    </div>
  );
}

const groupRows = (g: Record<string, Group>, name: (id: string) => string, limit: number): [string, number, string][] =>
  Object.entries(g).sort((a, b) => b[1].share - a[1].share).slice(0, limit)
    .map(([id, x]) => [name(id), x.share, `thọ ${Math.round(x.meanAge)} · Kim Đan ${pct(x.kimDan)}`]);

export function BalancePanel({ content }: { content: Content }) {
  const [count, setCount] = useState(50);
  const [profile, setProfile] = useState<BotProfile>('player');
  const [firstLife, setFirstLife] = useState(false);
  const [patch, setPatch] = useState('');
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);

  const run = () => {
    let parsed: unknown = {};
    if (patch.trim()) {
      try { parsed = JSON.parse(patch); } catch { setError('Bản chỉnh balance không phải JSON hợp lệ.'); return; }
    }
    worker.current?.terminate();
    const w = new Worker(new URL('../balanceWorker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setError(null); setReport(null); setProgress([0, count]);
    w.onmessage = (e: MessageEvent<BalanceReply>) => {
      const m = e.data;
      if (m.kind === 'progress') setProgress([m.done, m.total]);
      else {
        if (m.kind === 'done') setReport(m.report); else setError(m.text);
        setProgress(null); w.terminate(); worker.current = null;
      }
    };
    w.postMessage({ count, profile, firstLife, patch: parsed, seed: `bal${Date.now() % 100000}` } satisfies BalanceRun);
  };
  const stop = () => { worker.current?.terminate(); worker.current = null; setProgress(null); };

  const realms = content.cultivation.realms.realms;
  const name = (list: { id: string; name: string }[] | undefined) => (id: string) => list?.find((x) => x.id === id)?.name ?? id;
  return (
    <div class="balance-panel">
      <p class="profile-note">Chạy thử nhiều đời bằng máy ngay trong trình duyệt. Bản chỉnh balance chỉ dùng cho lần chạy này, không ghi vào game.</p>
      <div class="action-chips">
        <select aria-label="Số đời" value={String(count)} onChange={(e) => setCount(Number((e.target as HTMLSelectElement).value))}>
          {[20, 50, 100, 200].map((n) => <option key={n} value={String(n)}>{n} đời</option>)}
        </select>
        <select aria-label="Cách chơi của máy" value={profile} onChange={(e) => setProfile((e.target as HTMLSelectElement).value as BotProfile)}>
          {PROFILES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}
        </select>
        <label class="bal-check"><input type="checkbox" checked={firstLife} onChange={() => setFirstLife(!firstLife)} /> Kiếp đầu</label>
      </div>
      <textarea class="bal-patch" rows={3} placeholder='Chỉnh balance tạm, ví dụ {"karmaLedger": {"chance": 0.1}}' value={patch} onInput={(e) => setPatch((e.target as HTMLTextAreaElement).value)} />
      <div class="action-chips">
        {progress ? <button class="chip-btn danger" onClick={stop}>Dừng ({progress[0]}/{progress[1]})</button> : <button class="chip-btn" onClick={run}>Chạy mô phỏng</button>}
      </div>
      {error && <p class="action-result bad" role="status">{error}</p>}
      {report && (
        <div class="bal-report">
          <p class="story">{report.count} đời{report.stuck > 0 ? ` (${report.stuck} kẹt)` : ''}. Tuổi chết: trung bình {Math.round(report.age.mean)}, p10 {report.age.p10}, trung vị {report.age.p50}, p90 {report.age.p90}, cao nhất {report.age.max}.</p>
          <Bars title="Từng đạt cảnh giới" rows={realms.map((r) => [r.name, report.reached[r.id] ?? 0, report.reachedAge[r.id] ? `tuổi TB ${Math.round(report.reachedAge[r.id])}` : undefined])} />
          <Bars title="Nguyên nhân chết" rows={Object.entries(report.byCause).sort((a, b) => b[1] - a[1]).map(([c, k]) => [CAUSES[c] ?? c, k / report.count])} />
          <Bars title="Theo linh căn" rows={Object.entries(report.byRoot).sort((a, b) => b[1].share - a[1].share).map(([g, x]) => [g, x.share, `thọ ${Math.round(x.meanAge)} · Kim Đan ${pct(x.kimDan)}`])} />
          <Bars title="Cổng tiên duyên mở" rows={Object.entries(report.byGate).sort((a, b) => b[1] - a[1]).map(([g, v]) => [name(content.immortalGates)(g), v])} />
          <Bars title="Kim Thủ Chỉ" rows={groupRows(report.byFinger, name(content.goldenFingers.fingers), 10)} />
          <Bars title="Khí vận gặp nhiều nhất" rows={groupRows(report.byTrait, name(content.traits), 10)} />
          <Bars title={`Thiên cơ biến động (${pct(report.specialAny)} số đời)`} rows={groupRows(report.bySpecial, name(content.specialOrigins), 10)} />
          <Bars title="Kết cục" rows={Object.entries(report.byEnding).sort((a, b) => b[1] - a[1]).map(([id, v]) => [name(content.endings)(id), v])} />
        </div>
      )}
    </div>
  );
}
