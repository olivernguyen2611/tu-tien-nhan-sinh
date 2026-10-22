// 12.2 Quan trường (content/office.json): Quan lộ as a real career in office. The rank is the career's rung (Huyện
// thừa … Tể tướng); one comes in by khoa cử, by buying an office, or by being recommended. Each year in office: the
// salary, what the tax style skims on top (thanh liêm, vừa phải, ăn chặn), chính tích toward the next rank, tội chứng
// that piles up from a dirty hand, and maybe a sớ đàn hặc (an event; the answer decides: bác, giáng, cách chức, tru di).
// A phe changes the odds; a quyền thần's man falls with him (12.1). Rolls use side streams. Numbers: balance.office.
import type { Content } from '../core/content';
import { Rng } from '../core/rng';
import type { GameState, LogLine } from '../core/types';
import { careerDef, entryRung } from './career';
import { arrest } from './law';
import { checkDeath } from './time';
import { courtTax } from './court';

type Office = NonNullable<GameState['office']>;
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

function pushLines(state: GameState, lines: LogLine[]): GameState {
  if (lines.length === 0) return state;
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last) log[log.length - 1] = { ...last, lines: [...last.lines, ...lines] };
  else log.push({ age: state.character.age, lines });
  return { ...state, log };
}

/** Holds office now (the quan trường career, still a mortal). */
export const inOffice = (state: GameState, content: Content): boolean =>
  !!content.office && state.career.id === content.office.career && state.cult.realm === 'pham_nhan' && state.alive;

const fresh = (state: GameState, via: Office['via'] = 'exam'): Office =>
  ({ style: 'vua_phai', faction: 'trung_lap', patron: null, merit: 0, evidence: 0, via, impeached: null, best: state.career.rung });

export const officeOf = (state: GameState, content: Content): Office | null =>
  inOffice(state, content) ? state.office ?? fresh(state) : null;

const rankName = (state: GameState, content: Content, rung = state.career.rung) => careerDef(content, state.career.id)?.rungs[rung] ?? '';
const grade = (content: Content, rung: number) => content.office?.grades[Math.min(rung, content.office.grades.length - 1)] ?? '';
export const styleDef = (content: Content, id: string) => content.office?.styles.find((s) => s.id === id);
export const officeFactionDef = (content: Content, id: string) => content.office?.factions.find((f) => f.id === id);

/** This year's salary (the career income the jobs system pays). */
export function officeSalary(state: GameState, content: Content): number {
  const s = content.balance.office?.salary ?? [];
  return s[Math.min(state.career.rung, s.length - 1)] ?? 0;
}

/** Into office without khoa cử: buying it (the bigger office the purse allows) or a recommendation. */
export function officeJoin(state: GameState, content: Content, via: 'buy' | 'recommend'): GameState {
  const file = content.office;
  const cfg = content.balance.office;
  if (!file || !cfg || inOffice(state, content) || state.cult.realm !== 'pham_nhan' || state.law?.jail) return state;
  let rung = Math.max(0, entryRung(state, content, file.career));
  let silver = 0;
  if (via === 'buy') {
    rung = cfg.buyCost.reduce((best, cost, i) => (state.money.silver >= cost ? i : best), -1);
    if (rung < 0) return pushLines(state, [{ text: file.texts.noSilver, tone: 'bad' }]);
    silver = cfg.buyCost[rung];
  }
  const s: GameState = {
    ...state,
    money: { ...state.money, silver: state.money.silver - silver },
    career: { id: file.career, rung, since: state.character.age },
  };
  const office = { ...fresh(s, via), evidence: via === 'buy' ? cfg.buyEvidence : 0 };
  return pushLines({ ...s, office }, [{ text: fill(file.texts.join[via] ?? '', { rank: rankName(s, content), silver }), tone: 'good' }]);
}

const withOffice = (state: GameState, content: Content, patch: Partial<Office>): GameState => {
  const o = officeOf(state, content);
  return o ? { ...state, office: { ...o, ...patch } } : state;
};

