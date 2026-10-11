import { useEffect, useState } from 'preact/hooks';
import type { Content } from '../core/content';
import { advanceYear, createLife } from '../core/state';
import type { GameState } from '../core/types';
import { applyThemePref, loadThemePref, nextThemePref, type ThemePref } from './theme';
import { CreateCharacterScreen } from './screens/CreateCharacter';
import { MainScreen } from './screens/Main';
import { TitleScreen } from './screens/Title';

type Screen = 'title' | 'create' | 'main';

export function App({ content }: { content: Content }) {
  const [screen, setScreen] = useState<Screen>('title');
  const [life, setLife] = useState<GameState | null>(null);
  const [theme, setTheme] = useState<ThemePref>(loadThemePref);

  useEffect(() => applyThemePref(theme), [theme]);
  const toggleTheme = () => setTheme(nextThemePref);

  if (screen === 'create') {
    return (
      <CreateCharacterScreen
        content={content}
        onBack={() => setScreen('title')}
        onCreate={(input) => { setLife(createLife(input, content)); setScreen('main'); }}
      />
    );
  }
  if (screen === 'main' && life) {
    return (
      <MainScreen
        state={life}
        content={content}
        onAdvance={() => setLife(advanceYear(life))}
        onNewLife={() => setScreen('create')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }
  return <TitleScreen onStart={() => setScreen('create')} theme={theme} onToggleTheme={toggleTheme} />;
}
