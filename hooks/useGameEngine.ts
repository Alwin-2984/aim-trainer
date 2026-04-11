'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { RenderSystem } from '@/engine/systems/RenderSystem';
import { ScoreSystem } from '@/engine/systems/ScoreSystem';
import { EngineState, GamePhase, GameSystem, ModeDefinition } from '@/engine/types';

const INITIAL_STATE: EngineState = {
  phase: GamePhase.MENU,
  score: 0,
  totalShots: 0,
  timeLeft: 60,
  activeMode: '',
  targets: [],
};

export function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engineState, setEngineState] = useState<EngineState>(INITIAL_STATE);

  // Create engine once
  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;

    const unsub = engine.events.on('state:changed', (state) => {
      setEngineState(state);
    });

    return () => {
      unsub();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const actions = useMemo(() => ({
    start: () => engineRef.current?.start(),
    pause: () => engineRef.current?.pause(),
    reset: () => {
      engineRef.current?.reset();
      // Reload current mode to reinitialize systems
      const mode = engineRef.current?.activeMode;
      if (mode) engineRef.current?.loadMode(mode);
    },
    loadMode: (mode: ModeDefinition) => engineRef.current?.loadMode(mode),
    setSensitivity: (v: number) => engineRef.current?.input.setSensitivity(v),
    setPixelsPerDegree: (v: number) => engineRef.current?.input.setPixelsPerDegree(v),
    attachCanvas: (canvas: HTMLCanvasElement) => {
      engineRef.current?.attachCanvas(canvas);
    },
    attachWorld: (element: HTMLElement) => {
      engineRef.current?.attachWorld(element);
    },
    attachCrosshair: (element: HTMLElement) => {
      engineRef.current?.attachCrosshair(element);
    },
    getAccuracy: (): string => {
      try {
        return engineRef.current?.getSystem<ScoreSystem>('score').accuracy ?? '100';
      } catch {
        return '100';
      }
    },
    getScoreLabel: (): string => {
      try {
        return engineRef.current?.getSystem<ScoreSystem>('score').scoreLabel ?? '';
      } catch {
        return '';
      }
    },
    getTracksAccuracy: (): boolean => {
      try {
        return engineRef.current?.getSystem<ScoreSystem>('score').tracksAccuracy ?? false;
      } catch {
        return false;
      }
    },
    addSystem: (system: GameSystem) => engineRef.current?.addSystem(system),
    getActiveMode: (): ModeDefinition | null => {
      return engineRef.current?.activeMode ?? null;
    },
  }), []);

  return { state: engineState, actions, engineRef };
}
