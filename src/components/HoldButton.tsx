import styles from './HoldButton.module.css';
import { HAPTIC } from '../haptics';
import { startChargeTone, stopChargeTone } from '../sound';

interface Props {
  progress: number;   // 0–1
  ready: boolean;
  label: string;
  subLabel?: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  disabled?: boolean;
}

export function HoldButton({ progress, ready, label, subLabel, onHoldStart, onHoldEnd, disabled }: Props) {
  const fillPct = Math.round(progress * 100);

  const cls = [
    styles.holdBtn,
    ready ? styles.ready : progress > 0 ? styles.charging : styles.idle,
    disabled ? styles.disabled : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={cls}
      onPointerDown={disabled ? undefined : () => {
        HAPTIC.chargeStart();
        startChargeTone();
        onHoldStart();
      }}
      onPointerUp={disabled ? undefined : () => {
        stopChargeTone(ready);
        onHoldEnd();
      }}
      onPointerLeave={disabled ? undefined : () => {
        stopChargeTone(ready);
        onHoldEnd();
      }}
      onPointerCancel={disabled ? undefined : () => {
        stopChargeTone(ready);
        onHoldEnd();
      }}
      aria-label={label}
      aria-disabled={disabled}
      // prevent context menu on long-press
      onContextMenu={e => e.preventDefault()}
    >
      {/* fill bar */}
      {!disabled && (
        <span
          className={styles.fill}
          style={{ width: `${fillPct}%` }}
          aria-hidden="true"
        />
      )}

      <span className={styles.lbl}>{label}</span>
      {subLabel && <span className={styles.sub}>{subLabel}</span>}
    </button>
  );
}
