import {
  GameSystem,
  GameEngineInterface,
  TargetData,
  TargetSystemConfig,
  WALL_SIZE,
} from '../types';
import { playEliminateSound, startTrackingSound, stopTrackingSound } from '../SoundManager';

export class TargetSystem implements GameSystem {
  readonly id = 'target';
  private config: TargetSystemConfig;
  private engine!: GameEngineInterface;
  private _targets: TargetData[] = [];
  private unsubs: (() => void)[] = [];

  // Resolved bounds (centered on canvas)
  private boundsMin = 0;
  private boundsMax = WALL_SIZE;

  // Reactive movement state
  private nextDirChange: number[] = [];
  private dirChangeTimer: number[] = [];

  // Continuous tracking time per target (for eliminateAfterMs)
  private trackingTime: number[] = [];

  constructor(config: TargetSystemConfig) {
    this.config = config;
    this.resolveBounds();
  }

  get targets(): ReadonlyArray<TargetData> {
    return this._targets;
  }

  init(engine: GameEngineInterface): void {
    this.engine = engine;
    this._targets = this.spawnInitialTargets();
    this.initPerTargetState();

    if (this.config.hitDetection === 'click') {
      this.unsubs.push(
        engine.events.on('input:mousedown', ({ canvasX, canvasY }) => {
          if (engine.phase !== 'PLAYING') return;
          this.handleClickHit(canvasX, canvasY);
        }),
      );
    }
  }

  update(dt: number): void {
    if (this.engine.phase !== 'PLAYING') return;
    const r = this.config.radius;

    // ─── Movement ───
    if (this.config.movement === 'linear_bounce') {
      for (const t of this._targets) {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x <= this.boundsMin + r || t.x >= this.boundsMax - r) t.vx *= -1;
        if (t.y <= this.boundsMin + r || t.y >= this.boundsMax - r) t.vy *= -1;
        t.x = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.x));
        t.y = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.y));
      }
    }

    if (this.config.movement === 'reactive') {
      for (let i = 0; i < this._targets.length; i++) {
        const t = this._targets[i];
        this.dirChangeTimer[i] += dt;
        if (this.dirChangeTimer[i] >= this.nextDirChange[i]) {
          this.dirChangeTimer[i] = 0;
          this.nextDirChange[i] = this.randomDirInterval();
          const angle = Math.random() * Math.PI * 2;
          const spd = this.config.speed * (0.6 + Math.random() * 0.8);
          t.vx = Math.cos(angle) * spd;
          t.vy = Math.sin(angle) * spd;
        }
        t.x += t.vx;
        t.y += t.vy;
        if (t.x <= this.boundsMin + r || t.x >= this.boundsMax - r) t.vx *= -1;
        if (t.y <= this.boundsMin + r || t.y >= this.boundsMax - r) t.vy *= -1;
        t.x = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.x));
        t.y = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.y));
      }
    }

    // ─── Hit detection ───
    if (this.config.hitDetection === 'hover_while_firing') {
      const { canvasPosition, isFiring } = this.engine.input;
      const eliminateMs = this.config.eliminateAfterMs ?? 0;

      for (let i = 0; i < this._targets.length; i++) {
        const t = this._targets[i];
        const dx = canvasPosition.x - t.x;
        const dy = canvasPosition.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wasHit = t.isHit;

        if (isFiring && dist < this.config.radius) {
          t.isHit = true;
          if (!wasHit) {
            this.engine.events.emit('target:hit', { targetIndex: i, x: t.x, y: t.y });
          }

          // Accumulate tracking time and update health
          if (eliminateMs > 0) {
            this.trackingTime[i] += dt;
            t.healthPercent = Math.max(0, 1 - this.trackingTime[i] / eliminateMs);
            if (this.trackingTime[i] >= eliminateMs) {
              playEliminateSound();
              this.replaceTarget(i);
              this.engine.events.emit('target:hit', { targetIndex: i, x: t.x, y: t.y });
            }
          }
        } else {
          t.isHit = false;
        }
      }

      // Tracking sound: on if any target is being tracked, off otherwise
      const anyTracked = this._targets.some((t) => t.isHit);
      if (anyTracked) {
        startTrackingSound();
      } else {
        stopTrackingSound();
      }
    }
  }

  reset(): void {
    stopTrackingSound();
    this._targets = this.spawnInitialTargets();
    this.initPerTargetState();
  }

  destroy(): void {
    stopTrackingSound();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this._targets = [];
  }

  // ─── Private ───

  private initPerTargetState(): void {
    const count = this._targets.length;
    this.trackingTime = new Array(count).fill(0);
    if (this.config.movement === 'reactive') {
      this.nextDirChange = this._targets.map(() => this.randomDirInterval());
      this.dirChangeTimer = new Array(count).fill(0);
    }
  }

  private replaceTarget(index: number): void {
    this._targets[index] = this.spawnTarget();
    this.trackingTime[index] = 0;
    if (this.config.movement === 'reactive') {
      this.dirChangeTimer[index] = 0;
      this.nextDirChange[index] = this.randomDirInterval();
    }
  }

  private resolveBounds(): void {
    const size = this.config.boundsSize ?? WALL_SIZE;
    const offset = (WALL_SIZE - size) / 2;
    this.boundsMin = offset;
    this.boundsMax = offset + size;
  }

  private randomDirInterval(): number {
    const min = this.config.dirChangeMinMs ?? 400;
    const max = this.config.dirChangeMaxMs ?? 1200;
    return min + Math.random() * (max - min);
  }

  private handleClickHit(canvasX: number, canvasY: number): void {
    for (let i = 0; i < this._targets.length; i++) {
      const t = this._targets[i];
      const dx = canvasX - t.x;
      const dy = canvasY - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.config.radius) {
        this.engine.events.emit('target:hit', { targetIndex: i, x: t.x, y: t.y });
        if (this.config.respawnOnHit) {
          this.replaceTarget(i);
        }
        return;
      }
    }
    this.engine.events.emit('target:miss', { x: canvasX, y: canvasY });
  }

  private spawnInitialTargets(): TargetData[] {
    const targets: TargetData[] = [];
    for (let i = 0; i < this.config.count; i++) {
      targets.push(this.spawnTarget());
    }
    return targets;
  }

  private spawnTarget(): TargetData {
    const r = this.config.radius;
    const isMoving = this.config.movement !== 'static';
    const padding = isMoving ? r * 2 : r + 20;

    const spawnMin = this.boundsMin + padding;
    const spawnMax = this.boundsMax - padding;
    const spawnRange = Math.max(1, spawnMax - spawnMin);

    let vx = 0;
    let vy = 0;
    if (isMoving) {
      const angle = Math.random() * Math.PI * 2;
      const spd = this.config.speed * (0.6 + Math.random() * 0.4);
      vx = Math.cos(angle) * spd;
      vy = Math.sin(angle) * spd;
    }

    return {
      x: Math.random() * spawnRange + spawnMin,
      y: Math.random() * spawnRange + spawnMin,
      vx,
      vy,
      radius: r,
      isTracking: isMoving,
      isHit: false,
      pulsePhase: Math.random() * Math.PI * 2,
      healthPercent: 1,
    };
  }
}