export function setOfficeStyle(state: GameState, content: Content, id: string): GameState {
  const def = styleDef(content, id);
  if (!def || !officeOf(state, content)) return state;
  return pushLines(withOffice(state, content, { style: id }), [{ text: fill(content.office!.texts.style, { style: def.name.toLowerCase() }), tone: 'normal' }]);
}

/** Join a phe (the quyền thần's needs one at court, 12.1). */
export function setOfficeFaction(state: GameState, content: Content, id: string): GameState {
  const def = officeFactionDef(content, id);
  if (!def || !officeOf(state, content) || (def.needsMinister && !state.court?.minister)) return state;
  return pushLines(withOffice(state, content, { faction: id, patron: def.needsMinister ? state.court!.minister!.name : null }), [{ text: fill(content.office!.texts.faction, { faction: def.name.toLowerCase() }), tone: 'normal' }]);
}

export const addOfficeMerit = (state: GameState, content: Content, d: number): GameState =>
  withOffice(state, content, { merit: Math.max(0, (officeOf(state, content)?.merit ?? 0) + d) });
export const addOfficeEvidence = (state: GameState, content: Content, d: number): GameState =>
  withOffice(state, content, { evidence: clamp((officeOf(state, content)?.evidence ?? 0) + d) });

/** Out of office: the rank, the style and the record go. */
function leaveOffice(state: GameState): GameState {
  return { ...state, career: { id: null, rung: 0, since: 0 }, office: undefined };
}

export function officeResign(state: GameState, content: Content): GameState {
  if (!officeOf(state, content)) return state;
  return pushLines(leaveOffice(state), [{ text: content.office!.texts.resign, tone: 'normal' }]);
}

/** A case lost (an đàn hặc, a purge): by tội chứng, giáng chức, cách chức, or ngục / tru di at the worst. */
function lose(state: GameState, content: Content, rng: Rng): GameState {
  const file = content.office!;
  const cfg = content.balance.office!;
  const o = officeOf(state, content)!;
  if (o.evidence >= cfg.executeEvidence) {
    // Under a bạo quân, or half the time, the worst: tru di. Otherwise to công đường for tham ô.
    if (state.court?.emperor.temper === 'bao_quan' || rng.chance(0.5)) {
      return checkDeath(pushLines(leaveOffice(state), [{ text: file.texts.executed, tone: 'bad' }]), content, 'execution');
    }
    return arrest(pushLines(leaveOffice(state), [{ text: file.texts.dismissed, tone: 'bad' }]), content, 'tham_o');
  }
  if (o.evidence >= cfg.dismissEvidence || state.career.rung === 0) {
    const s = { ...state, money: { ...state.money, silver: Math.round(state.money.silver / 2) } };
    return pushLines(leaveOffice(s), [{ text: file.texts.dismissed, tone: 'bad' }]);
  }
  const s: GameState = { ...state, career: { ...state.career, rung: state.career.rung - 1, since: state.character.age } };
  return pushLines(withOffice(s, content, { merit: 0, evidence: Math.round(o.evidence / 2) }), [{ text: fill(file.texts.demoted, { rank: rankName(s, content) }), tone: 'bad' }]);
}

/** Chance an đàn hặc is thrown out: intellect, the phe, less for every point of tội chứng. */
export function defendChance(state: GameState, content: Content, bribed = false): number {
  const cfg = content.balance.office!;
  const o = officeOf(state, content);
  if (!o) return 0;
  const f = officeFactionDef(content, o.faction);
  const backing = f && (!f.needsMinister || state.court?.minister) ? f.defend : 0;
  const p = cfg.defendBase + (state.stats.intellect - 50) * cfg.defendPerPoint + backing - o.evidence * cfg.defendPerEvidence + (bribed ? cfg.bribeBonus : 0);
  return Math.max(0.05, Math.min(0.95, p));
}

