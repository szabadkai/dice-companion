/**
 * persist.ts — local-storage persistence helpers.
 * Schema version is embedded; mismatched versions are silently dropped.
 */
import type { LogEntry, PlayerState } from './types';

const SCHEMA_VERSION = 1;
const KEYS = {
  state: 'skirmish-dice-state-v1',
  log:   'skirmish-dice-log-v1',
} as const;

export interface PersistedState {
  version: number;
  round: number;
  playerA: Pick<PlayerState, 'atkCount' | 'defCount' | 'magCount' | 'rerollTokens'>;
  playerB: Pick<PlayerState, 'atkCount' | 'defCount' | 'magCount' | 'rerollTokens'>;
}

function tryParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function loadState(): PersistedState | null {
  const parsed = tryParse<PersistedState>(localStorage.getItem(KEYS.state));
  if (!parsed || parsed.version !== SCHEMA_VERSION) return null;
  return parsed;
}

export function saveState(s: PersistedState): void {
  try { localStorage.setItem(KEYS.state, JSON.stringify({ ...s, version: SCHEMA_VERSION })); }
  catch { /* quota exceeded — silently skip */ }
}

export function loadLog(): LogEntry[] {
  return tryParse<LogEntry[]>(localStorage.getItem(KEYS.log)) ?? [];
}

export function saveLog(log: LogEntry[]): void {
  // Keep the 50 most recent entries to cap storage size
  const trimmed = log.slice(-50);
  try { localStorage.setItem(KEYS.log, JSON.stringify(trimmed)); }
  catch { /* quota exceeded */ }
}
