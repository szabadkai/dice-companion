/** haptics.ts — Vibration API wrapper with silent fallback. */

export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // not supported — ignore
  }
}

export const HAPTIC = {
  chargeReady: () => vibrate(15),
  rollStart:   () => vibrate([10, 50, 10]),
  commit:      () => vibrate(30),
};
