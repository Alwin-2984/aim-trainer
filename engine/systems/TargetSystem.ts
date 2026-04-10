import {
  GameSystem,
  GameEngineInterface,
  TargetData,
  TargetSystemConfig,
  WALL_SIZE,
} from '../types';

export class TargetSystem implements GameSystem {
  readonly id = 'target';
  private config: TargetSystemConfig;
  private engine!: GameEngineInterface;
  private _targets: TargetData[] = [];
  private unsubs: (() => void)[] = [];

  // Resolved bounds (centered on canvas)
  private boundsMin = 0;
  private boundsMax = WALL_SIZE;

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

    if (this.config.hitDetection === 'click') {
      this.unsubs.push(
        engine.events.on('input:mousedown', ({ canvasX, canvasY }) => {
          if (engine.phase !== 'PLAYING') return;
          this.handleClickHit(canvasX, canvasY);
        }),
      );
    }
  }

  update(_dt: number): void {
    if (this.engine.phase !== 'PLAYING') return;

    if (this.config.movement === 'linear_bounce') {
      const r = this.config.radius;
      for (const t of this._targets) {
        t.x += t.vx;
        t.y += t.vy;

        // Bounce off confined bounds
        if (t.x <= this.boundsMin + r || t.x >= this.boundsMax - r) t.vx *= -1;
        if (t.y <= this.boundsMin + r || t.y >= this.boundsMax - r) t.vy *= -1;

        t.x = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.x));
        t.y = Math.max(this.boundsMin + r, Math.min(this.boundsMax - r, t.y));
      }
    }

    if (this.config.hitDetection === 'hover_while_firing') {
      const { canvasPosition, isFiring } = this.engine.input;
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
        } else {
          t.isHit = false;
        }
      }
    }
  }

  reset(): void {
    this._targets = this.spawnInitialTargets();
  }

  destroy(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this._targets = [];
  }

  // ─── Private ───

  private resolveBounds(): void {
    const size = this.config.boundsSize ?? WALL_SIZE;
    const offset = (WALL_SIZE - size) / 2;
    this.boundsMin = offset;
    this.boundsMax = offset + size;
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
          this._targets.splice(i, 1);
          this._targets.push(this.spawnTarget());
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
    const isTracking = this.config.movement === 'linear_bounce';
    const padding = isTracking ? r * 2 : r + 20;

    // Spawn within confined bounds
    const spawnMin = this.boundsMin + padding;
    const spawnMax = this.boundsMax - padding;
    const spawnRange = Math.max(1, spawnMax - spawnMin);

    let vx = 0;
    let vy = 0;
    if (isTracking) {
      vx = (Math.random() - 0.5) * this.config.speed;
      vy = (Math.random() - 0.5) * this.config.speed;
      if (Math.abs(vx) < 0.5) vx = this.config.speed * 0.4;
    }

    return {
      x: Math.random() * spawnRange + spawnMin,
      y: Math.random() * spawnRange + spawnMin,
      vx,
      vy,
      radius: r,
      isTracking,
      isHit: false,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }
}