/** Answer a sớ đàn hặc: argue it, bribe the right people, or confess and step down. */
export function officeDefend(state: GameState, content: Content, how: 'argue' | 'bribe' | 'confess'): GameState {
  const file = content.office;
  const cfg = content.balance.office;
  const o = officeOf(state, content);
  if (!file || !cfg || !o) return state;
  const rng = new Rng(`${state.seed}:office:defend:${state.character.age}`);
  if (how === 'confess') {
    // Owning up keeps the head, unless the record is past saving.
    return o.evidence >= cfg.executeEvidence ? arrest(pushLines(leaveOffice(state), [{ text: file.texts.dismissed, tone: 'bad' }]), content, 'tham_o') : officeResign(state, content);
  }
  let s = state;
  let bribed = false;
  if (how === 'bribe') {
    const cost = cfg.bribeCost * (state.career.rung + 1);
    if (s.money.silver >= cost) { s = { ...s, money: { ...s.money, silver: s.money.silver - cost } }; bribed = true; }
    else s = pushLines(s, [{ text: file.texts.noSilver, tone: 'bad' }]);
  }
  if (rng.chance(defendChance(s, content, bribed))) {
    s = addOfficeMerit(s, content, -5);
    return pushLines(s, [{ text: fill(file.texts.cleared, { rank: rankName(s, content) }), tone: 'good' }]);
  }
  return lose(s, content, rng);
}

/** Promotion chance this year (0 when too soon, short of chính tích, at the top, or capped for a bought office). */
export function officePromoteChance(state: GameState, content: Content): number {
  const cfg = content.balance.office;
  const o = officeOf(state, content);
  const career = careerDef(content, state.career.id);
  if (!cfg || !o || !career) return 0;
  const rung = state.career.rung;
  if (rung >= career.rungs.length - 1 || (o.via === 'buy' && rung >= cfg.buyCap)) return 0;
  if (state.character.age - state.career.since < cfg.yearsPerRank) return 0;
  if (o.merit < (cfg.meritNeed[Math.min(rung, cfg.meritNeed.length - 1)] ?? 0)) return 0;
  const f = officeFactionDef(content, o.faction);
  const minister = state.court?.minister;
  const backing = !f ? 0 : f.needsMinister ? (minister ? f.promote * (minister.sway / 50) : 0) : f.promote;
  const temper = state.court?.emperor.temper;
  const style = styleDef(content, o.style);
  const base = cfg.promoteChance[Math.min(rung, cfg.promoteChance.length - 1)] ?? 0;
  // The phe and the emperor scale the odds (higher up, every backing matters less in absolute terms).
  const p = base * (1 + backing + (temper ? style?.temperPromote[temper] ?? 0 : 0));
  return Math.max(0.02, Math.min(0.95, p));
}

