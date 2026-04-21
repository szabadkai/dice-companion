import styles from './Die.module.css';
import type { Die as DieData } from '../types';

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
}

export function Die({ die, size = 'normal', onTap }: Props) {
  const cls = [
    styles.die,
    styles[die.type],
    styles[die.face],
    die.selected  ? styles.selected  : '',
    die.cancelled ? styles.cancelled : '',
    size !== 'normal' ? styles[size] : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      onPointerDown={onTap ? () => onTap(die.id) : undefined}
      role={onTap ? 'button' : undefined}
      aria-label={`${die.type} die: ${die.face}${die.selected ? ', selected' : ''}`}
    >
      {FACE_GLYPH[die.face] ?? '?'}
    </div>
  );
}
