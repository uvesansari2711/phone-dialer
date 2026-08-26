import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCallTimer } from '../hooks/useCallTimer';

describe('useCallTimer', () => {
  it('starts and stops counting', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ isRunning }) => useCallTimer(isRunning),
      { initialProps: { isRunning: false } },
    );

    expect(result.current.seconds).toBe(0);

    rerender({ isRunning: true });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(3);

    rerender({ isRunning: false });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBe(3);

    vi.useRealTimers();
  });
});
