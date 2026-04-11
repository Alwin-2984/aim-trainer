let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// ─── Tracking tick state (KovaaK's style rapid hitmarker ticks) ───
let trackingInterval: ReturnType<typeof setInterval> | null = null;
let isTrackingPlaying = false;

const TICK_INTERVAL_MS = 120; // tick every 80ms (~12 ticks/sec

/** Play a single soft tick — short high click */
function playTick(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // ignore
  }
}

/** Start rapid hitmarker ticks while tracking */
export function startTrackingSound(): void {
  if (isTrackingPlaying) return;
  isTrackingPlaying = true;
  playTick(); // immediate first tick
  trackingInterval = setInterval(playTick, TICK_INTERVAL_MS);
}

/** Stop tracking ticks */
export function stopTrackingSound(): void {
  if (!isTrackingPlaying) return;
  if (trackingInterval !== null) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  isTrackingPlaying = false;
}

/** Short click/hit sound — snappy high-pitched tick */
export function playHitSound(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Audio not available
  }
}

/** Target eliminated sound — satisfying rising tone */
export function playEliminateSound(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    for (const freq of [600, 900]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Audio not available
  }
}

/** Miss sound — low dull thud */
export function playMissSound(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Audio not available
  }
}
