// Developer mode switch, kept in this browser only. Unlocked by tapping the
// title seal DEV_TAPS times; it hides the button, it is not access control.
const KEY = 'bachthe.dev';
export const DEV_TAPS = 20;
/** Taps further apart than this start the count again. */
export const DEV_TAP_GAP_MS = 2000;
/** 9.R6a: shown before the switch turns on (Settings or the seal). */
export const DEV_WARNING = 'Đời nào chơi khi chế độ này bật sẽ bị đánh dấu: không tính thành tựu, thử thách tuần, điểm Luân Hồi, Thiên Thư và Sổ tri thức. Tắt đi rồi, dấu vẫn còn.';

export function loadDevMode(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDevMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: dev mode lasts for this visit only */
  }
}
