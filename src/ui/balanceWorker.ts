// 9.R12 Bảng cân bằng: runs simulated lives off the main thread so the page stays responsive.
// Only glue: the lives, the report and the balance patch all come from systems/simulate.
import { loadContent } from '../core/content';
import { simulateLife, summarize, withBalancePatch, type BotProfile, type LifeResult, type Report } from '../systems/simulate';

export interface BalanceRun { count: number; profile: BotProfile; firstLife: boolean; patch: unknown; seed: string }
export type BalanceReply = { kind: 'progress'; done: number; total: number } | { kind: 'done'; report: Report } | { kind: 'error'; text: string };

const base = loadContent();

self.onmessage = (e: MessageEvent<BalanceRun>) => {
  const run = e.data;
  const { content, error } = withBalancePatch(base, run.patch);
  if (error) { self.postMessage({ kind: 'error', text: error } satisfies BalanceReply); return; }
  const results: LifeResult[] = [];
  try {
    for (let i = 0; i < run.count; i++) {
      results.push(simulateLife(content, `${run.seed}-${i}`, { profile: run.profile, knowledge: run.firstLife ? 'none' : 'all' }));
      if (i % 5 === 4) self.postMessage({ kind: 'progress', done: i + 1, total: run.count } satisfies BalanceReply);
    }
    self.postMessage({ kind: 'done', report: summarize(results, content) } satisfies BalanceReply);
  } catch (err) {
    self.postMessage({ kind: 'error', text: String(err) } satisfies BalanceReply);
  }
};
