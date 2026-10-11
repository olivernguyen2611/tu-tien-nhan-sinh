import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Content } from '../core/content';
import { advanceYear, createLife, fastForward } from '../core/state';
import type { GameState } from '../core/types';
import { describeChanges } from '../systems/deltas';
import { performFamilyAction } from '../systems/relationships';
import { findEvent, resolveChoice } from '../systems/events/engine';
import { confirmDestiny, rerollDestiny, rollDestiny } from '../systems/destiny';
import {
  deleteSlot, exportSave, firstFreeSlot, latestSlot, listSlots, makeSave, parseSave, readMeta, readSlot, recordNewLife,
  slotTaken, writeSlot, type SaveFile,
} from '../systems/save';
import { checkDeath } from '../systems/time';
import { GlossaryProvider } from './components/Tooltip';
import { browserStore, downloadText, readJsonFile } from './storage';
import { applyThemePref, loadThemePref, nextThemePref, type ThemePref } from './theme';
import { CreateCharacterScreen } from './screens/CreateCharacter';
import { DeathScreen } from './screens/Death';
import { DestinyRollScreen } from './screens/DestinyRoll';
import { MainScreen } from './screens/Main';
import { SettingsScreen, type SlotView } from './screens/Settings';
import { TitleScreen } from './screens/Title';
import { loadDevMode, saveDevMode } from './devMode';
import { attemptMajorBreakthrough } from '../systems/cultivation';

type Screen = 'title' | 'create' | 'destiny' | 'main' | 'death' | 'saves';
/** Why the slot list is open in pick mode. */
type Picking = { purpose: 'new' } | { purpose: 'import'; save: SaveFile } | null;
type Message = { text: string; tone: 'good' | 'bad' } | null;

export function App({ content }: { content: Content }) {
  return (
    <GlossaryProvider glossary={content.glossary}>
      <Screens content={content} />
    </GlossaryProvider>
  );
}

