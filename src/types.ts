// ─── Die face symbols ─────────────────────────────────────────────
// Attack die  : crit | hit | miss
// Defence die : block | dodge | miss
// Magic die   : channel | spark | miss  (placeholder distribution)

export type DieFace =
  | 'crit'    // ★  — attack crit: pierces one block
  | 'hit'     // ⚔  — attack hit
  | 'block'   // ◆  — defence block: cancels one hit
  | 'dodge'   // ≋  — defence dodge: cancels one hit (same effect as block for MVP)
  | 'channel' // ᚱ  — magic channel: reserved
  | 'spark'   // ᚨ  — magic spark: reserved
  | 'miss';   // —  — blank / miss

export type DieType = 'atk' | 'def' | 'mag';

export interface Die {
  id: string;
  type: DieType;
  face: DieFace;
  /** UI selection state for targeted reroll */
  selected: boolean;
  /** Set during cancellation resolution */
  cancelled: boolean;
}

// ─── Per-player state ─────────────────────────────────────────────
export interface PlayerState {
  id: 'a' | 'b';
  atkCount: number;
  defCount: number;
  magCount: number;
  /** Dice currently on the tray (generated after a roll) */
  dice: Die[];
  /** Number of reroll actions remaining this round */
  rerollTokens: number;
  /** Hold-button charge progress 0–1 */
  holdProgress: number;
  /** True when hold has reached 100% */
  ready: boolean;
}

// ─── Resolved exchange ────────────────────────────────────────────
export interface Resolution {
  hits: number;
  crits: number;
  blocks: number;
  dodges: number;
  netDamage: number;
}

// ─── Log entry ────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  round: number;
  playerA: {
    atkCount: number; defCount: number; magCount: number;
    faces: DieFace[];
  };
  playerB: {
    atkCount: number; defCount: number; magCount: number;
    faces: DieFace[];
  };
  resolution: Resolution;
  timestamp: number;
}

// ─── Game phase ───────────────────────────────────────────────────
export type GamePhase =
  | 'setup'     // players adjusting pools before rolling
  | 'charging'  // at least one side is holding
  | 'rolling'   // both released, dice animating
  | 'resolved'  // result visible, can reroll selected
  | 'commit';   // damage committed, advance round
