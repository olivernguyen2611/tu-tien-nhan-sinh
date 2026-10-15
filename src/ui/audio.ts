// Synthesized sound (task 6.4): a few short tones made with Web Audio, no audio files.
// Off by default; the choice is kept in localStorage. Silent when the browser has no audio.
import type { GameState } from '../core/types';

export type Cue = 'year' | 'event' | 'breakthrough' | 'death';

const KEY = 'bachthe.sound';

export function loadSoundPref(): boolean {
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}

export function saveSoundPref(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* blocked storage: applies for this visit only */ }
}

/** Which sound, if any, the step from `prev` to `next` deserves. Death outranks the rest. */
export function cueFor(prev: GameState | null, next: GameState | null): Cue | null {
  if (!prev || !next || prev.seed !== next.seed) return null;
  if (prev.alive && !next.alive) return 'death';
  if (!next.alive) return null;
  if (next.cult.realm !== prev.cult.realm || next.cult.stage > prev.cult.stage) return 'breakthrough';
  if (next.events.pending && !prev.events.pending) return 'event';
  if (next.character.age > prev.character.age) return 'year';
  return null;
}

// [frequency Hz, start s, length s, volume] per note; pentatonic, bell-like.
const NOTES: Record<Cue, [number, number, number, number][]> = {
  year: [[523.25, 0, 0.35, 0.05]],
  event: [[392, 0, 0.5, 0.08], [587.33, 0.12, 0.6, 0.06]],
  breakthrough: [[392, 0, 0.5, 0.08], [523.25, 0.15, 0.5, 0.08], [659.25, 0.3, 0.5, 0.08], [783.99, 0.45, 1.0, 0.09]],
  death: [[196, 0, 1.6, 0.1], [130.81, 0.35, 2.2, 0.1]],
};

let ctx: AudioContext | null = null;

export function playCue(cue: Cue): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, start, len, vol] of NOTES[cue]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // Quick strike, long exponential ring-out: a struck bell.
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + len + 0.05);
    }
  } catch {
    /* no audio device or blocked by autoplay policy: stay silent */
  }
}
