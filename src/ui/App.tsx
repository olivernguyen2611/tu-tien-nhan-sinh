import { useEffect, useState } from 'preact/hooks';
import type { Content } from '../core/content';
import { advanceYear, createLife } from '../core/state';
import type { GameState } from '../core/types';
import { performFamilyAction } from '../systems/relationships';
import { findEvent, resolveChoice } from '../systems/events/engine';
import { confirmDestiny, rerollDestiny, rollDestiny } from '../systems/destiny';
import { applyThemePref, loadThemePref, nextThemePref, type ThemePref } from './theme';
import { CreateCharacterScreen } from './screens/CreateCharacter';
import { DestinyRollScreen } from './screens/DestinyRoll';
import { MainScreen } from './screens/Main';
import { TitleScreen } from './screens/Title';

type Screen = 'title' | 'create' | 'destiny' | 'main';

export function App({ content }: { content: Content }) {
  const [screen, setScreen] = useState<Screen>('title');
  const [life, setLife] = useState<GameState | null>(null);
  const [rollCount, setRollCount] = useState(0);
  const [theme, setTheme] = useState<ThemePref>(loadThemePref);

  useEffect(() => applyThemePref(theme), [theme]);
  const toggleTheme = () => setTheme(nextThemePref);

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
        onReroll={() => { setLife(rerollDestiny(life, content)); setRollCount((n) => n + 1); }}
        onConfirm={() => { setLife(confirmDestiny(life, content)); setScreen('main'); }}
      />
    );
  }
  if (screen === 'main' && life) {
    return (
      <MainScreen
        state={life}
        content={content}
        onAdvance={() => setLife(advanceYear(life, content))}
        onFamilyAction={(relId, actionId) => {
          const r = performFamilyAction(life, content, relId, actionId);
          setLife(r.state);
          return { text: r.text, tone: r.tone };
        }}
        onChoose={(i) => {
          const title = findEvent(content, life.events.pending ?? '')?.title ?? '';
          const r = resolveChoice(life, content, i);
          setLife(r.state);
          return { title, text: r.text, tone: r.tone };
        }}
        onNewLife={() => setScreen('create')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }
  return <TitleScreen onStart={() => setScreen('create')} theme={theme} onToggleTheme={toggleTheme} />;
}
