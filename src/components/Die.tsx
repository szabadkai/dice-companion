import styles from './Die.module.css';
import type { Die as DieData } from '../types';
import { HAPTIC } from '../haptics';

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
}

export function Die({ die, size = 'normal', onTap, rolling = false }: Props) {
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

  return (
    <div
      className={cls}
      onPointerDown={onTap ? handleTap : undefined}
      role={onTap ? 'button' : undefined}
      aria-label={`${die.type} die: ${die.face}${die.selected ? ', selected' : ''}`}
    >
      {FACE_GLYPH[die.face] ?? '?'}
    </div>
  );
}
