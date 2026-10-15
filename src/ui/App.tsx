import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { goLeisure } from '../systems/leisure';
import { rentCave } from '../systems/cave';
import type { Content } from '../core/content';
import { advanceYear, createLife, fastForward, fillTemplate } from '../core/state';
import type { GameState } from '../core/types';
import { describeChanges } from '../systems/deltas';
import { consumeItem } from '../systems/items';
import { doFingerAction } from '../systems/fingerActions';
import { bargain, buy, sell, buyScroll, placeBid } from '../systems/market';
import { travel } from '../systems/regions';
import { act, settle } from '../systems/combat';
import { performFamilyAction } from '../systems/relationships';
import { doBond } from '../systems/familyBond';
import { findEvent, resolveChoice } from '../systems/events/engine';
import { confirmDestiny, lockCost, rerollDestiny, rollDestiny, toggleLock } from '../systems/destiny';
import {
  deleteSlot, exportSave, firstFreeSlot, latestSlot, listSlots, makeSave, parseSave, readMeta, readSlot, recordNewLife, creditRebirth,
  slotTaken, writeSlot, SLOT_COUNT, buyRebirthTalent, recordCodex, recordAchievements, recordChallenge, recordPastSect, recordLibrary, replaceMeta, type SaveFile,
} from '../systems/save';
import { checkDeath } from '../systems/time';
import { GlossaryProvider } from './components/Tooltip';
import { browserStore, downloadText, readJsonFile } from './storage';
import { cueFor, loadSoundPref, playCue, saveSoundPref } from './audio';
import { applyThemePref, loadThemePref, nextThemePref, type ThemePref } from './theme';
import { CreateCharacterScreen } from './screens/CreateCharacter';
import { DeathScreen } from './screens/Death';
import { DestinyRollScreen } from './screens/DestinyRoll';
import { MainScreen } from './screens/Main';
import { SettingsScreen, type SlotView } from './screens/Settings';
import { TitleScreen } from './screens/Title';
import { loadDevMode, saveDevMode } from './devMode';
import { countsForRecords, markDevLife } from '../systems/dev';
import { attemptMajorBreakthrough, enterFirstRealm } from '../systems/cultivation';
import { savesLocked } from '../systems/difficulty';
import { disableTutorial, dismissTip } from '../systems/tutorial';
import { practiceCraft } from '../systems/crafts';
import { joinCareer } from '../systems/career';
import { doMission, joinSect, leaveSect, requestMaster } from '../systems/sect';
import { rewardElder } from '../systems/sectElders';
import { recruitNpc } from '../systems/sectRecruit';
import { buyTreasury } from '../systems/sectTreasury';
import { doChainStep, startChain } from '../systems/sectChains';
import { doTalk, enterTournament } from '../systems/sectmates';
import { learnTechnique } from '../systems/technique';
import { chooseFate, rerollFate } from '../systems/fate';
import { trainMartial } from '../systems/martial';
import { beginQuestStep, miniGameHide, miniGameInput, miniGameQuit } from '../systems/martialQuest';
import { romanceAction } from '../systems/romance';
import { giftNpc } from '../systems/npcGift';
import { doNpcAct } from '../systems/npcActs';
import { runSeclusion, seclude } from '../systems/seclusion';
import { placeStrand } from '../systems/goldenCore';
import { becomeGhost } from '../systems/ghost';
import { continueAsHeir } from '../systems/heir';
import { buyProperty, foundClan } from '../systems/clan';
import { meetIllusion } from '../systems/heartDemon';
import { craftRecipe } from '../systems/crafting';
import { doDiscipleAct } from '../systems/discipleActs';
import { recruitDisciple, teachDisciple } from '../systems/disciples';
import { build, decide, donate, foundSect } from '../systems/ownSect';
import { newLifeCost, rebirthPoints } from '../systems/rebirth';
import { earnedBlessings } from '../systems/blessings';
import { rewind } from '../systems/rewind';
import { addToLibrary, importPerson, personFromLife, personFromNpc, removeFromLibrary } from '../systems/npcLibrary';
import { onYearAdvanced, recordSnapshot, rewind as rewindTime, rewindOptions, type Snapshot } from '../systems/timeline';
import { nextTalentCost } from '../systems/rebirthTalents';
import { rollBirthFinger } from '../systems/goldenFinger';
import { RebirthScreen } from './screens/Rebirth';
import { CodexScreen } from './screens/Codex';
import { codexOf } from '../systems/codex';
import { visibleGlossary } from '../systems/knowledge';
import { earnedAchievements, unlockedFingers } from '../systems/achievements';
import { challengeDef, challengeResult, creditKey, startChallenge, weekKey, weeklyChallenge } from '../systems/challenge';
import { ChallengeScreen } from './screens/Challenge';
import { nextPastSectRecord } from '../systems/pastSect';

