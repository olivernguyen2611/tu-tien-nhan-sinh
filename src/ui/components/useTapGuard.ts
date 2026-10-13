// 6b.13 (lỗi #16): a button that appears where the finger just tapped ignores taps for a moment,
// so a double tap on a choice does not also press "Tiếp tục".
import { useEffect, useState } from 'preact/hooks';

const GUARD_MS = 300;

/** False for GUARD_MS after `key` changes (and on first show), then true. */
export function useTapGuard(key: unknown): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), GUARD_MS);
    return () => clearTimeout(t);
  }, [key]);
  return ready;
}
