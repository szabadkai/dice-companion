/**
 * useHoldSync.ts — Manages the hold-to-roll gesture for both players.
 *
 * Each side calls startHold/endHold independently.
 * When both sides are ready (progress === 1) AND both release within
 * SYNC_WINDOW_MS of each other → onBothRelease() fires.
 * If one side releases early (before ready) → both charges reset.
 */
import { useRef, useCallback } from 'react';
import { HOLD_CHARGE_MS, SYNC_WINDOW_MS } from '../game';

interface HoldSyncConfig {
  onProgressA: (p: number) => void;
  onProgressB: (p: number) => void;
  onBothRelease: () => void;
  onResetA: () => void;
  onResetB: () => void;
}

export function useHoldSync({
  onProgressA,
  onProgressB,
  onBothRelease,
  onResetA,
  onResetB,
}: HoldSyncConfig) {
  const rafA  = useRef<number | null>(null);
  const rafB  = useRef<number | null>(null);
  const startA = useRef<number | null>(null);
  const startB = useRef<number | null>(null);
  const readyA = useRef(false);
  const readyB = useRef(false);
  const releaseTimeA = useRef<number | null>(null);
  const releaseTimeB = useRef<number | null>(null);

  function cancelRaf(ref: React.MutableRefObject<number | null>) {
    if (ref.current !== null) { cancelAnimationFrame(ref.current); ref.current = null; }
  }

  function checkSync() {
    if (!readyA.current || !readyB.current) return;
    const tA = releaseTimeA.current;
    const tB = releaseTimeB.current;
    if (tA === null || tB === null) return;
    if (Math.abs(tA - tB) <= SYNC_WINDOW_MS) {
      readyA.current = false;
      readyB.current = false;
      releaseTimeA.current = null;
      releaseTimeB.current = null;
      onBothRelease();
    }
  }

  function animateCharge(
    startRef: React.MutableRefObject<number | null>,
    rafRef:   React.MutableRefObject<number | null>,
    onProgress: (p: number) => void,
    readyRef: React.MutableRefObject<boolean>,
  ) {
    const tick = (now: number) => {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / HOLD_CHARGE_MS, 1);
      onProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        readyRef.current = true;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  const startHoldA = useCallback(() => {
    startA.current = performance.now();
    readyA.current = false;
    releaseTimeA.current = null;
    animateCharge(startA, rafA, onProgressA, readyA);
  }, [onProgressA]);

  const endHoldA = useCallback(() => {
    cancelRaf(rafA);
    if (!readyA.current) {
      // released early → reset both
      startA.current = null;
      readyA.current = false;
      onProgressA(0);
      onResetA();
      // also reset B if it was charging but not ready
      if (!readyB.current) {
        cancelRaf(rafB);
        startB.current = null;
        onProgressB(0);
        onResetB();
      }
    } else {
      releaseTimeA.current = performance.now();
      checkSync();
    }
  }, [onProgressA, onProgressB, onResetA, onResetB]);

  const startHoldB = useCallback(() => {
    startB.current = performance.now();
    readyB.current = false;
    releaseTimeB.current = null;
    animateCharge(startB, rafB, onProgressB, readyB);
  }, [onProgressB]);

  const endHoldB = useCallback(() => {
    cancelRaf(rafB);
    if (!readyB.current) {
      startB.current = null;
      readyB.current = false;
      onProgressB(0);
      onResetB();
      if (!readyA.current) {
        cancelRaf(rafA);
        startA.current = null;
        onProgressA(0);
        onResetA();
      }
    } else {
      releaseTimeB.current = performance.now();
      checkSync();
    }
  }, [onProgressA, onProgressB, onResetA, onResetB]);

  return { startHoldA, endHoldA, startHoldB, endHoldB };
}
