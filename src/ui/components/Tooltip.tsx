// Glossary tooltips (task 1.10): underlined terms in game text; tapping one
// opens a small card with its explanation. One card for the whole app.
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import type { Glossary } from '../../core/schemas';
import { makeTermSplitter, type Segment } from '../../systems/glossary';

interface GlossaryApi {
  split: (text: string) => Segment[];
  show: (id: string) => void;
}

const Ctx = createContext<GlossaryApi>({ split: (t) => [t], show: () => {} });

export function GlossaryProvider({ glossary, children }: { glossary: Glossary; children: ComponentChildren }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const api = useMemo<GlossaryApi>(() => ({ split: makeTermSplitter(glossary), show: setOpenId }), [glossary]);
  const entry = glossary.find((g) => g.id === openId);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {entry && (
        <div class="term-backdrop" onClick={() => setOpenId(null)}>
          <div class="term-card" role="dialog" aria-label={entry.term}>
            <b>{entry.term}</b>
            {entry.aliases.length > 0 && <span class="aka">còn gọi: {entry.aliases.join(', ')}</span>}
            <p>{entry.definition}</p>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** A term button that opens its explanation. */
export function Term({ id, children }: { id: string; children: ComponentChildren }) {
  const { show } = useContext(Ctx);
  return (
    <button type="button" class="term" onClick={(e) => { e.stopPropagation(); show(id); }}>
      {children}
    </button>
  );
}

/** Game text with glossary terms underlined. */
export function TermText({ text }: { text: string }) {
  const { split } = useContext(Ctx);
  return <>{split(text).map((s, i) => (typeof s === 'string' ? s : <Term id={s.id} key={i}>{s.text}</Term>))}</>;
}
