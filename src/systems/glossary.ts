// Glossary (task 1.10): finds terms in game text so the UI can underline them.
import type { Glossary } from '../core/schemas';

export type Segment = string | { id: string; text: string };

const isLetter = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/**
 * Build a splitter for one glossary. It marks the first occurrence of each
 * term (or alias) in a text, longest match first, case-insensitive, and only
 * on whole words ("Khí vận" inside "Tiên Thiên Khí Vận" goes to the longer term).
 */
export function makeTermSplitter(glossary: Glossary): (text: string) => Segment[] {
  const names = glossary
    .flatMap((g) => [g.term, ...g.aliases].map((name) => ({ id: g.id, lower: name.toLocaleLowerCase('vi') })))
    .sort((a, b) => b.lower.length - a.lower.length);

  return (text: string) => {
    if (names.length === 0 || text.length === 0) return [text];
    const lower = text.toLocaleLowerCase('vi');
    const seen = new Set<string>();
    const out: Segment[] = [];
    let plainFrom = 0;
    let i = 0;
    while (i < text.length) {
      const hit = isLetter(text[i - 1])
        ? undefined
        : names.find((n) => !seen.has(n.id) && lower.startsWith(n.lower, i) && !isLetter(text[i + n.lower.length]));
      if (!hit) { i++; continue; }
      if (i > plainFrom) out.push(text.slice(plainFrom, i));
      out.push({ id: hit.id, text: text.slice(i, i + hit.lower.length) });
      seen.add(hit.id);
      i += hit.lower.length;
      plainFrom = i;
    }
    if (plainFrom < text.length) out.push(text.slice(plainFrom));
    return out;
  };
}
