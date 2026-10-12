import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import { cueFor } from '../src/ui/audio';

const content = loadContent();
const life = () => createLife({ seed: 'audio' }, content);

describe('sound cues', () => {
  it('stay silent without a previous state or across different lives', () => {
    const a = life();
    expect(cueFor(null, a)).toBeNull();
    expect(cueFor({ ...a, seed: 'other' }, a)).toBeNull();
  });

  it('pick the cue by what happened, death first', () => {
    const a = life();
    expect(cueFor(a, { ...a, character: { ...a.character, age: a.character.age + 1 } })).toBe('year');
    expect(cueFor(a, { ...a, cult: { ...a.cult, realm: 'luyen_khi' } })).toBe('breakthrough');
    expect(cueFor(a, { ...a, alive: false, cult: { ...a.cult, realm: 'luyen_khi' } })).toBe('death');
    expect(cueFor(a, a)).toBeNull();
  });
});
