/**
 * store.ts — Zustand game store.
 * All mutation is here; components only call actions and read slices.
 */
import { create } from 'zustand';
import {
  generatePool, rollDice, rerollSelected, toggleSelect, resolveExchange,
  REROLL_TOKENS, ROLL_ANIM_MS,
} from './game';
import { loadState, loadLog, saveState, saveLog } from './persist';
import { HAPTIC } from './haptics';
import { playRollImpact, playRollWhoosh } from './sound';
import type { DieFace, GamePhase, LogEntry, PlayerState, Resolution } from './types';

// ─── Helper ───────────────────────────────────────────────────────
function makePlayer(id: 'a' | 'b'): PlayerState {
  return {
    id,
    atkCount: id === 'a' ? 4 : 2,
    defCount: id === 'a' ? 2 : 4,
    magCount: 1,
    dice: [],
    rerollTokens: REROLL_TOKENS,
    holdProgress: 0,
    ready: false,
  };
}

function logId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── State shape ──────────────────────────────────────────────────
export interface GameStore {
  round: number;
  phase: GamePhase;
  playerA: PlayerState;
  playerB: PlayerState;
  resolution: Resolution | null;
  log: LogEntry[];

  // actions
  setCount(player: 'a' | 'b', type: 'atkCount' | 'defCount' | 'magCount', delta: number): void;
  setHoldProgress(player: 'a' | 'b', progress: number): void;
  triggerRoll(): void;
  toggleDie(player: 'a' | 'b', dieId: string): void;
  reroll(player: 'a' | 'b'): void;
  commit(): void;
  resetRound(): void;
}

