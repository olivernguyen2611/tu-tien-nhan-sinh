import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Content } from '../core/content';
import { advanceYear, createLife, fastForward } from '../core/state';
import type { GameState } from '../core/types';
import { describeChanges } from '../systems/deltas';
import { consumeItem } from '../systems/items';
import { bargain, buy, sell } from '../systems/market';
import { travel } from '../systems/regions';
import { act, settle } from '../systems/combat';
import { performFamilyAction } from '../systems/relationships';
import { findEvent, resolveChoice } from '../systems/events/engine';
import { confirmDestiny, rerollDestiny, rollDestiny } from '../systems/destiny';
import {
  deleteSlot, exportSave, firstFreeSlot, latestSlot, listSlots, makeSave, parseSave, readMeta, readSlot, recordNewLife, creditRebirth,
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
import { attemptMajorBreakthrough, enterFirstRealm } from '../systems/cultivation';
import { savesLocked } from '../systems/difficulty';
import { disableTutorial, dismissTip } from '../systems/tutorial';
import { practiceCraft } from '../systems/crafts';
import { joinCareer } from '../systems/career';
import { doMission, joinSect, leaveSect, requestMaster } from '../systems/sect';
import { learnTechnique } from '../systems/technique';
import { chooseFate, rerollFate } from '../systems/fate';
import { trainMartial } from '../systems/martial';
import { romanceAction } from '../systems/romance';
import { runSeclusion, seclude } from '../systems/seclusion';
import { placeStrand } from '../systems/goldenCore';
import { becomeGhost } from '../systems/ghost';
import { continueAsHeir } from '../systems/heir';
import { buyProperty, foundClan } from '../systems/clan';
import { meetIllusion } from '../systems/heartDemon';
import { craftRecipe } from '../systems/crafting';
import { recruitDisciple, teachDisciple } from '../systems/disciples';
import { build, decide, donate, foundSect } from '../systems/ownSect';
import { newLifeCost, rebirthPoints } from '../systems/rebirth';
import { earnedBlessings } from '../systems/blessings';
import { rewind } from '../systems/rewind';

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
  /** Luân Hồi points the life being rolled will cost once confirmed (task 5b.9). */
  const [originCost, setOriginCost] = useState(0);
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

  // Task 5b.1: a finished life pays its Luân Hồi points once (creditRebirth skips what was paid).
  const [rebirth, setRebirth] = useState<{ gained: number; bank: number }>({ gained: 0, bank: 0 });
  useEffect(() => {
    if (screen !== 'death' || !life || life.alive) return;
    const r = creditRebirth(store, life.seed, rebirthPoints(life, content).total, earnedBlessings(life, content));
    setRebirth({ gained: r.gained, bank: r.meta.rebirthPoints });
  }, [screen, life]);

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
    const slots: SlotView[] = listSlots(store, worlds).map((summary, i) => ({
      slot: i + 1, summary, taken: slotTaken(store, i + 1), locked: !!summary && savesLocked(summary, content),
    }));
    return (
      <SettingsScreen
        slots={slots}
        pick={picking ? (picking.purpose === 'new' ? 'đời mới' : 'save vừa nhập') : null}
        worldName={(id) => (id === content.world.id ? content.world.name : id)}
        message={message}
        onPlay={loadSlot}
        onExport={(s) => {
          const r = readSlot(store, s, worlds);
          if (r?.ok && !savesLocked(r.save.life, content)) { const f = exportSave(r.save); downloadText(f.fileName, f.text); }
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
          if (savesLocked(r.save.life, content)) { setMessage({ text: 'Đời này chơi ở độ khó Khó và vẫn còn sống: không nhập lại được.', tone: 'bad' }); return; }
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
        rebirthPoints={readMeta(store).rebirthPoints}
        onCreate={(input) => {
          // Task 5b.9: a chosen origin with a price is paid in Luân Hồi points when the life is confirmed.
          const cost = newLifeCost(content, input.originId);
          if (cost > readMeta(store).rebirthPoints) return;
          setOriginCost(cost);
          // Tips only for the very first life on this browser.
          setLife(rollDestiny(createLife({ ...input, tutorial: readMeta(store).livesPlayed === 0, blessings: readMeta(store).blessings?.list }, content), content));
          setScreen('destiny');
        }}
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
        onConfirm={() => { recordNewLife(store, originCost); setLife(confirmDestiny(life, content)); setScreen('main'); }}
      />
    );
  }
  if (screen === 'death' && life) {
    // A new life from here reuses this slot, as when abandoning a life.
    return (
      <DeathScreen state={life} content={content} rebirth={rebirth} onReadLog={() => setScreen('main')} onNewLife={() => setScreen('create')}
        onGhost={() => { setLife(becomeGhost(life, content)); setScreen('main'); }}
        onHeir={(id) => { setLife(continueAsHeir(life, content, id)); setScreen('main'); }}
        onRewind={() => { setLife(rewind(life, content)); setScreen('main'); }} />
    );
  }
  if (screen === 'main' && life) {
    return (
      <MainScreen
        state={life}
        content={content}
        saveWarning={saveFailed ? 'Không lưu được: trình duyệt đang chặn hoặc đầy bộ nhớ. Hãy xuất file để giữ đời này.' : null}
        onAdvance={() => setLife(life.seclusion ? runSeclusion(life, content) : advanceYear(life, content))}
        onFastForward={() => setLife(life.seclusion ? runSeclusion(life, content) : fastForward(life, content))}
        onSeclude={(years) => setLife(seclude(life, content, years))}
        onPlaceStrand={(element) => setLife(placeStrand(life, content, element).state)}
        onMeetIllusion={(option) => setLife(meetIllusion(life, content, option).state)}
        onClan={(a) => {
          const r = a.kind === 'found' ? foundClan(life, content, a.rules) : buyProperty(life, content, a.propertyId);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onDisciple={(npcId) => {
          const r = npcId ? teachDisciple(life, content, npcId) : recruitDisciple(life, content);
          if (!r) return null;
          setLife(r.state);
          return { text: r.text, tone: 'good', changes: describeChanges(life, r.state) };
        }}
        onCraft={(recipeId) => {
          const r = craftRecipe(life, content, recipeId);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onFamilyAction={(relId, actionId) => {
          const r = performFamilyAction(life, content, relId, actionId);
          setLife(checkDeath(r.state, content));
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onRomance={(npcId, action) => {
          const r = romanceAction(life, content, npcId, action);
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onCombat={(action, itemId) => {
          const r = act(life, content, action, itemId);
          setLife(r.state.combat ? r.state : runSeclusion(checkDeath(r.state, content, r.state.stats.health <= 0 ? 'combat' : undefined), content));
        }}
        onSettle={(choice) => setLife(runSeclusion(checkDeath(settle(life, content, choice).state, content), content))}
        onMarket={(marketId, action) => {
          const r = action.kind === 'buy' ? buy(life, content, marketId, action.itemId)
            : action.kind === 'sell' ? sell(life, content, marketId, action.itemId)
            : bargain(life, content, marketId);
          setLife(r.state);
          return { text: r.text, tone: r.tone };
        }}
        onTravel={(regionId) => {
          const r = travel(life, content, regionId, devMode);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onUseItem={(itemId) => {
          const r = consumeItem(life, content, itemId);
          setLife(checkDeath(r.state, content));
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onPractice={(craftId) => {
          const r = practiceCraft(life, content, craftId);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onJoinCareer={(careerId) => {
          const r = joinCareer(life, content, careerId);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onTrain={() => {
          const r = trainMartial(life, content);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onLearn={(id) => {
          const r = learnTechnique(life, content, id);
          if (!r) return null;
          setLife(enterFirstRealm(r.state, content));
          return r.text;
        }}
        onSectAction={(a) => {
          const r = a.kind === 'join' ? joinSect(life, content, a.sectId)
            : a.kind === 'mission' ? doMission(life, content, a.missionId)
            : a.kind === 'learn' ? (() => { const l = learnTechnique(life, content, a.techniqueId); return l && { ...l, state: enterFirstRealm(l.state, content) }; })()
            : a.kind === 'master' ? requestMaster(life, content)
            : a.kind === 'found' ? foundSect(life, content, { name: a.name, rules: a.rules })
            : a.kind === 'decide' ? decide(life, content, a.decisionId)
            : a.kind === 'build' ? build(life, content, a.buildingId)
            : a.kind === 'donate' ? donate(life, content)
            : leaveSect(life, content);
          if (!r || !r.text) return null;
          setLife(r.state);
          const good: boolean = 'joined' in r ? (r.joined as boolean) : 'success' in r ? (r.success as boolean) : true;
          return { text: r.text, good };
        }}
        onFate={(a) => setLife('choose' in a ? runSeclusion(chooseFate(life, content, a.choose), content) : rerollFate(life, content, devMode))}
        onTip={(id, off) => setLife(off ? disableTutorial(dismissTip(life, id)) : dismissTip(life, id))}
        onBreakthrough={() => {
          const r = attemptMajorBreakthrough(life, content);
          if (!r) return null;
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onChoose={(i) => {
          const title = findEvent(content, life.events.pending ?? '')?.title ?? '';
          const r = resolveChoice(life, content, i);
          // An event may close the door for some years (task 4.1).
          setLife(runSeclusion(checkDeath(r.state, content), content));
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
      rebirthPoints={readMeta(store).rebirthPoints}
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
