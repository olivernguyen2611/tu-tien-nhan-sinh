import { render } from 'preact';
import { loadContent } from './core/content';
import { App } from './ui/App';
import { applyThemePref, loadThemePref } from './ui/theme';
import './ui/theme.css';

const app = document.getElementById('app')!;
applyThemePref(loadThemePref());

try {
  loadContent();
  render(<App />, app);
} catch (err) {
  // Broken content should be loud during development, not a blank page.
  render(<pre class="content-error">{(err as Error).message}</pre>, app);
}