/** One year in office (after the career year): skim, chính tích, tội chứng, maybe a promotion, an đàn hặc, a purge. */
export function officeYear(state: GameState, content: Content): GameState {
  const file = content.office;
  const cfg = content.balance.office;
  if (!file || !cfg) return state;
  if (!inOffice(state, content)) return state.office ? { ...state, office: undefined } : state;
  const age = state.character.age;
  const rng = new Rng(`${state.seed}:office:${age}`);
  const lines: LogLine[] = [];
  let s: GameState = state;
  let o = officeOf(s, content)!;
  // Remembered after the seal is gone (events about a cựu quan).
  if (!s.flags.tung_lam_quan) s = { ...s, flags: { ...s.flags, tung_lam_quan: true } };
  // In ngục, the seal is taken.
  if (s.law?.jail) return pushLines(leaveOffice(s), [{ text: file.texts.dismissed, tone: 'bad' }]);

  // The quyền thần fell (12.1): his men are hunted.
  const f = officeFactionDef(content, o.faction);
  if (f?.needsMinister && s.court?.minister?.name !== o.patron) {
    const minister = o.patron ?? '';
    lines.push({ text: fill(file.texts.patronFell, { minister }), tone: 'bad' });
    s = { ...s, office: { ...o, faction: 'trung_lap', patron: null } };
    if (rng.chance(cfg.purgeChance)) {
      lines.push({ text: fill(file.texts.purged, { minister }), tone: 'bad' });
      return lose(pushLines(s, lines), content, rng);
    }
    lines.push({ text: file.texts.purgeEscaped, tone: 'normal' });
    o = s.office!;
  }

  // The tax style: silver skimmed on top of the salary (more in a year of heavy sưu thuế), tội chứng, nghiệp, hương danh.
  const style = styleDef(content, o.style);
  if (style) {
    const tax = 1 + courtTax(s, content) / 100;
    const skim = Math.round(officeSalary(s, content) * style.skim * tax);
    if (skim > 0) {
      s = { ...s, money: { ...s.money, silver: s.money.silver + skim } };
      lines.push({ text: fill(file.texts.skim, { silver: skim }), tone: 'normal', ledger: true });
    }
    const rep = s.social.reputation;
    s = { ...s, social: { ...s.social, karma: s.social.karma + style.karma, reputation: { ...rep, lang_xa: Math.max(-100, Math.min(100, rep.lang_xa + style.fame)) } } };
  }
  const evidence = clamp(o.evidence + (style?.evidence ?? 0) - ((style?.evidence ?? 0) <= 0 ? cfg.evidenceDecay : 0));
  const talent = (s.stats.intellect + s.stats.charm) / 2 - 50;
  const merit = Math.max(0, o.merit + Math.round(cfg.meritBase + talent * cfg.meritPerPoint + (style?.merit ?? 0) + rng.int(cfg.meritRand[0], cfg.meritRand[1])));
  s = { ...s, office: { ...o, evidence, merit } };

  if (rng.chance(officePromoteChance(s, content))) {
    const rung = s.career.rung + 1;
    s = { ...s, career: { ...s.career, rung, since: age }, office: { ...s.office!, merit: 0, best: Math.max(s.office!.best, rung) } };
    lines.push({ text: fill(file.texts.promote, { rank: rankName(s, content), grade: grade(content, rung) }), tone: rung === (careerDef(content, s.career.id)?.rungs.length ?? 0) - 1 ? 'rare' : 'good' });
  }

  // Sớ đàn hặc: the dirtier the hand, the likelier; the phe shields or exposes.
  const off = s.office!;
  const since = off.impeached === null ? Infinity : age - off.impeached;
  const shield = f && (!f.needsMinister || s.court?.minister) ? f.impeach : 0;
  const pImpeach = cfg.impeachBase + off.evidence * cfg.impeachPerEvidence + shield;
  if (since >= cfg.impeachGap && rng.chance(Math.max(0, pImpeach)) && content.events.some((e) => e.id === file.impeachEvent)) {
    s = { ...s, office: { ...off, impeached: age }, events: { ...s.events, followUps: [...s.events.followUps, { event: file.impeachEvent, atAge: age }] } };
    lines.push({ text: file.texts.impeach, tone: 'bad' });
  }
  return pushLines(s, lines);
}

/** "Tri huyện (Thất phẩm) · thanh liêm · phe thanh lưu · chính tích 12/28 · tội chứng 5" */
export function officeLine(state: GameState, content: Content): string | null {
  const o = officeOf(state, content);
  const cfg = content.balance.office;
  if (!o || !cfg) return null;
  const rung = state.career.rung;
  const need = cfg.meritNeed[Math.min(rung, cfg.meritNeed.length - 1)];
  const parts = [`${rankName(state, content)} (${grade(content, rung)})`, styleDef(content, o.style)?.name.toLowerCase() ?? '', officeFactionDef(content, o.faction)?.name.toLowerCase() ?? ''];
  parts.push(`chính tích ${o.merit}/${need}`, `tội chứng ${o.evidence}`);
  return parts.filter(Boolean).join(' · ');
}
