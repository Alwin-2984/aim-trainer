import {
  GamePhase,
  GameSystem,
  GameEngineInterface,
  EngineState,
  ModeDefinition,
  InputManagerInterface,
} from './types';
import { EventBus } from './EventBus';
import { StateMachine } from './StateMachine';
import { InputManager } from './InputManager';
import { TargetSystem } from './systems/TargetSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { TimerSystem } from './systems/TimerSystem';
import { RenderSystem } from './systems/RenderSystem';
import { playHitSound, playMissSound, playEliminateSound } from './SoundManager';

export class GameEngine implements GameEngineInterface {
  readonly events: EventBus;
  private stateMachine: StateMachine;
  private _input: InputManager;
  private systems = new Map<string, GameSystem>();
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private _activeMode: ModeDefinition | null = null;
  private onLockChange: (() => void) | null = null;

  constructor() {
    this.events = new EventBus();
    this.stateMachine = new StateMachine(this.events);
    this._input = new InputManager(this.events);

    // Timer expired -> game over
    this.events.on('timer:expired', () => {
      this._input.releaseLock();
    });

    // Sound effects
    this.events.on('target:hit', () => {
      playHitSound();
    });
    this.events.on('target:miss', () => {
      playMissSound();
    });
  }

  // ─── GameEngineInterface ───

  get phase(): GamePhase {
    return this.stateMachine.phase;
  }

  get input(): InputManagerInterface {
    return this._input;
  }

  get activeMode(): ModeDefinition | null {
    return this._activeMode;
  }

  getSystem<T extends GameSystem>(id: string): T {
    const system = this.systems.get(id);
    if (!system) throw new Error(`System "${id}" not found`);
    return system as T;
  }

  getState(): EngineState {
    const score = this.systems.has('score')
      ? this.getSystem<ScoreSystem>('score')
      : null;
    const timer = this.systems.has('timer')
      ? this.getSystem<TimerSystem>('timer')
      : null;
    const target = this.systems.has('target')
      ? this.getSystem<TargetSystem>('target')
      : null;

    return {
      phase: this.stateMachine.phase,
      score: score?.score ?? 0,
      totalShots: score?.totalShots ?? 0,
      timeLeft: timer?.timeLeft ?? 0,
      activeMode: this._activeMode?.id ?? '',
      targets: target ? [...target.targets] : [],
    };
  }

  // ─── Mode Management ───

  loadMode(mode: ModeDefinition): void {
    // Destroy existing systems
    this.destroySystems();
    this.stateMachine.reset();
    this._activeMode = mode;

    // Create systems from mode config
    for (const sc of mode.systems) {
      let system: GameSystem;
      switch (sc.systemId) {
        case 'target':
          system = new TargetSystem(sc.config as any);
          break;
        case 'score':
          system = new ScoreSystem(sc.config as any);
          break;
        case 'timer':
          system = new TimerSystem(sc.config as any);
          break;
        case 'render':
          system = new RenderSystem();
          break;
        default:
          continue;
      }
      this.systems.set(system.id, system);
    }

    // Initialize all systems
    for (const system of this.systems.values()) {
      system.init(this);
    }

    // Initial render
    this.emitState();
  }

  // ─── Lifecycle ───

  start(): void {
    if (this.phase === GamePhase.GAME_OVER) {
      this.resetSystems();
      this.stateMachine.reset();
    }

    // Set up lock change listener for this play session
    if (this.onLockChange) {
      document.removeEventListener('pointerlockchange', this.onLockChange);
    }
    this.onLockChange = () => {
      if (this._input.isLocked) {
        // Locked -> start playing
        if (this.stateMachine.canTransition(GamePhase.PLAYING)) {
          this.stateMachine.transition(GamePhase.PLAYING);
          this.startLoop();
          this.emitState();
        }
      } else {
        // Unlocked -> pause or game over
        this.stopLoop();
        if (this.phase === GamePhase.PLAYING) {
          const timer = this.systems.has('timer')
            ? this.getSystem<TimerSystem>('timer')
            : null;
          if (timer && timer.timeLeft <= 0) {
            this.stateMachine.transition(GamePhase.GAME_OVER);
          } else {
            this.stateMachine.transition(GamePhase.PAUSED);
          }
        }
        this.emitState();
      }
    };
    document.addEventListener('pointerlockchange', this.onLockChange);

    this._input.requestLock();
  }

  pause(): void {
    this.stopLoop();
    this._input.releaseLock();
  }

  reset(): void {
    this.stopLoop();
    this.resetSystems();
    this.stateMachine.reset();
    this._input.resetPosition();
    this.emitState();
  }

  destroy(): void {
    this.stopLoop();
    this.destroySystems();
    this._input.destroy();
    if (this.onLockChange) {
      document.removeEventListener('pointerlockchange', this.onLockChange);
    }
    this.events.clear();
  }

  // ─── Canvas / World attachment ───

  attachCanvas(canvas: HTMLCanvasElement): void {
    if (this.systems.has('render')) {
      this.getSystem<RenderSystem>('render').attachCanvas(canvas);
      // Trigger initial render
      this.getSystem<RenderSystem>('render').update(0);
    }
  }

  attachWorld(element: HTMLElement): void {
    this._input.attachWorld(element);
  }

  attachCrosshair(element: HTMLElement): void {
    this._input.attachCrosshair(element);
  }

  // ─── Game Loop ───

  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      for (const system of this.systems.values()) {
        system.update(dt);
      }
      this.emitState();

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private resetSystems(): void {
    for (const system of this.systems.values()) {
      system.reset();
    }
  }

  private destroySystems(): void {
    for (const system of this.systems.values()) {
      system.destroy();
    }
    this.systems.clear();
  }

  private emitState(): void {
    this.events.emit('state:changed', this.getState());
  }
}
