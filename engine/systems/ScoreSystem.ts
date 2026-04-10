import {
  GameSystem,
  GameEngineInterface,
  ScoreSystemConfig,
} from '../types';

export class ScoreSystem implements GameSystem {
  readonly id = 'score';
  private config: ScoreSystemConfig;
  private engine!: GameEngineInterface;
  private _score = 0;
  private _totalShots = 0;
  private unsubs: (() => void)[] = [];

  constructor(config: ScoreSystemConfig) {
    this.config = config;
  }

  get score(): number {
    return this._score;
  }

  get totalShots(): number {
    return this._totalShots;
  }

  get accuracy(): string {
    if (this._totalShots === 0) return '100';
    return ((this._score / this._totalShots) * 100).toFixed(1);
  }

  get scoreLabel(): string {
    return this.config.scoreLabel;
  }

  get tracksAccuracy(): boolean {
    return this.config.tracksAccuracy;
  }

  init(engine: GameEngineInterface): void {
    this.engine = engine;

    // Click-based scoring
    if (this.config.scoreOnClick) {
      this.unsubs.push(
        engine.events.on('target:hit', () => {
          this._score += 1;
          this._totalShots += 1;
          this.emitChange();
        }),
      );
      this.unsubs.push(
        engine.events.on('target:miss', () => {
          this._totalShots += 1;
          this.emitChange();
        }),
      );
    }

    // Tracking-based scoring
    if (this.config.scoreOnTracking) {
      this.unsubs.push(
        engine.events.on('target:hit', () => {
          this._score += 1;
          this.emitChange();
        }),
      );
    }
  }

  update(_dt: number): void {
    // Scoring is event-driven, no per-frame work needed
  }

  reset(): void {
    this._score = 0;
    this._totalShots = 0;
  }

  destroy(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }

  private emitChange(): void {
    this.engine.events.emit('score:changed', {
      score: this._score,
      totalShots: this._totalShots,
    });
  }
}
