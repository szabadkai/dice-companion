/**
 * sound.ts — lightweight synthesized SFX (no asset files).
 * Uses WebAudio when available; silently no-ops otherwise.
 */

let ctx: AudioContext | null = null;
let chargeOsc: OscillatorNode | null = null;
let chargeGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  } catch {
    return null;
  }
}

function now(c: AudioContext): number {
  return c.currentTime;
}

function oneShotTone(
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  type: OscillatorType,
  gainLevel = 0.05,
): void {
  const c = getCtx();
  if (!c) return;

  if (c.state === 'suspended') {
    void c.resume();
  }

  const t = now(c);
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, t);

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + durationSec);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gainLevel, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  osc.start(t);
  osc.stop(t + durationSec + 0.02);
}

export function startChargeTone(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    void c.resume();
  }

  stopChargeTone(false);

  const t = now(c);
  chargeOsc = c.createOscillator();
  chargeGain = c.createGain();
  const filter = c.createBiquadFilter();

  chargeOsc.type = 'sawtooth';
  chargeOsc.frequency.setValueAtTime(105, t);
  chargeOsc.frequency.exponentialRampToValueAtTime(240, t + 0.7);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, t);

  chargeGain.gain.setValueAtTime(0.0001, t);
  chargeGain.gain.exponentialRampToValueAtTime(0.045, t + 0.08);

  chargeOsc.connect(filter);
  filter.connect(chargeGain);
  chargeGain.connect(c.destination);

  chargeOsc.start(t);
}

export function stopChargeTone(ready: boolean): void {
  const c = getCtx();
  if (!c) return;
  const t = now(c);

  if (chargeGain) {
    chargeGain.gain.cancelScheduledValues(t);
    chargeGain.gain.setValueAtTime(chargeGain.gain.value || 0.02, t);
    chargeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  }

  if (chargeOsc) {
    try {
      chargeOsc.stop(t + 0.07);
    } catch {
      // ignore stop errors
    }
  }

  chargeOsc = null;
  chargeGain = null;

  // Small confirmation chirp when the hold reached ready state.
  if (ready) {
    oneShotTone(460, 840, 0.09, 'triangle', 0.03);
  }
}

export function playRollWhoosh(): void {
  oneShotTone(260, 70, 0.18, 'sawtooth', 0.045);
}

export function playRollImpact(): void {
  oneShotTone(120, 48, 0.16, 'square', 0.06);
  oneShotTone(480, 180, 0.1, 'triangle', 0.03);
}
