// npm run validate — checks every JSON file under content/ and exits 1 on errors.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { validateContent, type Problem } from '../src/core/validate';

const root = join(import.meta.dirname, '..', 'content');
const publicDir = join(import.meta.dirname, '..', 'public');

function listJson(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listJson(full);
    return name.endsWith('.json') ? [full] : [];
  });
}

const files: Record<string, unknown> = {};
const problems: Problem[] = [];

for (const full of listJson(root)) {
  const rel = relative(root, full).split('\\').join('/');
  try {
    files[rel] = JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    problems.push({ file: rel, level: 'error', message: `JSON sai cú pháp: ${(err as Error).message}` });
  }
}

problems.push(...validateContent(files));

// Images referenced by events must exist under public/.
for (const [file, data] of Object.entries(files)) {
  if (!/(^|\/)events\//.test(file) || !Array.isArray(data)) continue;
  for (const ev of data as { id?: string; image?: string | null }[]) {
    if (ev.image && !existsSync(join(publicDir, ev.image))) {
      problems.push({ file, level: 'error', message: `sự kiện "${ev.id}": không tìm thấy ảnh public/${ev.image}` });
    }
  }
}

for (const p of problems) {
  console.log(`${p.level === 'error' ? '✗ LỖI' : '⚠ CẢNH BÁO'}  ${p.file}: ${p.message}`);
}
const errorCount = problems.filter((p) => p.level === 'error').length;
console.log(`\nĐã kiểm tra ${Object.keys(files).length} file: ${errorCount} lỗi, ${problems.length - errorCount} cảnh báo.`);
process.exit(errorCount > 0 ? 1 : 0);
