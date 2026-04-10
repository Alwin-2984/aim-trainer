import {
  GameSystem,
  GameEngineInterface,
  GamePhase,
  TimerSystemConfig,
} from '../types';

export class TimerSystem implements GameSystem {
  readonly id = 'timer';
  private config: TimerSystemConfig;
  private engine!: GameEngineInterface;
  private _timeLeft: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private unsubs: (() => void)[] = [];

  constructor(config: TimerSystemConfig) {
    this.config = config;
    this._timeLeft = config.duration;
  }

  get timeLeft(): number {
    return this._timeLeft;
  }

  init(engine: GameEngineInterface): void {
    this.engine = engine;

    this.unsubs.push(
      engine.events.on('phase:changed', ({ to }) => {
        if (to === GamePhase.PLAYING) {
          this.startInterval();
        } else {
          this.stopInterval();
        }
      }),
    );
  }

  update(_dt: number): void {
    // Timer uses setInterval for 1-second precision, not frame-based
  }

  reset(): void {
    this.stopInterval();
    this._timeLeft = this.config.duration;
  }

  destroy(): void {
    this.stopInterval();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }

  private startInterval(): void {
    if (this.intervalId !== null) return;

    this.intervalId = setInterval(() => {
      this._timeLeft -= 1;
      this.engine.events.emit('timer:tick', { timeLeft: this._timeLeft });

      if (this._timeLeft <= 0) {
        this.stopInterval();
        this.engine.events.emit('timer:expired', undefined as unknown as void);
      }
    }, 1000);
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
