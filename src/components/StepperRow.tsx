import styles from './StepperRow.module.css';

interface StepperProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
}

function Stepper({ label, value, onDecrement, onIncrement, disabled }: StepperProps) {
  return (
    <div className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      <div className={styles.stepper}>
        <button
          className={styles.btn}
          onPointerDown={onDecrement}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >−</button>
        <span className={styles.val}>{value}</span>
        <button
          className={styles.btn}
          onPointerDown={onIncrement}
          disabled={disabled || value >= 9}
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
    </div>
  );
}

interface Props {
  atkCount: number;
  defCount: number;
  magCount: number;
  disabled?: boolean;
  onAtk: (delta: number) => void;
  onDef: (delta: number) => void;
  onMag: (delta: number) => void;
}

export function StepperRow({ atkCount, defCount, magCount, disabled, onAtk, onDef, onMag }: Props) {
  return (
    <div className={styles.row}>
      <Stepper label="ATK" value={atkCount} onDecrement={() => onAtk(-1)} onIncrement={() => onAtk(1)} disabled={disabled} />
      <Stepper label="DEF" value={defCount} onDecrement={() => onDef(-1)} onIncrement={() => onDef(1)} disabled={disabled} />
      <Stepper label="MAG" value={magCount} onDecrement={() => onMag(-1)} onIncrement={() => onMag(1)} disabled={disabled} />
    </div>
  );
}
