import { useCallback } from 'react';
import styles from './MirroredCore.module.css';
import { DiceTray }         from '../components/DiceTray';
import { StepperRow }        from '../components/StepperRow';
import { HoldButton }        from '../components/HoldButton';
import { ResolutionBanner }  from '../components/ResolutionBanner';
import { useGameStore }      from '../store';
import { useHoldSync }       from '../hooks/useHoldSync';

export function MirroredCore() {
  const {
    round, phase, playerA, playerB, resolution,
    setCount, setHoldProgress, triggerRoll,
    toggleDie, reroll, commit, resetRound,
  } = useGameStore();

  const handleBothRelease = useCallback(() => {
    triggerRoll();
  }, [triggerRoll]);

  const { startHoldA, endHoldA, startHoldB, endHoldB } = useHoldSync({
    onProgressA:   p => setHoldProgress('a', p),
    onProgressB:   p => setHoldProgress('b', p),
    onBothRelease: handleBothRelease,
    onResetA:      () => setHoldProgress('a', 0),
    onResetB:      () => setHoldProgress('b', 0),
  });

  const isSetupPhase    = phase === 'setup' || phase === 'charging';
  const isResolvedPhase = phase === 'resolved' || phase === 'commit';

  const subLabelA = playerA.ready
    ? 'A ready ✓ · release together'
    : playerA.holdProgress > 0
      ? 'A charging…'
      : undefined;

  const subLabelB = playerB.ready
    ? 'B ready ✓ · release together'
    : playerB.holdProgress > 0
      ? 'B charging…'
      : undefined;

  return (
    <div className={styles.screen}>
      {/* ── Header ─────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.title}>⚔ DUEL · ROUND {round}</div>
        <div className={styles.headerRight}>
          <button
            className={styles.ghostBtn}
            onPointerDown={resetRound}
            aria-label="Reset round"
          >↺</button>
        </div>
      </header>

      {/* ── Mirror grid ────────────────────────────── */}
      <div className={styles.mirror}>

        {/* ══ PLAYER A — rotated 180° ══ */}
        <div className={`${styles.half} ${styles.top}`}>
          <div className={styles.playerRow}>
            <span className={styles.chip}>PLAYER A</span>
            {isSetupPhase && (
              <span className={styles.hintText}>tap dice to select</span>
            )}
          </div>

          <DiceTray
            dice={playerA.dice}
            atkCount={playerA.atkCount}
            defCount={playerA.defCount}
            phase={phase}
            label="⚔ attack pool"
            onTapDie={id => toggleDie('a', id)}
          />

          <StepperRow
            atkCount={playerA.atkCount}
            defCount={playerA.defCount}
            magCount={playerA.magCount}
            disabled={!isSetupPhase}
            onAtk={d => setCount('a', 'atkCount', d)}
            onDef={d => setCount('a', 'defCount', d)}
            onMag={d => setCount('a', 'magCount', d)}
          />

          <div className={styles.actionRow}>
            <button
              className={styles.rerollBtn}
              onPointerDown={isResolvedPhase && playerA.rerollTokens > 0 ? () => reroll('a') : undefined}
              disabled={!isResolvedPhase || playerA.rerollTokens <= 0}
              aria-label="Reroll selected dice for player A"
            >
              ↺ Reroll {playerA.rerollTokens}
            </button>

            {isSetupPhase ? (
              <HoldButton
                progress={playerA.holdProgress}
                ready={playerA.ready}
                label="⚔ HOLD TO ROLL"
                subLabel={subLabelA}
                onHoldStart={startHoldA}
                onHoldEnd={endHoldA}
              />
            ) : (
              <button
                className={styles.commitBtn}
                onPointerDown={isResolvedPhase ? commit : undefined}
                disabled={phase !== 'resolved'}
              >
                {phase === 'resolved' ? '✓ COMMIT' : '⚔ ROLLING…'}
              </button>
            )}
          </div>
        </div>

        {/* ══ Centre divider ══ */}
        <div className={styles.mid}>
          {isResolvedPhase && resolution
            ? <ResolutionBanner resolution={resolution} />
            : (
              <div className={styles.midContent}>
                <span>◆ ⚔ HOLD BOTH · SYNC ROLL ⚔ ◆</span>
                <button
                  className={styles.soloBtn}
                  onPointerDown={triggerRoll}
                  aria-label="Solo roll fallback"
                >
                  SOLO ROLL
                </button>
              </div>
            )
          }
        </div>

        {/* ══ PLAYER B — normal orientation ══ */}
        <div className={`${styles.half} ${styles.bot}`}>
          <div className={styles.playerRow}>
            <span className={styles.chip}>PLAYER B</span>
            {isSetupPhase && (
              <span className={styles.hintText}>tap dice to select</span>
            )}
          </div>

          <DiceTray
            dice={playerB.dice}
            atkCount={playerB.atkCount}
            defCount={playerB.defCount}
            phase={phase}
            label="◆ defence pool"
            onTapDie={id => toggleDie('b', id)}
          />

          <StepperRow
            atkCount={playerB.atkCount}
            defCount={playerB.defCount}
            magCount={playerB.magCount}
            disabled={!isSetupPhase}
            onAtk={d => setCount('b', 'atkCount', d)}
            onDef={d => setCount('b', 'defCount', d)}
            onMag={d => setCount('b', 'magCount', d)}
          />

          <div className={styles.actionRow}>
            <button
              className={styles.rerollBtn}
              onPointerDown={isResolvedPhase && playerB.rerollTokens > 0 ? () => reroll('b') : undefined}
              disabled={!isResolvedPhase || playerB.rerollTokens <= 0}
              aria-label="Reroll selected dice for player B"
            >
              ↺ Reroll {playerB.rerollTokens}
            </button>

            {isSetupPhase ? (
              <HoldButton
                progress={playerB.holdProgress}
                ready={playerB.ready}
                label="⚔ HOLD TO ROLL"
                subLabel={subLabelB}
                onHoldStart={startHoldB}
                onHoldEnd={endHoldB}
              />
            ) : (
              <button
                className={styles.commitBtn}
                onPointerDown={isResolvedPhase ? commit : undefined}
                disabled={phase !== 'resolved'}
              >
                {phase === 'resolved' ? '✓ COMMIT' : '⚔ ROLLING…'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