type Screen = 'title' | 'create' | 'destiny' | 'main' | 'death' | 'saves' | 'rebirth' | 'codex' | 'challenge';
/** Why the slot list is open in pick mode. */
type Picking = { purpose: 'new' } | { purpose: 'challenge' } | { purpose: 'import'; save: SaveFile } | null;
type Message = { text: string; tone: 'good' | 'bad' } | null;

export function App({ content }: { content: Content }) {
  // 9.R5b: glossary terms open as the Sổ tri thức grows (Screens reports what is known).
  const [known, setKnown] = useState<string[]>([]);
  const glossary = useMemo(() => visibleGlossary(content, known), [content, known]);
  return (
    <GlossaryProvider glossary={glossary}>
      <Screens content={content} onKnown={setKnown} />
    </GlossaryProvider>
  );
}

function Screens({ content, onKnown }: { content: Content; onKnown: (known: string[]) => void }) {
  const store = useMemo(browserStore, []);
  // Only the loaded world can be played for now (world picker comes later).
  const worlds = [content.world.id];
  // A fresh life: old saves get any field they lack from it (save.ts backfillLife).
  const freshLife = useMemo(() => createLife({ seed: 'backfill' }, content), [content]);
  const [screen, setScreen] = useState<Screen>('title');
  const [life, setLife] = useState<GameState | null>(null);
  // 9.R5b: what this life (or, between lives, the Thiên Thư) knows decides which glossary terms show.
  const knownKey = (life?.knowledge ?? readMeta(store).codex.knowledge).join(',');
  useEffect(() => onKnown(knownKey ? knownKey.split(',') : []), [knownKey]);
  /** Slot the current life autosaves into. */
  const [slot, setSlot] = useState<number | null>(null);
  const [rollCount, setRollCount] = useState(0);
  /** Luân Hồi points the life being rolled will cost once confirmed (task 5b.9). */
  const [originCost, setOriginCost] = useState(0);
  const [theme, setTheme] = useState<ThemePref>(loadThemePref);
  const [devMode, setDevMode] = useState(loadDevMode);
  const toggleDev = (on: boolean) => { saveDevMode(on); setDevMode(on); };
  // 9.R6a: playing with developer mode on marks the life (no records).
  useEffect(() => { if (devMode && life && life.destiny.confirmed && !life.devUsed) setLife(markDevLife(life)); }, [devMode, life]);
  const [savesFrom, setSavesFrom] = useState<Screen>('title');
  const [picking, setPicking] = useState<Picking>(null);
  const [message, setMessage] = useState<Message>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [, refresh] = useState(0);
  /** Developer mode's per-year snapshots (backlog 6); memory only. */
  const history = useRef<Snapshot[]>([]);
  useEffect(() => {
    if (!devMode) { history.current = []; return; }
    const keep = content.balance.dev.rewindKeepYears;
    return onYearAdvanced((s) => { history.current = recordSnapshot(history.current, s, keep); });
  }, [devMode, content]);
  useEffect(() => {
    // The age the life stands at when dev mode starts to watch it is the first snapshot.
    if (devMode && life && !history.current.some((h) => h.state.seed === life.seed)) history.current = recordSnapshot([], life, content.balance.dev.rewindKeepYears);
  }, [devMode, life?.seed]);

  const [sound, setSound] = useState(loadSoundPref);
  const toggleSound = () => { saveSoundPref(!sound); setSound(!sound); if (!sound) playCue('event'); };
  const lastLife = useRef<GameState | null>(null);
  useEffect(() => {
    const cue = cueFor(lastLife.current, life);
    lastLife.current = life;
    if (sound && cue) playCue(cue);
    if (cue === 'breakthrough' || cue === 'death') setFx({ cue, n: Date.now() });
  }, [life]);
  /** Edge glow after a breakthrough or a death, shown through <html data-fx>. */
  const [fx, setFx] = useState<{ cue: 'breakthrough' | 'death'; n: number } | null>(null);
  useEffect(() => {
    if (!fx) return;
    const root = document.documentElement;
    root.dataset.fx = fx.cue;
    const t = setTimeout(() => { delete root.dataset.fx; setFx(null); }, 2400);
    return () => { clearTimeout(t); delete root.dataset.fx; };
  }, [fx]);

  useEffect(() => applyThemePref(theme), [theme]);
  const toggleTheme = () => setTheme(nextThemePref);

  // Autosave: every change to a confirmed life (each year, choice, family action).
  useEffect(() => {
    if (!life || slot === null || !life.destiny.confirmed) return;
    setSaveFailed(!writeSlot(store, makeSave(life, slot)));
  }, [life, slot]);

  // Task 5b.1: a finished life pays its Luân Hồi points once (creditRebirth skips what was paid).
  const [rebirth, setRebirth] = useState<{ gained: number; bank: number; fresh: string[] }>({ gained: 0, bank: 0, fresh: [] });
  useEffect(() => {
    if (screen !== 'death' || !life || life.alive) return;
    // 9.R6a: a dev life earns nothing.
    if (!countsForRecords(life)) { setRebirth({ gained: 0, bank: readMeta(store).rebirthPoints, fresh: [] }); return; }
    // Task 5b.6: every try of a weekly challenge shares a seed, so points are credited per try.
    const key = creditKey(life);
    const first = !(key in readMeta(store).credited);
    const r = creditRebirth(store, key, rebirthPoints(life, content).total, life.challenge ? [] : earnedBlessings(life, content));
    const result = challengeResult(life, content);
    if (first && result && life.challenge) recordChallenge(store, life.challenge.week, life.challenge.id, result.score, result.done);
    // Task 5b.7: the sect this life ran waits for later lives.
    if (first) recordPastSect(store, nextPastSectRecord(readMeta(store).pastSect, life, content));
    // Task 5b.4: the Thiên Thư keeps what this life saw, and the khí vận chi tử's tale.
    recordCodex(store, codexOf(life, content));
    // Task 5b.5: thành tựu kept across lives; the ones new to this browser are shown.
    const a = recordAchievements(store, earnedAchievements(life, content, r.meta.livesPlayed).map((x) => x.id), life.character.name);
    setRebirth({ gained: r.gained, bank: r.meta.rebirthPoints, fresh: a.fresh });
  }, [screen, life]);

  /** Where the Luân Hồi đài returns to. */
  const [rebirthFrom, setRebirthFrom] = useState<Screen>('title');
  const openRebirth = (from: Screen) => { setRebirthFrom(from); setScreen('rebirth'); };

  const openSaves = (from: Screen) => { setSavesFrom(from); setPicking(null); setMessage(null); setScreen('saves'); };
  const startNewLife = (target: number) => { setSlot(target); setPicking(null); setScreen('create'); };
  // Task 5b.6: this week's challenge goes straight to the (fixed) destiny roll.
  const week = weekKey(new Date());
  // Developer mode may pick any challenge instead of this week's.
  const [challengePick, setChallengePick] = useState<string | null>(null);
  const beginChallenge = (target: number) => {
    const s = startChallenge(content, week, (readMeta(store).weekly[week]?.tries ?? 0) + 1, readMeta(store).livesPlayed === 0, devMode ? challengePick : null);
    if (!s) return;
    setSlot(target);
    setPicking(null);
    setOriginCost(0);
    setLife(s);
    setScreen('destiny');
  };

  const loadSlot = (s: number) => {
    const r = readSlot(store, s, worlds, freshLife);
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
        library={readMeta(store).library}
        realmName={(id) => content.cultivation.realms.realms.find((r) => r.id === id)?.name ?? id}
        onSavePlayer={(s) => {
          const r = readSlot(store, s, worlds, freshLife);
          if (!r || !r.ok) return;
          const added = addToLibrary(readMeta(store).library, personFromLife(r.save.life, content), content);
          recordLibrary(store, added.library);
          setMessage({ text: added.text, tone: added.text === content.lifeTexts.npcLibrary.texts.full ? 'bad' : 'good' });
        }}
        onRemovePerson={(id) => {
          const r = removeFromLibrary(readMeta(store).library, id, content);
          recordLibrary(store, r.library);
          setMessage({ text: r.text, tone: 'good' });
        }}
        pick={picking ? (picking.purpose === 'new' ? 'đời mới' : picking.purpose === 'challenge' ? 'thử thách tuần' : 'save vừa nhập') : null}
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
          const r = raw === null ? { ok: false as const, error: 'File không phải JSON.' } : parseSave(raw, worlds, freshLife);
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
          } else if (picking?.purpose === 'challenge') {
            beginChallenge(s);
          } else {
            startNewLife(s);
          }
        }}
        onBack={() => {
          if (picking) { setPicking(null); setMessage(null); if (picking.purpose !== 'import') setScreen(savesFrom); return; }
          // The life on screen may have been deleted or replaced.
          setScreen(savesFrom === 'main' && life && slot !== null ? 'main' : 'title');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        sound={sound}
        devMode={devMode}
        onToggleDev={toggleDev}
        onToggleSound={toggleSound}
      />
    );
  }
  if (screen === 'challenge') {
    return (
      <ChallengeScreen content={content} week={week} challenge={(devMode && challengeDef(content, challengePick ?? undefined)) || weeklyChallenge(content, week)} record={readMeta(store).weekly[week]}
        devPick={devMode ? setChallengePick : null}
        onBack={() => setScreen('title')}
        onStart={() => {
          const free = firstFreeSlot(store);
          if (free !== null) beginChallenge(free);
          else { openSaves('challenge'); setPicking({ purpose: 'challenge' }); }
        }} />
    );
  }
  if (screen === 'codex') {
    return <CodexScreen content={content} codex={readMeta(store).codex} achievements={readMeta(store).achievements} onBack={() => setScreen('title')} />;
  }
  if (screen === 'rebirth') {
    const meta = readMeta(store);
    return (
      <RebirthScreen content={content} points={meta.rebirthPoints} owned={meta.rebirthTalents} known={meta.codex.knowledge}
        onBuy={(id) => {
          const cost = nextTalentCost(content, meta.rebirthTalents, id, meta.codex.knowledge);
          if (cost !== null && buyRebirthTalent(store, id, cost)) refresh((n) => n + 1);
        }}
        onBack={() => setScreen(rebirthFrom === 'death' && life && !life.alive ? 'death' : 'title')} />
    );
  }
  if (screen === 'create') {
    return (
      <CreateCharacterScreen
        content={content}
        onBack={() => setScreen('title')}
        rebirthPoints={readMeta(store).rebirthPoints}
        known={readMeta(store).codex.knowledge}
        fingers={unlockedFingers(content, Object.keys(readMeta(store).achievements))}
        onCreate={(input) => {
          // Task 5b.9: a chosen origin with a price is paid in Luân Hồi points when the life is confirmed;
          // so is a Kim Thủ Chỉ chosen from those thành tựu unlocked (task 5b.5).
          const cost = newLifeCost(content, input.originId) + (input.goldenFinger ? content.balance.goldenFinger.chooseCost : 0);
          if (cost > readMeta(store).rebirthPoints) return;
          setOriginCost(cost);
          // Tips only for the very first life on this browser.
          setLife(rollDestiny(createLife({ ...input, tutorial: readMeta(store).livesPlayed === 0, blessings: readMeta(store).blessings?.list, rebirthTalents: readMeta(store).rebirthTalents, pastSect: readMeta(store).pastSect, knowledge: readMeta(store).codex.knowledge,
            goldenFinger: input.goldenFinger ?? rollBirthFinger(input.seed, content, readMeta(store).livesPlayed, readMeta(store).fingerPity) }, content), content));
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
        lockCost={devMode ? 0 : content.balance.traits.lockCost}
        canLock={life.destiny.locked.length < life.destiny.maxLocks
          && (devMode || originCost + lockCost(life, content) + content.balance.traits.lockCost <= readMeta(store).rebirthPoints)}
        onLock={(id) => setLife(toggleLock(life, id))}
        onReroll={() => { setLife(rerollDestiny(life, content, devMode)); setRollCount((n) => n + 1); }}
        onConfirm={() => {
          recordNewLife(store, originCost + (devMode ? 0 : lockCost(life, content)), !!life.goldenFinger, !!life.challenge);
          const born = confirmDestiny(life, content);
          if (countsForRecords(born)) recordCodex(store, codexOf(born, content));
          setLife(born);
          setScreen('main');
        }}
      />
    );
  }
  if (screen === 'death' && life) {
    // A new life from here reuses this slot, as when abandoning a life.
    return (
      <DeathScreen state={life} content={content} rebirth={rebirth} lives={readMeta(store).livesPlayed} onReadLog={() => setScreen('main')} onNewLife={() => setScreen('create')}
        onGhost={() => { setLife(becomeGhost(life, content)); setScreen('main'); }}
        onHeir={(id) => { setLife(continueAsHeir(life, content, id)); setScreen('main'); }}
        onRewind={() => { setLife(rewind(life, content)); setScreen('main'); }}
        onRebirth={() => openRebirth('death')} />
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
        onLeisure={() => { const r = goLeisure(life, content); if (r) setLife(r.state); }}
        onSeclude={(years) => setLife(seclude(life, content, years))}
        onRentCave={(years) => { const r = rentCave(life, content, years); if (!r) return null; setLife(r.state); return r.text; }}
        onPlaceStrand={(element) => setLife(placeStrand(life, content, element).state)}
        onMeetIllusion={(option) => setLife(meetIllusion(life, content, option).state)}
        onClan={(a) => {
          const r = a.kind === 'found' ? foundClan(life, content, a.rules) : buyProperty(life, content, a.propertyId);
          if (!r) return null;
          setLife(r.state);
          return r.text;
        }}
        onDisciple={(npcId, act) => {
          const r = npcId && act ? doDiscipleAct(life, content, npcId, act) : npcId ? teachDisciple(life, content, npcId) : recruitDisciple(life, content);
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
        getSources={() => {
          // The book first, then the protagonist of every other slot (not the life being played).
          const book = readMeta(store).library;
          const fromSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)
            .filter((s) => s !== slot)
            .map((s) => readSlot(store, s, worlds, freshLife))
            .flatMap((r) => (r && r.ok ? [personFromLife(r.save.life, content)] : []))
            .filter((p) => !book.some((b) => b.id === p.id));
          return [...book, ...fromSlots];
        }}
        onImport={(person, setup) => {
          const r = importPerson(life, content, person, setup);
          if (r.ok) setLife(r.state);
          return { ok: r.ok, text: r.text };
        }}
        onSaveNpc={(npcId) => {
          const npc = life.npcs.find((n) => n.id === npcId);
          if (!npc) return { text: '', tone: 'normal' };
          const r = addToLibrary(readMeta(store).library, personFromNpc(life, npc), content);
          recordLibrary(store, r.library);
          refresh((n) => n + 1);
          return { text: r.text, tone: r.text === content.lifeTexts.npcLibrary.texts.full ? 'bad' : 'good' };
        }}
        onBond={(target, action, arg) => {
          const r = doBond(life, content, target, action, arg);
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onRomance={(npcId, action) => {
          const r = romanceAction(life, content, npcId, action);
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onNpcAct={(npcId, actId) => {
          const r = doNpcAct(life, content, npcId, actId);
          if (!r) return null;
          setLife(r.state);
          return { text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onGiftNpc={(npcId, itemId) => {
          const r = giftNpc(life, content, npcId, itemId);
          if (!r) return null;
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
            : action.kind === 'scroll' ? buyScroll(life, content, marketId, action.techId)
            : action.kind === 'bid' ? placeBid(life, content, marketId, action.lot, action.bid)
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
        onFingerAction={(actionId) => {
          const r = doFingerAction(life, content, actionId);
          if (!r) return null;
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
        onQuest={(a) => {
          if (a.kind === 'hide') { setLife(miniGameHide(life)); return null; }
          if (a.kind === 'input') { const r = miniGameInput(life, content, a.symbol); setLife(r.state); return r.done ? r.text : null; }
          if (a.kind === 'quit') { const r = miniGameQuit(life, content); setLife(r.state); return r.text; }
          const r = beginQuestStep(life, content, a.aid);
          if (!r) return null;
          setLife(r.state);
          return r.text || null;
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
            : a.kind === 'buy' ? buyTreasury(life, content, a.id)
            : a.kind === 'chain' ? (a.start ? startChain(life, content, a.id) : doChainStep(life, content, a.id))
            : a.kind === 'tournament' ? enterTournament(life, content, a.id)
            : a.kind === 'talk' ? doTalk(life, content, a.npcId, a.talkId)
            : a.kind === 'found' ? foundSect(life, content, { name: a.name, rules: a.rules })
            : a.kind === 'decide' ? decide(life, content, a.decisionId)
            : a.kind === 'build' ? build(life, content, a.buildingId)
            : a.kind === 'donate' ? donate(life, content)
            : a.kind === 'elder' ? rewardElder(life, content, a.npcId)
            : a.kind === 'recruit' ? recruitNpc(life, content, a.npcId)
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
          const pendingEvent = findEvent(content, life.events.pending ?? '');
          const title = pendingEvent ? fillTemplate(pendingEvent.title, life, content) : '';
          const r = resolveChoice(life, content, i);
          // An event may close the door for some years (task 4.1).
          setLife(runSeclusion(checkDeath(r.state, content), content));
          return { title, text: r.text, tone: r.tone, changes: describeChanges(life, r.state) };
        }}
        onNewLife={() => setScreen('create')}
        onSummary={() => setScreen('death')}
        onSaves={() => openSaves('main')}
        dev={devMode ? { rewinds: rewindOptions(history.current, life, content), onRewindTime: (years) => { const r = rewindTime(history.current, life, years); if (r) { history.current = r.history; setLife(r.state); } }, meta: readMeta(store), onChange: (next) => setLife(checkDeath(next, content)), onMeta: (m) => { replaceMeta(store, m); refresh((n) => n + 1); }, onDisable: () => toggleDev(false) } : null}
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
      onRebirth={() => openRebirth('title')}
      onCodex={() => setScreen('codex')}
      onChallenge={() => setScreen('challenge')}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
