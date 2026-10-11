import { render } from 'preact';
import { loadContent } from './core/content';
import { TitleScreen } from './ui/screens/Title';
import './ui/base.css';

const app = document.getElementById('app')!;

try {
  loadContent();
  render(<TitleScreen />, app);
} catch (err) {
  // Broken content should be loud during development, not a blank page.
  render(<pre class="content-error">{(err as Error).message}</pre>, app);
}
