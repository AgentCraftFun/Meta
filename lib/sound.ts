/**
 * Tiny click via Web Audio. No asset, generated on the fly from a triangle
 * oscillator. The AudioContext is lazy + reused across calls so the browser
 * doesn't complain.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function playTick(volume = 0.05) {
  const c = getContext();
  if (!c) return;
  try {
    if (c.state === 'suspended') void c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = 1320;
    osc.type = 'triangle';
    gain.gain.value = volume;
    osc.connect(gain).connect(c.destination);
    const t = c.currentTime;
    osc.start(t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.stop(t + 0.08);
  } catch {
    // best-effort; never crash on audio
  }
}
