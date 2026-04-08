export type GameMode = 'flick' | 'tracking';

export interface Settings {
  sensitivity: number;
  color: string;
  length: number;
  thickness: number;
  gap: number;
  dot: boolean;
  mode: GameMode;
}

export interface TrackingTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTracking: boolean;
  isHit: boolean;
  pulsePhase: number;
}

export interface GameState {
  score: number;
  totalShots: number;
  timeLeft: number;
  posX: number;
  posY: number;
  isLocked: boolean;
  isFiring: boolean;
  gameInterval: NodeJS.Timeout | null;
  activeTargets: TrackingTarget[];
}
