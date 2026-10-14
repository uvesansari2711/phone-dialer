import { useEffect } from 'react';

export function useVisibilityPolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => {
        if (!document.hidden) {
          callback();
        }
      }, intervalMs);
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      callback();
      start();
    };

    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [callback, intervalMs, enabled]);
}
