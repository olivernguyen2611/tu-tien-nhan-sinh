// Gặp lại tông môn đời trước (task 5b.7): when a life that ran a sect (ownSect) ends, the save meta
// keeps it (PastSectRecord). Later lives in the same world are born knowing it is out there
// (state.pastSect, members shrinking each life since); events (conditions.pastSect) let the
// player meet it again, turn away, or, strong enough, take back the master's seat (effect
// pastSect: "claimed" makes it this life's ownSect).
import type { Content } from '../core/content';
import type { GameState, LogLine, PastSect, PastSectRecord } from '../core/types';
import { sectById } from './sect';

/** What the meta keeps after this life: its own sect, else the old one a life further away (gone after maxLives). */
export function nextPastSectRecord(prev: PastSectRecord | null, life: GameState, content: Content): PastSectRecord | null {
  if (life.challenge) return prev;
  if (life.ownSect) {
    return { world: content.world.id, name: life.ownSect.name, lineage: life.ownSect.lineage, founder: life.character.name, members: life.ownSect.members, lives: 0 };
  }
  if (!prev) return null;
  const lives = prev.lives + 1;
  return lives >= content.balance.pastSect.maxLives ? null : { ...prev, lives };
}

/** The past sect as a new life in this world sees it (null: none, another world, or nobody left). */
export function pastSectFor(record: PastSectRecord | null | undefined, content: Content): PastSect | null {
  if (!record || record.world !== content.world.id) return null;
  const members = Math.round(record.members * content.balance.pastSect.decay ** (record.lives + 1));
  if (members <= 0) return null;
  return { name: record.name, lineage: record.lineage, founder: record.founder, members, status: 'unknown' };
}

export function pastSectMeets(state: GameState, c: { has?: boolean; status?: PastSect['status'][]; minMembers?: number }): boolean {
  const p = state.pastSect;
  if (c.has !== undefined && !!p !== c.has) return false;
  if ((c.status || c.minMembers !== undefined) && !p) return false;
  if (p && c.status && !c.status.includes(p.status)) return false;
  if (p && c.minMembers !== undefined && p.members < c.minMembers) return false;
  return true;
}

/** Effect pastSect: met / spurned just mark it; claimed makes it the ownSect (leaving any sect, as founding does). */
export function applyPastSect(state: GameState, content: Content, status: 'met' | 'claimed' | 'spurned'): { state: GameState; line: LogLine | null } {
  const p = state.pastSect;
  if (!p || p.status === 'claimed') return { state, line: null };
  if (status !== 'claimed' || state.ownSect) return { state: { ...state, pastSect: { ...p, status: status === 'claimed' ? 'met' : status } }, line: null };
  const cfg = content.balance.pastSect;
  const members = Math.max(1, Math.round(p.members * cfg.claimShare));
  let s: GameState = state;
  const old = sectById(content, state.sect.id);
  if (old) s = { ...s, sect: { ...s.sect, id: null, rank: 0, contribution: 0, master: null, left: [...s.sect.left, old.id] } };
  s = {
    ...s,
    pastSect: { ...p, status: 'claimed' },
    ownSect: { name: p.name, lineage: p.lineage, rules: [], founded: state.character.age, members, treasury: cfg.claimTreasury, buildings: {} },
  };
  const text = content.founding.texts.claimed.replaceAll('{sect}', p.name).replaceAll('{members}', String(members));
  return { state: s, line: { text, tone: 'rare' } };
}
