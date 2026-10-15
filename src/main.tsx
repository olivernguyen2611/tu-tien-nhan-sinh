import { render } from 'preact';
import { loadContent } from './core/content';
import { App } from './ui/App';
import { applyThemePref, loadThemePref } from './ui/theme';
import { browserStore } from './ui/storage';
import './ui/theme.css';

const app = document.getElementById('app')!;
// 9.R1: move saves and settings from the old name's keys before anything reads them.
browserStore();
applyThemePref(loadThemePref());

try {
  const content = loadContent();
  render(<App content={content} />, app);
} catch (err) {
  // Broken content should be loud during development, not a blank page.
  render(<pre class="content-error">{(err as Error).message}</pre>, app);
}

// Offline play + installable app (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
