// npm run simulate -- --count 500 --profile both --difficulty normal --seed sim   (both = mọi hồ sơ: random, steady, player, full = "sống đủ")
// 15.12: --profile class = tám persona theo giai cấp (gc_hoang_toc … gc_tu_gia).
// 9.8: --profile mortal = sáu persona phàm nhân (nong_dan, thu_sinh, thuong_nhan, ke_cuop, hiep_khach, ke_luoi), in thêm một bảng so sánh.
// Chạy hàng loạt đời giả lập để xem cân bằng (tuổi chết, cảnh giới, nguyên nhân chết, linh căn).
// Dùng vite-node vì game nạp nội dung bằng import.meta.glob của Vite.
import { loadContent } from '../src/core/content';
import { duelTable } from '../src/systems/duel';
import { BOT_PROFILES, CLASS_PROFILES, MORTAL_PROFILES, fingerImpacts, formatPersonaTable, formatReport, simulateMany, traitImpacts, type BotProfile, type Report } from '../src/systems/simulate';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const count = Math.max(1, Number(arg('count', '200')) || 200);
const prefix = arg('seed', 'sim');
const difficulty = arg('difficulty', '');
const which = arg('profile', 'both');
const ALL: BotProfile[] = [...BOT_PROFILES, ...MORTAL_PROFILES, ...CLASS_PROFILES];
const profiles: BotProfile[] = which === 'both' ? BOT_PROFILES : which === 'mortal' ? MORTAL_PROFILES : which === 'class' ? CLASS_PROFILES : ALL.filter((p) => p === which);
if (profiles.length === 0) {
  console.error(`--profile phải là ${ALL.join(' | ')} | both | mortal`);
  process.exit(1);
}

const content = loadContent();

// 9.R2d: npm run simulate -- --traits all --count 60 --profile player   (or --traits id1,id2; --rarity uu)
const traitsArg = arg('traits', '');
if (traitsArg) {
  const rarity = arg('rarity', '');
  const ids = traitsArg === 'all'
    ? content.traits.filter((t) => !rarity || t.rarity === rarity).map((t) => t.id)
    : traitsArg.split(',');
  const profile = profiles[0];
  const started = Date.now();
  const { base, impacts } = traitImpacts(content, ids, count, prefix, { profile, difficulty: difficulty || undefined });
  console.log(`== Khí vận A/B · ${profile} · ${count} đời mỗi bên · nền: tuổi TB ${base.age.mean.toFixed(1)} ==`);
  console.log('id | bậc | tính chất | Δ cảnh giới TB | Δ tuổi TB | Δ Kim Đan | vượt ngân sách');
  for (const i of impacts.sort((a, b) => b.peak - a.peak)) {
    const t = content.traits.find((x) => x.id === i.id);
    console.log(`${i.id} | ${t?.rarity} | ${t?.nature ?? 'tot'} | ${i.peak.toFixed(2)} | ${i.age.toFixed(1)} | ${(i.kimDan * 100).toFixed(1)}% | ${i.over ? 'VƯỢT' : ''}`);
  }
  console.log(`(${((Date.now() - started) / 1000).toFixed(1)}s)`);
  process.exit(0);
}
// 9.V1: npm run simulate -- --duel   (thước sức mạnh: võ giả từng cảnh giới đấu tu sĩ, theo công thức, không chạy đời)
if (args.includes('--duel')) {
  const rows = duelTable(content);
  const realms = [...new Set(rows.map((r) => r.foe))];
  const show = realms.filter((f) => /tầng (1|5|9)$|kỳ$|viên mãn$/.test(f) && !/(Nguyên Anh|Hóa Thần)/.test(f));
  console.log('== Thước sức mạnh: tỉ lệ thắng trận (2 trong 3 hiệp), Căn cốt 50 ==');
  console.log(['Võ đạo', ...show].join(' | '));
  for (const m of [...new Set(rows.map((r) => r.martial))]) {
    console.log([m, ...show.map((f) => `${Math.round(rows.find((r) => r.martial === m && r.foe === f)!.match * 100)}%`)].join(' | '));
  }
  process.exit(0);
}
// 9.R3d: npm run simulate -- --fingers all --count 40 --profile player   (or --fingers id1,id2)
const fingersArg = arg('fingers', '');
if (fingersArg) {
  const ids = fingersArg === 'all' ? content.goldenFingers.fingers.map((f) => f.id) : fingersArg.split(',');
  const profile = profiles[0];
  const started = Date.now();
  const { base, impacts } = fingerImpacts(content, ids, count, prefix, { profile, difficulty: difficulty || undefined });
  const p = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`;
  const names = content.goldenFingers.rarityNames ?? {};
  console.log(`== Kim Thủ Chỉ A/B · ${profile} · ${count} đời mỗi bên · nền: tuổi TB ${base.age.mean.toFixed(1)} ==`);
  console.log('id | bậc | tu luyện | thọ | linh thạch | Δ chết trận | Δ tâm ma | đánh giá');
  for (const i of impacts) {
    const f = content.goldenFingers.fingers.find((x) => x.id === i.id);
    const tier = f ? (names as Record<string, string>)[f.rarity] ?? f.rarity : '?';
    console.log(`${i.id} | ${tier} | ${p(i.cultivation)} | ${p(i.lifespan)} | ${p(i.wealth)} | ${p(i.combatDeath)} | ${p(i.heartDemon)} | ${{ yeu: 'yếu', manh: 'MẠNH', vua: 'vừa' }[i.verdict]}`);
  }
  console.log(`(${((Date.now() - started) / 1000).toFixed(1)}s)`);
  process.exit(0);
}
const rows: { profile: BotProfile; report: Report }[] = [];
for (const profile of profiles) {
  const started = Date.now();
  // 9.R4b: --first-life plays with an empty Sổ tri thức (gates need luck).
  const firstLife = args.includes('--first-life');
  const { report } = simulateMany(content, count, prefix, { profile, difficulty: difficulty || undefined, knowledge: firstLife ? 'none' : 'all' });
  rows.push({ profile, report });
  console.log(formatReport(report, content, `${profile} · ${difficulty || content.balance.defaultDifficulty}${firstLife ? ' · kiếp đầu' : ''}`));
  console.log(`(${((Date.now() - started) / 1000).toFixed(1)}s)\n`);
}
if (which === 'mortal' || which === 'class' || ([...MORTAL_PROFILES, ...CLASS_PROFILES] as string[]).includes(which)) console.log(`== Persona phàm nhân ==\n${formatPersonaTable(rows)}`);
