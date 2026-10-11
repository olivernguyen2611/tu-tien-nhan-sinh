import { ThemeToggle } from '../components/ThemeToggle';
import type { ThemePref } from '../theme';

export function TitleScreen({ onStart, theme, onToggleTheme }: { onStart: () => void; theme: ThemePref; onToggleTheme: () => void }) {
  return (
    <main class="title-screen">
      <div class="theme-corner">
        <ThemeToggle pref={theme} onChange={onToggleTheme} />
      </div>
      <div class="seal-mark" aria-hidden="true">仙</div>
      <h1>Tu Tiên Nhân Sinh</h1>
      <p class="subtitle">Một đời phàm nhân, vạn năm tiên lộ</p>
      <button class="btn-primary start" onClick={onStart}>Nhập thế</button>
      <p class="note">Bản dựng khung · đang xây dựng</p>
    </main>
  );
}
