// npm run simulate -- --count 500 --profile both --difficulty normal --seed sim
// Chạy hàng loạt đời giả lập để xem cân bằng (tuổi chết, cảnh giới, nguyên nhân chết, linh căn).
// Dùng vite-node vì game nạp nội dung bằng import.meta.glob của Vite.
import { loadContent } from '../src/core/content';
import { BOT_PROFILES, formatReport, simulateMany, type BotProfile } from '../src/systems/simulate';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const count = Math.max(1, Number(arg('count', '200')) || 200);
const prefix = arg('seed', 'sim');
const difficulty = arg('difficulty', '');
const which = arg('profile', 'both');
const profiles: BotProfile[] = which === 'both' ? BOT_PROFILES : BOT_PROFILES.filter((p) => p === which);
if (profiles.length === 0) {
  console.error(`--profile phải là ${BOT_PROFILES.join(' | ')} | both`);
  process.exit(1);
}

const content = loadContent();
for (const profile of profiles) {
  const started = Date.now();
  const { report } = simulateMany(content, count, prefix, { profile, difficulty: difficulty || undefined });
  console.log(formatReport(report, content, `${profile} · ${difficulty || content.balance.defaultDifficulty}`));
  console.log(`(${((Date.now() - started) / 1000).toFixed(1)}s)\n`);
}
