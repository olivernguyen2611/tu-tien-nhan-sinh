// 9.R7a: the fence for copyrighted proper nouns (CLAUDE.md rule 11). The list lives in
// docs/design/ten-cam.json and never ships with the game; npm run validate runs this.
import type { Problem } from './validate';

/** Drop tone marks only (sắc, huyền, hỏi, ngã, nặng): "Lắm" stays apart from "Lâm", "Hàn" matches "Hán". */
function toneless(s: string): string {
  return s.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC');
}

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface NamePool { surnames: string[]; male: string[]; female: string[]; maleMiddle: string[]; maleGiven: string[]; femaleMiddle: string[]; femaleGiven: string[] }

/** Whether the name pool can put this full name together (surname + curated or middle + given). */
function poolMakes(pool: NamePool, full: string): boolean {
  const low = (s: string) => s.toLocaleLowerCase('vi');
  for (const sur of pool.surnames) {
    if (!low(full).startsWith(low(sur) + ' ')) continue;
    const given = low(full.slice(sur.length + 1));
    if ([...pool.male, ...pool.female].some((g) => low(g) === given)) return true;
    const [mid, last, more] = given.split(' ');
    if (more !== undefined || last === undefined) continue;
    if (pool.maleMiddle.some((m) => low(m) === mid) && pool.maleGiven.some((g) => low(g) === last)) return true;
    if (pool.femaleMiddle.some((m) => low(m) === mid) && pool.femaleGiven.some((g) => low(g) === last)) return true;
  }
  return false;
}

/**
 * Exact use of a banned name (any case) is an error; the same name with only tone marks changed,
 * written as a proper noun (each word capitalised), is too close and also an error.
 * A name the random name pool could produce is an error on names.json.
 */
export function bannedNameProblems(files: Record<string, unknown>, banned: string[]): Problem[] {
  const problems: Problem[] = [];
  const checks = banned.map((name) => ({
    name,
    exact: new RegExp(`(^|[^\\p{L}])${escape(name)}(?![\\p{L}])`, 'iu'),
    near: new RegExp(`(^|[^\\p{L}])${escape(toneless(name))}(?![\\p{L}])`, 'u'),
  }));
  for (const [file, data] of Object.entries(files)) {
    const texts = strings(data);
    for (const c of checks) {
      if (texts.some((t) => c.exact.test(t))) problems.push({ file, level: 'error', message: `dùng tên riêng của tác phẩm khác: "${c.name}" (docs/design/ten-cam.json)` });
      else if (texts.some((t) => c.near.test(toneless(t)))) problems.push({ file, level: 'error', message: `tên quá giống "${c.name}" (chỉ khác dấu thanh)` });
    }
    if (/(^|\/)character\/names\.json$/.test(file) && data && typeof data === 'object' && 'surnames' in data) {
      for (const name of banned) {
        if (poolMakes(data as NamePool, name)) problems.push({ file, level: 'error', message: `kho tên có thể ghép ra "${name}"` });
      }
    }
  }
  return problems;
}
