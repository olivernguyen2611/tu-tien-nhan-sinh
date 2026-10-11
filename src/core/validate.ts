// Cross-file checks on top of the schemas. Pure: takes parsed-JSON files keyed
// by their path under content/, returns problems. Used by tools/validate-content.ts
// and by the in-game loader.
import type { ZodTypeAny } from 'zod';
import { AptitudesFileSchema, BalanceSchema, FamilyActionFileSchema, RealmsFileSchema, RootsFileSchema, EventFileSchema, GlossarySchema, LifeTextsSchema, NamesSchema, OriginFileSchema, StatExtremesFileSchema, TraitFileSchema, WorldSchema, type AptitudesFile, type Balance, type GameEvent, type Origin, type RealmsFile, type RootsFile, type StatExtremesFile, type Trait, type World } from './schemas';

export interface Problem {
  file: string;
  level: 'error' | 'warning';
  message: string;
}

/** Which schema applies to which content file. */
/** "worlds/<id>/rest" → { worldId, rest }; shared files have no world. */
export function splitWorldPath(path: string): { worldId: string | null; rest: string } {
  const m = /^worlds\/([^/]+)\/(.+)$/.exec(path);
  return m ? { worldId: m[1], rest: m[2] } : { worldId: null, rest: path };
}

export function schemaFor(path: string): ZodTypeAny | null {
  const { worldId, rest } = splitWorldPath(path);
  if (worldId === null) {
    // Shared by every world.
    if (rest === 'config/balance.json') return BalanceSchema;
    if (rest === 'glossary.json') return GlossarySchema;
    if (rest === 'traits.json') return TraitFileSchema;
    if (rest === 'family-actions.json') return FamilyActionFileSchema;
    if (rest === 'life-texts.json') return LifeTextsSchema;
    if (rest === 'stat-extremes.json') return StatExtremesFileSchema;
    if (rest === 'realms.json') return RealmsFileSchema;
    if (rest === 'roots.json') return RootsFileSchema;
    if (rest === 'aptitudes.json') return AptitudesFileSchema;
    return null;
  }
  // Belongs to one world.
  if (rest === 'world.json') return WorldSchema;
  if (rest === 'character/origins.json') return OriginFileSchema;
  if (rest === 'character/names.json') return NamesSchema;
  if (/^events\/[^/]+\.json$/.test(rest)) return EventFileSchema;
  return null;
}

/** Flags the engine sets itself (not via events). */
export const ENGINE_FLAGS = ['no_parents', 'no_father', 'no_mother'];
/** Words naming a parent in event text, and the flag the engine sets once that parent is gone. */
const PARENT_WORDS = [
  { name: 'cha', flag: 'no_father', word: /(^|[^\p{L}])cha(?![\p{L}])/iu },
  { name: 'mẹ', flag: 'no_mother', word: /(^|[^\p{L}])mẹ(?![\p{L}])/iu },
];

