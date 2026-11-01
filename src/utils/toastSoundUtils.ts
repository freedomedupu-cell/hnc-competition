/**
 * Web Audio API synthesized chimes for student toast notifications.
 * 100% self-contained, zero external asset dependencies, zero network latency.
 */

const TOAST_SOUND_STORAGE_KEY = 'hnc_student_toast_sound_enabled_v1';

export function isToastSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(TOAST_SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setToastSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOAST_SOUND_STORAGE_KEY, String(enabled));
  } catch {}
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Upbeat, cheerful ascending 4-tone arpeggio for new competition publications:
 * C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
 */
export function playCompetitionPublishedChime(): void {
  if (!isToastSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const notes = [
      { f: 523.25, start: t, dur: 0.12 },
      { f: 659.25, start: t + 0.09, dur: 0.12 },
      { f: 783.99, start: t + 0.18, dur: 0.14 },
      { f: 1046.5, start: t + 0.28, dur: 0.35 },
    ];

    notes.forEach(({ f, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch (err) {
    console.debug('Toast audio playback non-blocking note:', err);
  }
}

/**
 * Celebratory, fanfare harmonic chime for newly graded student results:
 * G5 (783.99 Hz) -> B5 (987.77 Hz) -> D6 (1174.66 Hz) -> G6 (1567.98 Hz)
 */
export function playResultGradedChime(): void {
  if (!isToastSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const notes = [
      { f: 783.99, start: t, dur: 0.14 },
      { f: 987.77, start: t + 0.1, dur: 0.14 },
      { f: 1174.66, start: t + 0.2, dur: 0.16 },
      { f: 1567.98, start: t + 0.32, dur: 0.45 },
    ];

    notes.forEach(({ f, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch (err) {
    console.debug('Result graded audio playback note:', err);
  }
}
