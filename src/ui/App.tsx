import { useEffect, useState } from 'preact/hooks';
import { applyThemePref, loadThemePref, nextThemePref, type ThemePref } from './theme';
import { MainScreen } from './screens/Main';
import { TitleScreen } from './screens/Title';

export function App() {
  const [screen, setScreen] = useState<'title' | 'main'>('title');
  const [theme, setTheme] = useState<ThemePref>(loadThemePref);

  useEffect(() => applyThemePref(theme), [theme]);
  const toggleTheme = () => setTheme(nextThemePref);

  return screen === 'title' ? (
    <TitleScreen onStart={() => setScreen('main')} theme={theme} onToggleTheme={toggleTheme} />
  ) : (
    <MainScreen theme={theme} onToggleTheme={toggleTheme} />
  );
}
