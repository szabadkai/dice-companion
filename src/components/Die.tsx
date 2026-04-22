import styles from './Die.module.css';
import type { Die as DieData } from '../types';
import { HAPTIC } from '../haptics';
import type { CSSProperties } from 'react';

const FACE_GLYPH: Record<string, string> = {
  crit:    '★',
  hit:     '⚔',
  block:   '◆',
  dodge:   '≋',
  channel: 'ᚱ',
  spark:   'ᚨ',
  miss:    '—',
};

interface Props {
  die: DieData;
  size?: 'normal' | 'small' | 'tiny';
  onTap?: (id: string) => void;
  rolling?: boolean;
  index?: number;
}

export function Die({ die, size = 'normal', onTap, rolling = false, index = 0 }: Props) {
  const cls = [
    styles.die,
    styles[die.type],
    styles[die.face],
    rolling ? styles.rolling : '',
    die.selected  ? styles.selected  : '',
    die.cancelled ? styles.cancelled : '',
    size !== 'normal' ? styles[size] : '',
  ].filter(Boolean).join(' ');

  const handleTap = () => {
    if (!onTap) return;
    HAPTIC.tap();
    onTap(die.id);
  };

  // Give each die a deterministic-but-varied motion path while rolling.
  let hash = 0;
  for (let i = 0; i < die.id.length; i++) hash = (hash * 31 + die.id.charCodeAt(i)) % 997;
  const spread = (hash % 7) - 3;
  const rollStyle = rolling
    ? ({
        ['--roll-x' as const]: `${(spread + (index % 3) - 1) * 1.2}px`,
        ['--roll-y' as const]: `${((hash % 5) - 2) * 1.4}px`,
        ['--roll-rot' as const]: `${220 + (hash % 280)}deg`,
        ['--roll-delay' as const]: `${(hash % 140)}ms`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={cls}
      style={rollStyle}
      onPointerDown={onTap ? handleTap : undefined}
      role={onTap ? 'button' : undefined}
      aria-label={`${die.type} die: ${die.face}${die.selected ? ', selected' : ''}`}
    >
      {FACE_GLYPH[die.face] ?? '?'}
    </div>
  );
}
