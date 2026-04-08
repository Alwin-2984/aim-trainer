'use client';

import { useEffect, useRef, useState } from 'react';

const MIN_DELAY = 500;
const MAX_DELAY = 4000;
const DEFAULT_TRIALS = 5;

export default function ReactionTrainer() {
  // State for UI rendering
  const [trialCount, setTrialCount] = useState(DEFAULT_TRIALS);
  const [trials, setTrials] = useState<{ time: number; tooEarly: boolean }[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [complete, setComplete] = useState(false);

  // Refs for high-performance timing (avoids React re-renders)
  const containerRef = useRef<HTMLDivElement>(null);
  const trialCountRef = useRef(DEFAULT_TRIALS);
  const currentTrialRef = useRef(0);
  const trialsRef = useRef<{ time: number; tooEarly: boolean }[]>([]);

  const timerRef = useRef<number>(0);
  const intervalRef = useRef<number>(0);
  const displayStartRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const failedTrialRef = useRef(false);

  // Keep the ref synced with the UI state for the native listener
  useEffect(() => {
    trialCountRef.current = trialCount;
  }, [trialCount]);

  const startTrial = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    startRef.current = 0;
    timerRef.current = 0;
    intervalRef.current = 0;
    failedTrialRef.current = false;

    if (containerRef.current) {
      containerRef.current.style.background = '#991b1b';
      // Added pointer-events: none so clicks pass straight through to the container
      containerRef.current.innerHTML = `
        <div style="text-align:center; pointer-events: none;">
          <div style="font-size:18px;color:#fca5a5;margin-bottom:12px">Wait for green...</div>
          <div id="d" style="font-size:48px;color:#fca5a5;font-weight:700">0ms</div>
        </div>
      `;
    }

    displayStartRef.current = performance.now();
    intervalRef.current = window.setInterval(() => {
      const el = document.getElementById('d');
      if (el) el.textContent = Math.round(performance.now() - displayStartRef.current) + 'ms';
    }, 10);

    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = window.setTimeout(() => {
      clearInterval(intervalRef.current!);
      intervalRef.current = 0;
      timerRef.current = 0;

      if (containerRef.current) {
        containerRef.current.style.background = '#22c55e';
        containerRef.current.innerHTML = `
          <div style="text-align:center; pointer-events: none;">
            <div style="font-size:64px;font-weight:700;color:#fff">CLICK!</div>
          </div>
        `;
      }

      requestAnimationFrame(() => {
        startRef.current = performance.now();
      });
    }, delay);
  };

  const showResults = () => {
    setComplete(true);
    const valid = trialsRef.current.map((t) => t.time);
    const avg = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
    const best = valid.length > 0 ? Math.min(...valid) : 0;
    const worst = valid.length > 0 ? Math.max(...valid) : 0;

    if (containerRef.current) {
      containerRef.current.style.background = '#0f172a';
      const pills = trialsRef.current.map((t) =>
        `<div style="padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;background:rgba(34,197,94,0.15);color:#86efac">${t.time}</div>`
      ).join('');

      containerRef.current.innerHTML = `
        <div style="text-align:center;max-width:400px;padding:24px">
          <div style="font-size:18px;color:#94a3b8;margin-bottom:8px">Results</div>
          <div style="font-size:72px;font-weight:700;color:#f1f5f9;margin-bottom:24px">${avg}<span style="font-size:32px;color:rgba(255,255,255,0.4)">ms</span></div>
          <div style="font-size:14px;color:#94a3b8;margin-bottom:32px">average of ${valid.length} trials</div>
          <div style="display:flex;gap:24px;justify-content:center;margin-bottom:32px">
            <div><div style="font-size:12px;color:#64748b;margin-bottom:4px">BEST</div><div style="font-size:24px;font-weight:700;color:#22c55e">${best}ms</div></div>
            <div><div style="font-size:12px;color:#64748b;margin-bottom:4px">WORST</div><div style="font-size:24px;font-weight:700;color:#fca5a5">${worst}ms</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:32px">${pills}</div>
          <button id="retry" class="ui-control" style="background:transparent;color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.15);padding:10px 32px;font-size:14px;border-radius:6px;cursor:pointer;position:relative;z-index:10;">Try Again</button>
        </div>
      `;

      const retryBtn = containerRef.current.querySelector<HTMLButtonElement>('#retry');
      if (retryBtn) {
        retryBtn.onpointerdown = (e) => {
          e.stopPropagation();
          trialsRef.current = [];
          setTrials([]);
          currentTrialRef.current = 0;
          setCurrentTrial(0);
          setComplete(false);
          startTrial();
        };
      }
    }
  };

  // The Native Event Listener (Bypassing React entirely)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativePointerDown = (e: PointerEvent) => {
      // Ignore clicks on buttons, inputs, and links so we don't accidentally trigger a reaction
      const target = e.target as HTMLElement;
      if (target.closest('button, input, a, .ui-control')) return;

      e.preventDefault(); // Stop any browser-level touch/click processing

      if (failedTrialRef.current) {
        failedTrialRef.current = false;
        startTrial();
        return;
      }

      // Too early (while red)
      if (intervalRef.current !== 0 && timerRef.current !== 0) {
        clearTimeout(timerRef.current!);
        clearInterval(intervalRef.current!);
        intervalRef.current = 0;
        timerRef.current = 0;
        failedTrialRef.current = true;

        if (containerRef.current) {
          containerRef.current.style.background = '#ef4444';
          containerRef.current.innerHTML = `
            <div style="text-align:center; pointer-events: none;">
              <div style="font-size:48px;color:#fca5a5;margin-bottom:12px">Too early!</div>
              <div style="font-size:16px;color:rgba(255,255,255,0.5)">Click to try again</div>
            </div>
          `;
        }
        return;
      }

      // Clicked when green
      if (startRef.current !== 0) {
        const time = Math.round(performance.now() - startRef.current);

        if (containerRef.current) {
          containerRef.current.style.background = '#1e293b';
          containerRef.current.innerHTML = `
            <div style="text-align:center; pointer-events: none;">
              <div style="font-size:64px;font-weight:700;color:#22c55e;margin-bottom:8px">${time}ms</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.4)">Trial ${currentTrialRef.current + 1} of ${trialCountRef.current}</div>
            </div>
          `;
        }

        const next = currentTrialRef.current + 1;
        currentTrialRef.current = next;
        setCurrentTrial(next);
        trialsRef.current = [...trialsRef.current, { time, tooEarly: false }];
        setTrials([...trialsRef.current]);

        if (next >= trialCountRef.current) {
          showResults();
        } else {
          startTrial();
        }
      }
    };

    // Attach passive: false so preventDefault() works instantly
    container.addEventListener('pointerdown', handleNativePointerDown, { passive: false });

    return () => {
      container.removeEventListener('pointerdown', handleNativePointerDown);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#111827',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        userSelect: 'none',
        touchAction: 'none', // Prevents browser gesture delays
      }}
    >
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <a href="/" className="ui-control" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 14 }}>← Back</a>
      </div>

      <div style={{ position: 'absolute', top: 20, right: 24, color: 'rgba(255,255,255,0.3)', fontSize: 14, display: complete ? 'none' : undefined }}>
        {currentTrial + 1} / {trialCount}
      </div>

      <div style={{ textAlign: 'center', maxWidth: 480, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>⚡</div>
        <h1 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reaction Time</h1>
        <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Click anywhere to start. Wait for the screen to turn{' '}
          <span style={{ color: '#22c55e', fontWeight: 600 }}>green</span>, then click as fast as you can.
          <br /><br />
          If you click too early (while red), you&apos;ll need to restart that trial.
        </p>

        <div style={{ marginBottom: 32 }}>
          <label style={{ color: '#94a3b8', fontSize: 14, display: 'block', marginBottom: 12 }}>
            Number of trials: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{trialCount}</span>
          </label>
          <input
            className="ui-control"
            type="range"
            min={3}
            max={15}
            value={trialCount}
            onChange={(e) => setTrialCount(Number(e.target.value))}
            style={{ width: 240, accentColor: '#22c55e', cursor: 'pointer' }}
          />
        </div>

        <button
          className="ui-control"
          onPointerDown={(e) => { e.stopPropagation(); startTrial(); }}
          style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '14px 48px', fontSize: 16, fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
        >
          Start Test
        </button>
      </div>
    </div>
  );
}