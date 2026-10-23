import { useRef, useState } from 'preact/hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import { DEV_TAP_GAP_MS, DEV_TAPS, DEV_WARNING } from '../devMode';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { ThemePref } from '../theme';

export function TitleScreen({ canContinue, livesPlayed, rebirthPoints, devMode, onDevUnlock, onDevOff, onContinue, onStart, onSaves, onSettings, onRebirth, onCodex, onChallenge, theme, onToggleTheme }: {
  canContinue: boolean;
  livesPlayed: number;
  /** Task 5b.1: Luân Hồi points kept across lives. */
  rebirthPoints: number;
  devMode: boolean;
  /** Called after the seal is tapped DEV_TAPS times in a row. */
  onDevUnlock: () => void;
  /** Turns the developer mode off (a button shown while it is on). */
  onDevOff: () => void;
  onContinue: () => void;
  onStart: () => void;
  onSaves: () => void;
  /** Góp ý 23/10: Cài đặt (settings, developer mode switch). */
  onSettings: () => void;
  /** Task 5b.1: the Luân Hồi đài (shown once a life has ended). */
  onRebirth: () => void;
  /** Task 5b.4: Thiên Thư. */
  onCodex: () => void;
  /** Task 5b.6: thử thách tuần. */
  onChallenge: () => void;
  theme: ThemePref;
  onToggleTheme: () => void;
}) {
  // Hidden unlock: tap the seal 20 times (no more than 2 s apart).
  const taps = useRef({ count: 0, at: 0 });
  const [left, setLeft] = useState<number | null>(null);
  const [ask, setAsk] = useState(false);
  const tapSeal = () => {
    if (devMode) return;
    const now = Date.now();
    const t = taps.current;
    t.count = now - t.at > DEV_TAP_GAP_MS ? 1 : t.count + 1;
    t.at = now;
    if (t.count >= DEV_TAPS) {
      t.count = 0;
      setLeft(null);
      setAsk(true);
    } else {
      setLeft(t.count >= DEV_TAPS - 5 ? DEV_TAPS - t.count : null);
    }
  };

  return (
    <main class="title-screen">
      <div class="theme-corner">
        <ThemeToggle pref={theme} onChange={onToggleTheme} />
      </div>
      <div class="seal-mark" aria-hidden="true" onClick={tapSeal}>仙</div>
      {left !== null && <p class="dev-hint" role="status">Còn {left} lần nữa…</p>}
      {devMode && <p class="dev-hint">Developer mode đang bật · <button class="link-btn dev-off" onClick={onDevOff}>Tắt</button></p>}
      <h1>Bách Thế Luân Hồi</h1>
      <p class="subtitle">Trăm kiếp luân hồi, một đường cầu đạo</p>
      {canContinue && <button class="btn-primary start" onClick={onContinue}>Tiếp tục</button>}
      <button class={canContinue ? 'btn-secondary start' : 'btn-primary start'} onClick={onStart}>Nhập thế</button>
      <button class="link-btn" onClick={onSaves}>Sổ lưu</button>
      <button class="link-btn" onClick={onSettings}>Cài đặt</button>
      {(livesPlayed > 0 || rebirthPoints > 0) && <button class="link-btn" onClick={onRebirth}>Luân Hồi Đài</button>}
      {(livesPlayed > 0 || devMode) && <button class="link-btn" onClick={onCodex}>Thiên Thư</button>}
      {(livesPlayed > 0 || devMode) && <button class="link-btn" onClick={onChallenge}>Thử thách tuần</button>}
      <p class="note">{livesPlayed > 0 ? `Đã trải ${livesPlayed} kiếp · ` : ''}{rebirthPoints > 0 ? `${rebirthPoints} điểm Luân Hồi · ` : ''}Bản thử nghiệm {__APP_VERSION__}</p>
      {ask && <ConfirmDialog title="Bật chế độ thử nghiệm?" text={DEV_WARNING} confirmLabel="Bật" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); onDevUnlock(); }} />}
    </main>
  );
}
