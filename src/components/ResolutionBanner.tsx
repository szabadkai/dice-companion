import styles from './ResolutionBanner.module.css';
import type { Resolution } from '../types';

interface Props {
  resolution: Resolution;
}

export function ResolutionBanner({ resolution }: Props) {
  const { hits, crits, blocks, netDamage } = resolution;
  return (
    <div className={styles.banner}>
      <span className={styles.stat}>⚔ {hits} hits</span>
      {crits > 0 && <span className={styles.crit}>★ {crits} crit{crits > 1 ? 's' : ''}</span>}
      <span className={styles.divider}>·</span>
      <span className={styles.stat}>◆ {blocks} blocked</span>
      <span className={styles.divider}>·</span>
      <span className={styles.damage}>
        {netDamage > 0 ? `★ ${netDamage} damage` : '✕ no damage'}
      </span>
    </div>
  );
}
