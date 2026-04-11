'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ReplayRecording, WALL_SIZE, WALL_HALF } from '@/engine/types';
import { drawTargets } from '@/engine/rendering';
import { useSettings } from '@/hooks/useSettings';
import GameShell, { GameShellHandles } from './GameShell';
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, ArrowLeft } from 'lucide-react';

interface ReplayViewerProps {
  recording: ReplayRecording;
  onClose: () => void;
}

const SPEEDS = [0.5, 1, 2];

export default function ReplayViewer({ recording, onClose }: ReplayViewerProps) {
  useSettings(); // Syncs CSS variables (--ch-color, --ch-length, etc.) so the crosshair matches the user's settings
  const shellRef = useRef<GameShellHandles>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const playbackTimeRef = useRef(0);

  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const frames = recording.frames;
  const frame = frames[frameIndex] ?? frames[0];

  // Binary search for frame by time
  const findFrame = useCallback((time: number): number => {
    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].time < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [frames]);

  // Render current frame: move world + draw targets on canvas
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !frame) return;

    // Move world div — reverse the InputManager's transform
    if (shell.world) {
      const posX = WALL_HALF - frame.crosshairX;
      const posY = WALL_HALF - frame.crosshairY;
      shell.world.style.transform = `translate3d(calc(-50% + ${posX}px), calc(-50% + ${posY}px), 0)`;
    }

    // Draw targets on the canvas
    if (shell.canvas) {
      const ctx = shell.canvas.getContext('2d');
      if (ctx) {
        drawTargets(ctx, WALL_SIZE, WALL_SIZE, frame.targets);
      }
    }
  }, [frameIndex, frame]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    lastTimeRef.current = performance.now();
    playbackTimeRef.current = frames[frameIndex]?.time ?? 0;

    const loop = () => {
      const now = performance.now();
      const dt = (now - lastTimeRef.current) * speed;
      lastTimeRef.current = now;
      playbackTimeRef.current += dt;

      const newIdx = findFrame(playbackTimeRef.current);

      if (newIdx >= frames.length - 1) {
        setFrameIndex(frames.length - 1);
        setIsPlaying(false);
        return;
      }

      setFrameIndex(newIdx);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speed, findFrame, frames, frameIndex]);

  // Scrubber
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    setFrameIndex(idx);
    setIsPlaying(false);
    playbackTimeRef.current = frames[idx]?.time ?? 0;
  };

  // Transport
  const jumpToStart = () => { setFrameIndex(0); setIsPlaying(false); playbackTimeRef.current = 0; };
  const jumpToEnd = () => { setFrameIndex(frames.length - 1); setIsPlaying(false); };
  const stepBack = () => { setFrameIndex(Math.max(0, frameIndex - 60)); setIsPlaying(false); };
  const stepForward = () => { setFrameIndex(Math.min(frames.length - 1, frameIndex + 60)); setIsPlaying(false); };

  const togglePlay = () => {
    if (frameIndex >= frames.length - 1) {
      setFrameIndex(0);
      playbackTimeRef.current = 0;
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const elapsed = frame ? Math.round((frames[0]?.timeLeft ?? 60) - frame.timeLeft) : 0;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a0a0a] flex flex-col">
      {/* The 3D game environment */}
      <GameShell ref={shellRef} flashOpacity={0}>
        {/* Empty — no overlay needed inside the shell */}
      </GameShell>

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-[310] flex items-center justify-between px-5 py-3 bg-black/70 backdrop-blur-md border-b border-white/[0.08]">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-wider font-semibold text-xs">Back</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Replay</span>
        <div className="w-16" />
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 z-[310] bg-black/80 backdrop-blur-md border-t border-white/[0.08] px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Stats */}
          <div className="flex justify-center gap-8 text-xs text-white/40">
            <span>Time: <strong className="text-white/70">{elapsed}s</strong></span>
            <span>Score: <strong className="text-[#ff8c00]">{frame?.score ?? 0}</strong></span>
            <span>Frame: <strong className="text-white/70">{frameIndex + 1}</strong> / {frames.length}</span>
          </div>

          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frameIndex}
            onChange={handleScrub}
            className="w-full accent-[#ff8c00] h-1.5 cursor-pointer"
          />

          {/* Transport + Speed */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={jumpToStart} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={stepBack} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#ff8c00] flex items-center justify-center text-white hover:bg-[#ff9e2a] transition-colors cursor-pointer shadow-[0_0_16px_rgba(255,140,0,0.4)]"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button onClick={stepForward} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button onClick={jumpToEnd} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="ml-4 flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    speed === s
                      ? 'bg-[#ff8c00] text-white'
                      : 'bg-white/5 text-white/40 hover:text-white/70'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
