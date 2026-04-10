'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WALL_SIZE } from '@/engine/types';
import Crosshair from './Crosshair';
import FPSCounter from './FPSCounter';

export interface GameShellHandles {
  canvas: HTMLCanvasElement | null;
  world: HTMLDivElement | null;
  crosshair: HTMLDivElement | null;
}

interface GameShellProps {
  flashOpacity: number;
  children?: React.ReactNode;
}

const GameShell = forwardRef<GameShellHandles, GameShellProps>(function GameShell(
  { flashOpacity, children },
  ref,
) {
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    get canvas() { return canvasRef.current; },
    get world() { return worldRef.current; },
    get crosshair() { return crosshairRef.current; },
  }));

  return (
    <>
      {children}

      <FPSCounter />

      <div id="hit-flash" style={{ opacity: flashOpacity }}></div>

      <Crosshair ref={crosshairRef} />

      <div id="world" ref={worldRef}>
        <svg id="room-lines" viewBox="0 0 6000 6000" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="2700" y2="2700" />
          <line x1="6000" y1="0" x2="3300" y2="2700" />
          <line x1="6000" y1="6000" x2="3300" y2="3300" />
          <line x1="0" y1="6000" x2="2700" y2="3300" />
        </svg>

        <canvas
          id="wall"
          ref={canvasRef}
          width={WALL_SIZE}
          height={WALL_SIZE}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            boxShadow:
              '0 0 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.2), inset 0 0 100px rgba(0, 0, 0, 0.5)',
            background: `
              linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              #1e1e1e
            `,
            backgroundSize: '50px 50px',
            contain: 'strict',
            zIndex: 10,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: WALL_SIZE + 6,
            height: WALL_SIZE + 6,
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(168, 85, 247, 0.1) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
            borderRadius: 2,
          }}
        />
      </div>
    </>
  );
});

export default GameShell;
