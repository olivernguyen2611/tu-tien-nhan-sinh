import { ThemeToggle } from '../components/ThemeToggle';
import type { ThemePref } from '../theme';

export function TitleScreen({ canContinue, livesPlayed, onContinue, onStart, onSaves, theme, onToggleTheme }: {
  canContinue: boolean;
  livesPlayed: number;
  onContinue: () => void;
  onStart: () => void;
  onSaves: () => void;
  theme: ThemePref;
  onToggleTheme: () => void;
}) {
  return (
    <main class="title-screen">
      <div class="theme-corner">
        <ThemeToggle pref={theme} onChange={onToggleTheme} />
      </div>
      <div class="seal-mark" aria-hidden="true">仙</div>
      <h1>Tu Tiên Nhân Sinh</h1>
      <p class="subtitle">Một đời phàm nhân, vạn năm tiên lộ</p>
      {canContinue && <button class="btn-primary start" onClick={onContinue}>Tiếp tục</button>}
      <button class={canContinue ? 'btn-secondary start' : 'btn-primary start'} onClick={onStart}>Nhập thế</button>
      <button class="link-btn" onClick={onSaves}>Sổ lưu</button>
      <p class="note">{livesPlayed > 0 ? `Đã trải ${livesPlayed} kiếp · ` : ''}Bản dựng khung · đang xây dựng</p>
    </main>
  );
}