export function validateContent(files: Record<string, unknown>): Problem[] {
  const problems: Problem[] = [];
  const events: { file: string; event: GameEvent }[] = [];
  let traitIds: Set<string> | null = null;
  const parsedShared: { balance?: Balance; realms?: RealmsFile; roots?: RootsFile; aptitudes?: AptitudesFile } = {};

  for (const [file, raw] of Object.entries(files)) {
    const schema = schemaFor(file);
    if (!schema) {
      problems.push({ file, level: 'warning', message: 'chưa có schema cho file này, bỏ qua' });
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({ file, level: 'error', message: `${issue.path.join('.') || '(gốc)'}: ${issue.message}` });
      }
      continue;
    }
    if (schema === StatExtremesFileSchema) {
      const ids = new Set<string>();
      const zones = new Set<string>();
      for (const d of (parsed.data as StatExtremesFile).states) {
        if (ids.has(d.id)) problems.push({ file, level: 'error', message: `trùng id trạng thái "${d.id}"` });
        const zone = `${d.stat}/${d.zone}`;
        if (zones.has(zone)) problems.push({ file, level: 'error', message: `"${d.id}": đã có trạng thái khác cho ${d.stat} vùng ${d.zone}` });
        ids.add(d.id);
        zones.add(zone);
      }
    }
    if (schema === WorldSchema && (parsed.data as World).id !== splitWorldPath(file).worldId) {
      problems.push({ file, level: 'error', message: `id thế giới "${(parsed.data as World).id}" phải trùng tên thư mục` });
    }
    if (schema === OriginFileSchema) {
      const seenOrigin = new Set<string>();
      for (const o of parsed.data as Origin[]) {
        if (seenOrigin.has(o.id)) problems.push({ file, level: 'error', message: `trùng id xuất thân "${o.id}"` });
        seenOrigin.add(o.id);
      }
    }
    if (schema === TraitFileSchema) {
      const seenTrait = new Set<string>();
      traitIds = seenTrait;
      for (const t of parsed.data as Trait[]) {
        if (seenTrait.has(t.id)) problems.push({ file, level: 'error', message: `trùng id khí vận "${t.id}"` });
        seenTrait.add(t.id);
        // PLAN.md mục H: romance-related event weights only from age 18.
        for (const e of t.effects) {
          if (e.hook.startsWith('eventWeight.romance') && (e.activeFrom?.age ?? 0) < 18) {
            problems.push({ file, level: 'error', message: `khí vận "${t.id}": móc "${e.hook}" phải có activeFrom.age ≥ 18` });
          }
        }
      }
    }
    if (schema === FamilyActionFileSchema) {
      const seenAction = new Set<string>();
      for (const a of parsed.data as { id: string }[]) {
        if (seenAction.has(a.id)) problems.push({ file, level: 'error', message: `trùng id tương tác "${a.id}"` });
        seenAction.add(a.id);
      }
    }
    if (schema === EventFileSchema) {
      for (const event of parsed.data as GameEvent[]) events.push({ file, event });
    }
    if (schema === BalanceSchema) parsedShared.balance = parsed.data as Balance;
    if (schema === RealmsFileSchema) parsedShared.realms = parsed.data as RealmsFile;
    if (schema === RootsFileSchema) parsedShared.roots = parsed.data as RootsFile;
    if (schema === AptitudesFileSchema) parsedShared.aptitudes = parsed.data as AptitudesFile;
  }

  problems.push(...checkCultivationTables(parsedShared));
  const realmIds = parsedShared.realms ? new Set(parsedShared.realms.realms.map((r) => r.id)) : null;

  // Duplicate event ids across all event files.
  const seen = new Map<string, string>();
  for (const { file, event } of events) {
    const prev = seen.get(event.id);
    if (prev) problems.push({ file, level: 'error', message: `trùng id sự kiện "${event.id}" (đã có trong ${prev})` });
    else seen.set(event.id, file);
  }

  // Collect flags that some event sets, and follow-up targets.
  const flagsSet = new Set<string>(ENGINE_FLAGS);
  for (const { event } of events) {
    for (const choice of event.choices) {
      for (const outcome of [choice.result, choice.success, choice.fail]) {
        outcome?.effects.setFlags.forEach((f) => flagsSet.add(f));
      }
    }
  }

  for (const { file, event } of events) {
    const where = `sự kiện "${event.id}"`;

    // PLAN.md mục H: mature content only for adults.
    if (event.tags.includes('mature') && (event.conditions.age?.min ?? 0) < 18) {
      problems.push({ file, level: 'error', message: `${where} gắn tag "mature" nhưng conditions.age.min chưa ≥ 18` });
    }

    if (event.themes.some((t) => t.startsWith('romance')) && (event.conditions.age?.min ?? 0) < 18) {
      problems.push({ file, level: 'error', message: `${where} có chủ đề tình duyên nhưng conditions.age.min chưa ≥ 18` });
    }

    // Traits named in conditions must exist.
    if (traitIds) {
      const named = [event.conditions, ...event.choices.map((c) => c.requires ?? {})]
        .flatMap((c) => [...(c.traitsAny ?? []), ...(c.traitsAll ?? []), ...(c.traitsNone ?? [])]);
      for (const t of named) {
        if (!traitIds.has(t)) problems.push({ file, level: 'error', message: `${where} nhắc tới khí vận không tồn tại "${t}"` });
      }
    }

    if (realmIds) {
      for (const r of [event.conditions.realm?.min, event.conditions.realm?.max]) {
        if (r && !realmIds.has(r)) problems.push({ file, level: 'error', message: `${where} nhắc tới cảnh giới không tồn tại "${r}"` });
      }
    }

    for (const flag of event.conditions.flagsAll) {
      if (!flagsSet.has(flag)) {
        problems.push({ file, level: 'warning', message: `${where} cần flag "${flag}" nhưng không sự kiện nào đặt flag này` });
      }
    }

    // Text that names a parent needs that parent alive: the event (or the choice) must
    // exclude no_father / no_mother, or a dead father "falls ill" years later.
    const needsParent = (text: string, choiceFlags: string[]) => {
      const excluded = [...event.conditions.flagsNone, ...choiceFlags];
      return PARENT_WORDS.filter((p) => p.word.test(text) && !excluded.includes(p.flag));
    };
    for (const p of needsParent(`${event.title} ${event.text}`, [])) {
      problems.push({ file, level: 'error', message: `${where} nhắc tới ${p.name} nhưng conditions.flagsNone thiếu "${p.flag}"` });
    }

    event.choices.forEach((choice, i) => {
      const texts = [choice.text, choice.result?.text, choice.success?.text, choice.fail?.text].filter(Boolean).join(' ');
      for (const p of needsParent(texts, choice.requires?.flagsNone ?? [])) {
        problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1} nhắc tới ${p.name} nhưng sự kiện hoặc lựa chọn chưa loại "${p.flag}"` });
      }
      for (const outcome of [choice.result, choice.success, choice.fail]) {
        // Owner rule: every choice moves the character's numbers a little.
        if (outcome && !Object.values(outcome.effects).some((v) => typeof v === 'number' && v !== 0)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: kết quả không đổi chỉ số nào (mỗi lựa chọn phải ảnh hưởng ít nhất một chỉ số)` });
        }
        const target = outcome?.effects.followUp?.event;
        if (target && !seen.has(target)) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: followUp tới sự kiện không tồn tại "${target}"` });
        }
        const range = outcome?.effects.followUp?.afterYears;
        if (range && range[0] > range[1]) {
          problems.push({ file, level: 'error', message: `${where}, lựa chọn ${i + 1}: afterYears [${range[0]}, ${range[1]}] bị ngược` });
        }
      }
    });
  }

  return problems;
}

/** Duplicate ids in a list, as messages. */
function duplicates(file: string, what: string, list: { id: string }[]): Problem[] {
  const seen = new Set<string>();
  const out: Problem[] = [];
  for (const { id } of list) {
    if (seen.has(id)) out.push({ file, level: 'error', message: `trùng id ${what} "${id}"` });
    seen.add(id);
  }
  return out;
}

/** Content ids and their numbers in balance.json must name the same things. */
function sameKeys(file: string, what: string, contentIds: string[], balanceKeys: string[]): Problem[] {
  const out: Problem[] = [];
  for (const k of contentIds) if (!balanceKeys.includes(k)) out.push({ file, level: 'error', message: `${what}: thiếu số liệu cho "${k}"` });
  for (const k of balanceKeys) if (!contentIds.includes(k)) out.push({ file, level: 'error', message: `${what}: "${k}" không có trong nội dung` });
  return out;
}

/** Cross-checks for realms.json, roots.json, aptitudes.json against balance.json (task 2.1). */
function checkCultivationTables(t: { balance?: Balance; realms?: RealmsFile; roots?: RootsFile; aptitudes?: AptitudesFile }): Problem[] {
  const out: Problem[] = [];
  const bal = 'config/balance.json';
  const realmIds = t.realms?.realms.map((r) => r.id) ?? [];
  if (t.realms) {
    out.push(...duplicates('realms.json', 'cảnh giới', t.realms.realms));
    if (t.balance) out.push(...sameKeys(bal, 'realms', realmIds, Object.keys(t.balance.realms)));
  }
  if (t.roots) {
    const f = 'roots.json';
    out.push(...duplicates(f, 'linh căn', t.roots.grades), ...duplicates(f, 'hệ', t.roots.elements), ...duplicates(f, 'thể chất', t.roots.bodies));
    const elements = new Set(t.roots.elements.map((e) => e.id));
    for (const e of t.roots.elements) {
      for (const b of e.beats) {
        if (!elements.has(b)) out.push({ file: f, level: 'error', message: `hệ "${e.id}" khắc hệ không tồn tại "${b}"` });
        if (b === e.id) out.push({ file: f, level: 'error', message: `hệ "${e.id}" không thể tự khắc mình` });
      }
    }
    for (const body of t.roots.bodies) {
      for (const h of body.effects) {
        if (h.activeUntil && t.realms && !realmIds.includes(h.activeUntil.realm)) {
          out.push({ file: f, level: 'error', message: `thể chất "${body.id}": activeUntil tới cảnh giới không tồn tại "${h.activeUntil.realm}"` });
        }
      }
    }
    if (t.balance) {
      const grades = t.roots.grades.map((g) => g.id);
      const r = t.balance.roots;
      out.push(
        ...sameKeys(bal, 'roots.gradeWeights', grades, Object.keys(r.gradeWeights)),
        ...sameKeys(bal, 'roots.gradeSpeed', grades, Object.keys(r.gradeSpeed)),
        ...sameKeys(bal, 'roots.elementCount', grades, Object.keys(r.elementCount)),
        ...sameKeys(bal, 'roots.bodyWeights', t.roots.bodies.map((b) => b.id), Object.keys(r.bodyWeights)),
      );
    }
  }
  if (t.aptitudes) {
    const f = 'aptitudes.json';
    out.push(...duplicates(f, 'con đường', t.aptitudes.paths), ...duplicates(f, 'bách nghệ', t.aptitudes.crafts));
    const titles = t.aptitudes.craftTitles;
    if (titles[0].minLevel !== 0) out.push({ file: f, level: 'error', message: 'craftTitles phải bắt đầu từ minLevel 0' });
    titles.forEach((x, i) => {
      if (i > 0 && x.minLevel <= titles[i - 1].minLevel) out.push({ file: f, level: 'error', message: 'craftTitles phải tăng dần theo minLevel' });
    });
    if (t.balance) {
      const { startAffinity: _, ...paths } = t.balance.paths;
      out.push(...sameKeys(bal, 'paths', t.aptitudes.paths.map((p) => p.id), Object.keys(paths)));
      const craftIds = t.aptitudes.crafts.map((c) => c.id);
      const starts = { ...t.balance.crafts.mortalStartLevel, ...t.balance.crafts.cultivatorStartLevel };
      for (const [job, levels] of Object.entries(starts)) {
        for (const c of Object.keys(levels)) {
          if (!craftIds.includes(c)) out.push({ file: bal, level: 'error', message: `crafts: nghề "${job}" nhắc tới bách nghệ không tồn tại "${c}"` });
        }
      }
    }
  }
  return out;
}
