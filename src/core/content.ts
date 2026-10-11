// Loads all JSON under content/ at build time and checks it with the same
// rules as `npm run validate`.
import { BalanceSchema, EventFileSchema, GlossarySchema, type Balance, type GameEvent, type Glossary } from './schemas';
import { validateContent } from './validate';

export interface Content {
  balance: Balance;
  events: GameEvent[];
  glossary: Glossary;
}

const modules = import.meta.glob('../../content/**/*.json', { eager: true, import: 'default' });

/** Paths relative to content/, e.g. "events/childhood.json". */
function rawFiles(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(modules)) {
    out[path.replace(/^.*\/content\//, '')] = data;
  }
  return out;
}

export function loadContent(): Content {
  const files = rawFiles();
  const errors = validateContent(files).filter((p) => p.level === 'error');
  if (errors.length > 0) {
    throw new Error('Dữ liệu game lỗi:\n' + errors.map((e) => `${e.file}: ${e.message}`).join('\n'));
  }
  const events = Object.entries(files)
    .filter(([path]) => path.startsWith('events/'))
    .flatMap(([, data]) => EventFileSchema.parse(data));
  return {
    balance: BalanceSchema.parse(files['config/balance.json']),
    events,
    glossary: GlossarySchema.parse(files['glossary.json'] ?? []),
  };
}
