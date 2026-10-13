// Character names: surname + given name, where the given name is either a
// curated pair ("Thanh Phong") or middle + given syllable ("Hạo" + "Nhiên").
// Relatives never repeat a given name already used in the family.
import type { Rng } from '../core/rng';
import type { Names } from '../core/schemas';
import type { Gender } from '../core/types';

/** Share of given names taken whole from the curated lists. */
const CURATED_SHARE = 0.3;
const MAX_TRIES = 40;

const norm = (s: string) => s.trim().toLocaleLowerCase('vi');

/** Longest name the player may type (6b.13). */
export const NAME_MAX = 24;

/** While typing: only letters (with their tone marks) and spaces, at most NAME_MAX characters. */
export function nameChars(raw: string): string {
  return [...raw.normalize('NFC').replace(/[^\p{L}\p{M} ]/gu, '').replace(/ {2,}/g, ' ')].slice(0, NAME_MAX).join('');
}

/** The name kept for a new life: nameChars, trimmed; empty means "let fate name it". */
export function cleanName(raw: string): string {
  return nameChars(raw.trim()).trim();
}

/** Split a full name into surname and given name; compound surnames (Thượng Quan…) are kept whole. */
export function splitName(full: string, names: Names): { surname: string; given: string } {
  const trimmed = full.trim().replace(/\s+/g, ' ');
  const surname = [...names.surnames]
    .sort((a, b) => b.length - a.length)
    .find((s) => norm(trimmed).startsWith(norm(s) + ' '));
  if (surname) return { surname: trimmed.slice(0, surname.length), given: trimmed.slice(surname.length + 1) };
  const space = trimmed.indexOf(' ');
  return space < 0 ? { surname: '', given: trimmed } : { surname: trimmed.slice(0, space), given: trimmed.slice(space + 1) };
}

function givenName(rng: Rng, names: Names, gender: Gender): string {
  const curated = gender === 'nam' ? names.male : names.female;
  if (rng.chance(CURATED_SHARE)) return rng.pick(curated);
  const middles = gender === 'nam' ? names.maleMiddle : names.femaleMiddle;
  const givens = gender === 'nam' ? names.maleGiven : names.femaleGiven;
  const middle = rng.pick(middles);
  let given = rng.pick(givens);
  if (given === middle) given = rng.pick(givens);
  return `${middle} ${given}`;
}

/**
 * A full name. `taken` holds full or given names to avoid (the player and every
 * relative); after MAX_TRIES the last try is kept, which with ~1000 combinations
 * per gender practically never happens.
 */
export function makeName(rng: Rng, names: Names, gender: Gender, opts: { surname?: string; taken?: string[] } = {}): string {
  const surname = opts.surname ?? rng.pick(names.surnames);
  const avoid = new Set((opts.taken ?? []).map((t) => norm(splitName(t, names).given)));
  let given = givenName(rng, names, gender);
  for (let i = 1; i < MAX_TRIES && avoid.has(norm(given)); i++) given = givenName(rng, names, gender);
  return surname ? `${surname} ${given}` : given;
}
