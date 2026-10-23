// Cài đặt (góp ý 23/10): the player's settings in a sheet over the current screen, opened by the gear
// on the title, in the in-game header and from Sổ lưu: look, sound, pace, text size, motion, sensitive
// content, developer mode.
import { useState } from 'preact/hooks';
import { useBackClose } from './useBackClose';
import { ConfirmDialog } from './ConfirmDialog';
import { ThemeToggle } from './ThemeToggle';
import { DEV_WARNING } from '../devMode';
import { FONT_LABELS, type Prefs } from '../prefs';
import type { ThemePref } from '../theme';

/** Bánh răng drawn inline (no image asset), coloured by the button's text colour. */
export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
      <path d="M10.3 2.5h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function SettingsPanel({ onClose, theme, onToggleTheme, sound, onToggleSound, devMode, onToggleDev, prefs, onPrefs, ffChoices, ffDefault }: {
  onClose: () => void;
  theme: ThemePref;
  onToggleTheme: () => void;
  sound: boolean;
  onToggleSound: () => void;
  /** 9.R6a: the developer mode switch; turning it on asks first. */
  devMode: boolean;
  onToggleDev: (on: boolean) => void;
  /** 9.R11: pace, text size, motion, sensitive content. */
  prefs: Prefs;
  onPrefs: (next: Prefs) => void;
  ffChoices: number[];
  ffDefault: number;
}) {
  const [askDev, setAskDev] = useState(false);
  useBackClose(true, onClose);
  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cài đặt" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card settings-panel">
        <div class="settings-head">
          <h2>Cài đặt</h2>
          <button class="icon-btn" aria-label="Đóng" title="Đóng" onClick={onClose}>✕</button>
        </div>
        <div class="settings-row">
          <span>Giao diện</span>
          <ThemeToggle pref={theme} onChange={onToggleTheme} />
        </div>
        <div class="settings-row">
          <span>Âm thanh (chuông, mõ)</span>
          <button class="chip-btn" role="switch" aria-checked={sound} onClick={onToggleSound}>{sound ? 'Bật' : 'Tắt'}</button>
        </div>
        <div class="settings-row">
          <span>Tua nhanh tối đa</span>
          <select class="chip-btn" aria-label="Số năm tối đa mỗi lần tua nhanh" value={String(prefs.ffYears ?? ffDefault)}
            onChange={(e) => onPrefs({ ...prefs, ffYears: Number((e.target as HTMLSelectElement).value) })}>
            {ffChoices.map((n) => <option key={n} value={String(n)}>{n} năm</option>)}
          </select>
        </div>
        <div class="settings-row">
          <span>Cỡ chữ</span>
          <div class="chip-group" role="radiogroup" aria-label="Cỡ chữ">
            {FONT_LABELS.map(([f, label]) => (
              <button key={f} class={`chip-btn${prefs.font === f ? ' on' : ''}`} role="radio" aria-checked={prefs.font === f} onClick={() => onPrefs({ ...prefs, font: f })}>{label}</button>
            ))}
          </div>
        </div>
        <div class="settings-row">
          <span>Giảm chuyển động</span>
          <button class="chip-btn" role="switch" aria-checked={prefs.reduceMotion} onClick={() => onPrefs({ ...prefs, reduceMotion: !prefs.reduceMotion })}>{prefs.reduceMotion ? 'Bật' : 'Tắt'}</button>
        </div>
        <div class="settings-row">
          <span>Ẩn nội dung nhạy cảm<small class="muted settings-sub">Bỏ các biến cố tàn độc, ma đạo hắc ám và chuyện thân mật. Có hiệu lực từ năm kế tiếp.</small></span>
          <button class="chip-btn" role="switch" aria-checked={prefs.gentle} onClick={() => onPrefs({ ...prefs, gentle: !prefs.gentle })}>{prefs.gentle ? 'Bật' : 'Tắt'}</button>
        </div>
        <div class="settings-row">
          <span>Chế độ thử nghiệm</span>
          <button class="chip-btn" role="switch" aria-checked={devMode} onClick={() => (devMode ? onToggleDev(false) : setAskDev(true))}>{devMode ? 'Bật' : 'Tắt'}</button>
        </div>
        {devMode && <p class="settings-note">Đang bật chế độ thử nghiệm. Tắt ở đây thì đời đang chơi vẫn giữ dấu thử nghiệm.</p>}

        {askDev && (
          <ConfirmDialog
            title="Bật chế độ thử nghiệm?"
            text={DEV_WARNING}
            confirmLabel="Bật"
            onCancel={() => setAskDev(false)}
            onConfirm={() => { setAskDev(false); onToggleDev(true); }}
          />
        )}
      </div>
    </div>
  );
}
