'use client';

import { useEffect, useRef, useState } from 'react';

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  const framesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(null);

  useEffect(() => {
    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      framesRef.current.push(delta);
      if (framesRef.current.length > 60) {
        framesRef.current.shift();
      }

      if (framesRef.current.length > 0) {
        const avgDelta = framesRef.current.reduce((a, b) => a + b, 0) / framesRef.current.length;
        setFps(Math.round(1000 / avgDelta));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        fontFamily: 'monospace',
        fontSize: '13px',
        color: 'rgba(99, 102, 241, 0.7)',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: '0.05em',
      }}
    >
      {fps} FPS
    </div>
  );
}
