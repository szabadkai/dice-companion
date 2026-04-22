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
  chargeStart: () => vibrate(8),
  chargeReady: () => vibrate(18),
  rollStart:   () => vibrate([8, 35, 8]),
  rollImpact:  () => vibrate([22, 18, 14]),
  reroll:      () => vibrate([12, 24, 12]),
  commit:      () => vibrate(30),
  cancel:      () => vibrate([30, 20, 30]),
  tap:         () => vibrate(10),
};