function Screens({ content }: { content: Content }) {
  const store = useMemo(browserStore, []);
  // Only the loaded world can be played for now (world picker comes later).
  const worlds = [content.world.id];
  const [screen, setScreen] = useState<Screen>('title');
  const [life, setLife] = useState<GameState | null>(null);
  /** Slot the current life autosaves into. */
  const [slot, setSlot] = useState<number | null>(null);
  const [rollCount, setRollCount] = useState(0);
  const [theme, setTheme] = useState<ThemePref>(loadThemePref);
  const [devMode, setDevMode] = useState(loadDevMode);
  const toggleDev = (on: boolean) => { saveDevMode(on); setDevMode(on); };
  const [savesFrom, setSavesFrom] = useState<Screen>('title');
  const [picking, setPicking] = useState<Picking>(null);
  const [message, setMessage] = useState<Message>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [, refresh] = useState(0);

  useEffect(() => applyThemePref(theme), [theme]);
  const toggleTheme = () => setTheme(nextThemePref);

  // Autosave: every change to a confirmed life (each year, choice, family action).
  useEffect(() => {
    if (!life || slot === null || !life.destiny.confirmed) return;
    setSaveFailed(!writeSlot(store, makeSave(life, slot)));
  }, [life, slot]);

  const openSaves = (from: Screen) => { setSavesFrom(from); setPicking(null); setMessage(null); setScreen('saves'); };
  const startNewLife = (target: number) => { setSlot(target); setPicking(null); setScreen('create'); };

  const loadSlot = (s: number) => {
    const r = readSlot(store, s, worlds);
    if (!r || !r.ok) { setMessage({ text: r?.error ?? 'Ô này trống.', tone: 'bad' }); return; }
    setLife(r.save.life);
    setSlot(s);
    setScreen(r.save.life.alive ? 'main' : 'death');
  };

  if (screen === 'saves') {
    const slots: SlotView[] = listSlots(store, worlds).map((summary, i) => ({ slot: i + 1, summary, taken: slotTaken(store, i + 1) }));
    return (
      <SettingsScreen
        slots={slots}
        pick={picking ? (picking.purpose === 'new' ? 'đời mới' : 'save vừa nhập') : null}
        worldName={(id) => (id === content.world.id ? content.world.name : id)}
        message={message}
        onPlay={loadSlot}
        onExport={(s) => {
          const r = readSlot(store, s, worlds);
          if (r?.ok) { const f = exportSave(r.save); downloadText(f.fileName, f.text); }
        }}
        onDelete={(s) => {
          deleteSlot(store, s);
          if (s === slot) { setSlot(null); setLife(null); }
          setMessage({ text: `Đã xóa ô ${s}.`, tone: 'good' });
        }}
        onImport={async (file) => {
          const raw = await readJsonFile(file);
          const r = raw === null ? { ok: false as const, error: 'File không phải JSON.' } : parseSave(raw, worlds);
          if (!r.ok) { setMessage({ text: r.error, tone: 'bad' }); return; }
          setMessage(null);
          setPicking({ purpose: 'import', save: r.save });
        }}
        onPick={(s) => {
          if (picking?.purpose === 'import') {
            const ok = writeSlot(store, { ...picking.save, slot: s });
            if (s === slot) { setSlot(null); setLife(null); }
            setPicking(null);
            setMessage(ok ? { text: `Đã nhập save vào ô ${s}.`, tone: 'good' } : { text: 'Trình duyệt không cho lưu.', tone: 'bad' });
            refresh((n) => n + 1);
          } else {
            startNewLife(s);
          }
        }}
        onBack={() => {
          if (picking) { setPicking(null); setMessage(null); if (picking.purpose === 'new') setScreen(savesFrom); return; }
          // The life on screen may have been deleted or replaced.
          setScreen(savesFrom === 'main' && life && slot !== null ? 'main' : 'title');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }
  if (screen === 'create') {
    return (
      <CreateCharacterScreen
        content={content}
        onBack={() => setScreen('title')}
        onCreate={(input) => { setLife(rollDestiny(createLife(input, content), content)); setScreen('destiny'); }}
      />
    );
  }
  if (screen === 'destiny' && life) {
    return (
      <DestinyRollScreen
        state={life}
        content={content}
        rollCount={rollCount}
        unlimited={devMode}
        onReroll={() => { setLife(rerollDestiny(life, content, devMode)); setRollCount((n) => n + 1); }}
        onConfirm={() => { recordNewLife(store); setLife(confirmDestiny(life, content)); setScreen('main'); }}
      />
    );
  }
  if (screen === 'death' && life) {
    // A new life from here reuses this slot, as when abandoning a life.
    return <DeathScreen state={life} content={content} onReadLog={() => setScreen('main')} onNewLife={() => setScreen('create')} />;
  }
  if (screen === 'main' && life) {
    return (
      <MainScreen
        state={life}
        content={content}
        saveWarning={saveFailed ? 'Không lưu được: trình duyệt đang chặn hoặc đầy bộ nhớ. Hãy xuất file để giữ đời này.' : null}
        onAdvance={() => setLife(advanceYear(life, content))}
        onFastForward={() => setLife(fastForward(life, content))}
        onFamilyAction={(relId, actionId) => {
          const r = performFamilyAction(life, content, relId, actionId);
          setLife(checkDeath(r.state, content));
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onBreakthrough={() => {
          const r = attemptMajorBreakthrough(life, content);
          if (!r) return null;
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onChoose={(i) => {
          const title = findEvent(content, life.events.pending ?? '')?.title ?? '';
          const r = resolveChoice(life, content, i);
          setLife(checkDeath(r.state, content));
          return { title, text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onNewLife={() => setScreen('create')}
        onSummary={() => setScreen('death')}
        onSaves={() => openSaves('main')}
        dev={devMode ? { onChange: (next) => setLife(checkDeath(next, content)), onDisable: () => toggleDev(false) } : null}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }
  const latest = latestSlot(store, worlds);
  return (
    <TitleScreen
      canContinue={latest !== null}
      livesPlayed={readMeta(store).livesPlayed}
      devMode={devMode}
      onDevUnlock={() => toggleDev(true)}
      onContinue={() => latest !== null && loadSlot(latest)}
      onStart={() => {
        const free = firstFreeSlot(store);
        if (free !== null) startNewLife(free);
        else { openSaves('title'); setPicking({ purpose: 'new' }); }
      }}
      onSaves={() => openSaves('title')}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
