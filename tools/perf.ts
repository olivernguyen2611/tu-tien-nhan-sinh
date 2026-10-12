// Measures how long content loading and year-skipping take (task 6.6): `npm run perf`.
import { loadContent } from '../src/core/content';
import { createLife, fastForward } from '../src/core/state';

const ms = (t: number) => `${(performance.now() - t).toFixed(0)} ms`;

let t = performance.now();
const content = loadContent();
console.log(`Nạp nội dung: ${ms(t)}`);

t = performance.now();
let s = createLife({ seed: 'perf' }, content);
console.log(`Tạo nhân vật: ${ms(t)}`);

t = performance.now();
let years = 0;
for (let i = 0; i < 20 && s.alive; i++) {
  const before = s.character.age;
  s = fastForward(s, content);
  years += s.character.age - before;
  if (s.events.pending) break;
}
console.log(`Tua ${years} năm (đến khi gặp sự kiện): ${ms(t)}`);
