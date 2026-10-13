// 6b.13 (lỗi #17): while a sheet is open, the phone's Back button closes it instead of leaving the game.
import { useEffect } from 'preact/hooks';

/** While `open`, one history entry stands for the open sheet; Back pops it and calls `close`. */
export function useBackClose(open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    history.pushState({ tuTienSheet: true }, '');
    let popped = false;
    const onPop = () => { popped = true; close(); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed from the page itself: drop the entry we pushed so Back still means "leave".
      if (!popped && history.state?.tuTienSheet) history.back();
    };
  }, [open]);
}