// ─── Store ────────────────────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => {
  // Hydrate from local storage
  const saved = loadState();
  const savedLog = loadLog();

  const initA = makePlayer('a');
  const initB = makePlayer('b');

  if (saved) {
    Object.assign(initA, {
      atkCount: saved.playerA.atkCount,
      defCount: saved.playerA.defCount,
      magCount: saved.playerA.magCount,
      rerollTokens: saved.playerA.rerollTokens,
    });
    Object.assign(initB, {
      atkCount: saved.playerB.atkCount,
      defCount: saved.playerB.defCount,
      magCount: saved.playerB.magCount,
      rerollTokens: saved.playerB.rerollTokens,
    });
  }

  return {
    round: saved?.round ?? 1,
    phase: 'setup',
    playerA: initA,
    playerB: initB,
    resolution: null,
    log: savedLog,

    setCount(player, type, delta) {
      set(s => {
        const p = player === 'a' ? s.playerA : s.playerB;
        const next = Math.max(0, Math.min(9, p[type] + delta));
        const updated = { ...p, [type]: next };
        const newState = player === 'a' ? { playerA: updated } : { playerB: updated };
        const full = { ...s, ...newState };
        saveState({
          version: 1,
          round: full.round,
          playerA: { atkCount: full.playerA.atkCount, defCount: full.playerA.defCount, magCount: full.playerA.magCount, rerollTokens: full.playerA.rerollTokens },
          playerB: { atkCount: full.playerB.atkCount, defCount: full.playerB.defCount, magCount: full.playerB.magCount, rerollTokens: full.playerB.rerollTokens },
        });
        return newState;
      });
    },

    setHoldProgress(player, progress) {
      set(s => {
        const p = player === 'a' ? s.playerA : s.playerB;
        const wasReady = p.ready;
        const isReady = progress >= 1;
        if (isReady && !wasReady) HAPTIC.chargeReady();
        const updated = { ...p, holdProgress: progress, ready: isReady };
        return player === 'a' ? { playerA: updated, phase: 'charging' } : { playerB: updated, phase: 'charging' };
      });
    },

    triggerRoll() {
      const { playerA, playerB, round, phase } = get();
      if (phase === 'rolling') return;

      HAPTIC.rollStart();
      playRollWhoosh();

      set(s => ({
        phase: 'rolling',
        resolution: null,
        playerA: {
          ...s.playerA,
          dice: generatePool(playerA.atkCount, playerA.defCount, playerA.magCount),
          holdProgress: 0,
          ready: false,
        },
        playerB: {
          ...s.playerB,
          dice: generatePool(playerB.atkCount, playerB.defCount, playerB.magCount),
          holdProgress: 0,
          ready: false,
        },
      }));

      setTimeout(() => {
        const current = get();
        const atkDice = rollDice(current.playerA.dice);
        const defDice = rollDice(current.playerB.dice);

        const { atkDice: resolvedAtk, defDice: resolvedDef, resolution } =
          resolveExchange(atkDice, defDice);

        const entry: LogEntry = {
          id: logId(),
          round,
          playerA: {
            atkCount: playerA.atkCount,
            defCount: playerA.defCount,
            magCount: playerA.magCount,
            faces: resolvedAtk.map(d => d.face as DieFace),
          },
          playerB: {
            atkCount: playerB.atkCount,
            defCount: playerB.defCount,
            magCount: playerB.magCount,
            faces: resolvedDef.map(d => d.face as DieFace),
          },
          resolution,
          timestamp: Date.now(),
        };

        const newLog = [...get().log, entry];
        saveLog(newLog);
        HAPTIC.rollImpact();
        playRollImpact();

        set(s => ({
          phase: 'resolved',
          resolution,
          log: newLog,
          playerA: {
            ...s.playerA,
            dice: resolvedAtk,
            holdProgress: 0,
            ready: false,
          },
          playerB: {
            ...s.playerB,
            dice: resolvedDef,
            holdProgress: 0,
            ready: false,
          },
        }));
      }, ROLL_ANIM_MS);
    },

    toggleDie(player, dieId) {
      set(s => {
        const p = player === 'a' ? s.playerA : s.playerB;
        const updated = { ...p, dice: toggleSelect(p.dice, dieId) };
        return player === 'a' ? { playerA: updated } : { playerB: updated };
      });
    },

    reroll(player) {
      const state = get();
      if (state.phase !== 'resolved') return;

      const p = player === 'a' ? state.playerA : state.playerB;
      if (p.rerollTokens <= 0) {
        HAPTIC.cancel();
        return;
      }

      const selected = p.dice.filter(d => d.selected);
      if (selected.length === 0) {
        HAPTIC.cancel();
        return;
      }

      HAPTIC.reroll();
      playRollWhoosh();

      const rerolledDice = rerollSelected(p.dice);
      set(s => {
        if (player === 'a') {
          return {
            phase: 'rolling',
            resolution: null,
            playerA: { ...s.playerA, dice: rerolledDice, rerollTokens: s.playerA.rerollTokens - 1 },
          };
        }

        return {
          phase: 'rolling',
          resolution: null,
          playerB: { ...s.playerB, dice: rerolledDice, rerollTokens: s.playerB.rerollTokens - 1 },
        };
      });

      setTimeout(() => {
        const current = get();
        const { atkDice, defDice, resolution } = resolveExchange(
          current.playerA.dice,
          current.playerB.dice,
        );

        HAPTIC.rollImpact();
        playRollImpact();
        set(s => ({
          phase: 'resolved',
          resolution,
          playerA: { ...s.playerA, dice: atkDice },
          playerB: { ...s.playerB, dice: defDice },
        }));
      }, ROLL_ANIM_MS);
    },

    commit() {
      HAPTIC.commit();
      set(s => {
        const round = s.round + 1;
        const pA = { ...s.playerA, dice: [], rerollTokens: REROLL_TOKENS, holdProgress: 0, ready: false };
        const pB = { ...s.playerB, dice: [], rerollTokens: REROLL_TOKENS, holdProgress: 0, ready: false };
        saveState({
          version: 1,
          round,
          playerA: { atkCount: pA.atkCount, defCount: pA.defCount, magCount: pA.magCount, rerollTokens: pA.rerollTokens },
          playerB: { atkCount: pB.atkCount, defCount: pB.defCount, magCount: pB.magCount, rerollTokens: pB.rerollTokens },
        });
        return { round, phase: 'setup', resolution: null, playerA: pA, playerB: pB };
      });
    },

    resetRound() {
      set(s => ({
        phase: 'setup',
        resolution: null,
        playerA: { ...s.playerA, dice: [], holdProgress: 0, ready: false, rerollTokens: REROLL_TOKENS },
        playerB: { ...s.playerB, dice: [], holdProgress: 0, ready: false, rerollTokens: REROLL_TOKENS },
      }));
    },
  };
});
