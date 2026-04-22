import styles from './DiceTray.module.css';
import { Die } from './Die';
import type { Die as DieData } from '../types';
import { expectedHits, expectedBlocks } from '../game';

interface Props {
  dice: DieData[];
  atkCount: number;
  defCount: number;
  phase: 'setup' | 'charging' | 'rolling' | 'resolved' | 'commit';
  label?: string;
  onTapDie?: (id: string) => void;
}

export function DiceTray({ dice, atkCount, defCount, phase, label, onTapDie }: Props) {
  const showHint = phase === 'setup' || phase === 'charging';
  const eHits   = expectedHits(atkCount);
  const eBlocks = expectedBlocks(defCount);

  return (
    <div className={styles.tray}>
      {label && <span className={styles.label}>{label}</span>}

      {dice.length > 0 ? (
        <div className={styles.diceGrid}>
          {dice.map((d, i) => (
            <Die
              key={d.id}
              die={d}
              rolling={phase === 'rolling'}
              index={i}
              onTap={phase === 'resolved' ? onTapDie : undefined}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {showHint && (
            <span className={styles.hint}>
              Expected: <b className="blood">{eHits} hits</b> · <b>{eBlocks} blocks</b>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
