// ─── Constants ───
export const M_YAW = 0.022;
export const CS_FOV_HORZ = 106.26;
export const WALL_SIZE = 600;
export const WALL_HALF = WALL_SIZE / 2;

// ─── Difficulty ───
export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Game Phase ───
export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

// ─── Target Data ───
export interface TargetData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isTracking: boolean;
  isHit: boolean;
  pulsePhase: number;
  /** 1 = full health, 0 = eliminated. Only used with eliminateAfterMs. */
  healthPercent: number;
}

// ─── Engine State (read by React) ───
export interface EngineState {
  phase: GamePhase;
  score: number;
  totalShots: number;
  timeLeft: number;
  activeMode: string;
  targets: ReadonlyArray<TargetData>;
}

// ─── Event Map ───
export interface EngineEvents {
  'phase:changed': { from: GamePhase; to: GamePhase };
  'target:hit': { targetIndex: number; x: number; y: number };
  'target:miss': { x: number; y: number };
  'score:changed': { score: number; totalShots: number };
  'timer:tick': { timeLeft: number };
  'timer:expired': void;
  'input:mousedown': { canvasX: number; canvasY: number };
  'input:mouseup': void;
  'input:mousemove': { dx: number; dy: number };
  'state:changed': EngineState;
}

// ─── System Interface ───
export interface GameSystem {
  readonly id: string;
  init(engine: GameEngineInterface): void;
  update(dt: number): void;
  reset(): void;
  destroy(): void;
}

// Forward reference to avoid circular import
export interface GameEngineInterface {
  readonly events: EventBusInterface;
  readonly phase: GamePhase;
  readonly input: InputManagerInterface;
  getSystem<T extends GameSystem>(id: string): T;
  getState(): EngineState;
}

export interface EventBusInterface {
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (data: EngineEvents[K]) => void,
  ): () => void;
  emit<K extends keyof EngineEvents>(event: K, data: EngineEvents[K]): void;
}

export interface InputManagerInterface {
  readonly position: { x: number; y: number };
  readonly canvasPosition: { x: number; y: number };
  readonly isFiring: boolean;
  readonly isLocked: boolean;
  setSensitivity(value: number): void;
  setPixelsPerDegree(value: number): void;
  requestLock(): void;
  releaseLock(): void;
  resetPosition(): void;
}

// ─── System Configs ───
export interface TargetSystemConfig {
  count: number;
  radius: number;
  movement: 'static' | 'linear_bounce' | 'reactive';
  speed: number;
  respawnOnHit: boolean;
  hitDetection: 'click' | 'hover_while_firing';
  /** Confine target movement to a square of this size (centered on canvas). Defaults to WALL_SIZE. */
  boundsSize?: number;
  /** For 'reactive' movement: min ms between direction changes. Default 400. */
  dirChangeMinMs?: number;
  /** For 'reactive' movement: max ms between direction changes. Default 1200. */
  dirChangeMaxMs?: number;
  /** Eliminate target after tracking it for this many ms continuously. 0 = disabled. */
  eliminateAfterMs?: number;
}

export interface ScoreSystemConfig {
  tracksAccuracy: boolean;
  scoreOnClick: boolean;
  scoreOnTracking: boolean;
  scoreLabel: string;
}

export interface TimerSystemConfig {
  duration: number;
}

export interface SystemConfig {
  systemId: string;
  config: Record<string, unknown>;
}

// ─── HUD Config ───
export interface HudConfig {
  showAccuracy: boolean;
  scoreLabel: string;
}

// ─── Replay ───
export interface ReplayTargetSnapshot {
  x: number;
  y: number;
  radius: number;
  isHit: boolean;
  isTracking: boolean;
  healthPercent: number;
}

export interface ReplayFrame {
  time: number;
  crosshairX: number;
  crosshairY: number;
  isFiring: boolean;
  score: number;
  timeLeft: number;
  targets: ReplayTargetSnapshot[];
}

export interface ReplayRecording {
  duration: number;
  frameCount: number;
  modeId: string;
  frames: ReplayFrame[];
}

// ─── Mode Definition ───
export interface ModeDefinition {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  systems: SystemConfig[];
  hud: HudConfig;
  formatEndStats(state: EngineState, accentColor: string): string;
}
