/**
 * game.ts — Pure deterministic game rules.
 * No React / Zustand imports. Fully unit-testable.
 *
 * Assumptions (v1 defaults — documented):
 *  Attack die  (6 faces): 1×crit, 2×hit, 3×miss
 *  Defence die (6 faces): 2×block, 1×dodge, 3×miss
 *  Magic die   (6 faces): 2×channel, 1×spark, 3×miss
 *
 *  Cancellation:
 *   - Each block or dodge cancels one hit (not a crit).
 *   - Crits are never cancelled by blocks.
 *   - Remaining uncancelled hits + crits = net damage.
 *
 *  Reroll economy: 1 token per player per round.
 *  Hold charge:    600 ms to full.
 *  Sync window:    250 ms — both releases must be within this window.
 */

import type { Die, DieFace, DieType, Resolution } from './types';

// ─── Face distributions ───────────────────────────────────────────
const ATK_FACES: DieFace[] = ['crit', 'hit', 'hit', 'miss', 'miss', 'miss'];
const DEF_FACES: DieFace[] = ['block', 'block', 'dodge', 'miss', 'miss', 'miss'];
const MAG_FACES: DieFace[] = ['channel', 'channel', 'spark', 'miss', 'miss', 'miss'];

const FACE_TABLE: Record<DieType, DieFace[]> = {
  atk: ATK_FACES,
  def: DEF_FACES,
  mag: MAG_FACES,
};

// ─── Constants ────────────────────────────────────────────────────
export const HOLD_CHARGE_MS  = 600;
export const SYNC_WINDOW_MS  = 700;
export const ROLL_ANIM_MS    = 650;
export const REROLL_TOKENS   = 1;

// ─── Helpers ──────────────────────────────────────────────────────
/** Cryptographically safe integer in [0, n). */
function randInt(n: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % n;
}

function rollFace(type: DieType): DieFace {
  const faces = FACE_TABLE[type];
  return faces[randInt(faces.length)];
}

let _dieSeq = 0;
function nextId(): string {
  return `d${++_dieSeq}_${Date.now()}`;
}

// ─── Public API ───────────────────────────────────────────────────

/** Generate a fresh pool of unrolled dice from pool counts. */
export function generatePool(
  atkCount: number,
  defCount: number,
  magCount: number,
): Die[] {
  const dice: Die[] = [];
  for (let i = 0; i < atkCount; i++)
    dice.push({ id: nextId(), type: 'atk', face: 'miss', selected: false, cancelled: false });
  for (let i = 0; i < defCount; i++)
    dice.push({ id: nextId(), type: 'def', face: 'miss', selected: false, cancelled: false });
  for (let i = 0; i < magCount; i++)
    dice.push({ id: nextId(), type: 'mag', face: 'miss', selected: false, cancelled: false });
  return dice;
}

/** Roll all dice (or only unselected ones if rerolling selected). */
export function rollDice(dice: Die[]): Die[] {
  return dice.map(d => ({ ...d, face: rollFace(d.type), cancelled: false }));
}

/** Reroll only selected dice; preserve the rest. */
export function rerollSelected(dice: Die[]): Die[] {
  return dice.map(d =>
    d.selected ? { ...d, face: rollFace(d.type), cancelled: false, selected: false } : d,
  );
}

/** Toggle selection on a single die by id. */
export function toggleSelect(dice: Die[], id: string): Die[] {
  return dice.map(d => d.id === id ? { ...d, selected: !d.selected } : d);
}

/**
 * Resolve an opposed exchange.
 * attacker = playerA dice; defender = playerB dice.
 * Returns a Resolution summary and mutated dice arrays
 * with .cancelled flags set for the visualisation layer.
 */
export function resolveExchange(
  attackerDice: Die[],
  defenderDice: Die[],
): { atkDice: Die[]; defDice: Die[]; resolution: Resolution } {
  // Count attacker outcomes
  let hits  = attackerDice.filter(d => d.face === 'hit').length;
  let crits = attackerDice.filter(d => d.face === 'crit').length;

  // Count defender outcomes
  let blocks = defenderDice.filter(d => d.face === 'block' || d.face === 'dodge').length;

  // Cancellation: each block cancels one hit (crits pierce)
  const cancelledHits = Math.min(hits, blocks);
  const usedBlocks    = cancelledHits;
  const remainBlocks  = blocks - usedBlocks;

  const netHits   = hits - cancelledHits;
  const netCrits  = crits; // crits always go through
  const netDamage = netHits + netCrits;

  // Mark cancelled dice
  let hitsToMark = cancelledHits;
  const atkDice = attackerDice.map(d => {
    if (d.face === 'hit' && hitsToMark > 0) { hitsToMark--; return { ...d, cancelled: true }; }
    return d;
  });

  let blocksToMark = usedBlocks;
  const defDice = defenderDice.map(d => {
    if ((d.face === 'block' || d.face === 'dodge') && blocksToMark > 0) {
      blocksToMark--; return { ...d, cancelled: true };
    }
    return d;
  });

  return {
    atkDice,
    defDice,
    resolution: {
      hits: netHits,
      crits: netCrits,
      blocks: remainBlocks,
      dodges: 0,
      netDamage,
    },
  };
}

/**
 * Compute expected number of hits + crits for a given pool.
 * P(hit|atk)  = 2/6,  P(crit|atk) = 1/6  → E[hits+crits] = 3/6 × count
 * P(block|def) = 3/6                       → E[blocks]     = 3/6 × count
 */
export function expectedHits(atkCount: number): number {
  return parseFloat(((3 / 6) * atkCount).toFixed(1));
}
export function expectedBlocks(defCount: number): number {
  return parseFloat(((3 / 6) * defCount).toFixed(1));
}
