import { GameSystem, GameEngineInterface, TargetData } from '../types';
import { TargetSystem } from './TargetSystem';

export class RenderSystem implements GameSystem {
  readonly id = 'render';
  private engine!: GameEngineInterface;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  init(engine: GameEngineInterface): void {
    this.engine = engine;
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  update(_dt: number): void {
    if (!this.ctx || !this.canvas) return;

    const targetSystem = this.engine.getSystem<TargetSystem>('target');
    this.renderTargets(this.ctx, this.canvas.width, this.canvas.height, targetSystem.targets);
  }

  reset(): void {
    // Re-render with current targets
    this.update(0);
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }

  private renderTargets(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targets: ReadonlyArray<TargetData>,
  ): void {
    const time = performance.now() / 1000;
    ctx.clearRect(0, 0, width, height);

    for (const t of targets) {
      const screenX = t.x;
      const screenY = t.y;
      const radius = t.radius;
      const r = radius;
      const isHit = t.isHit;

      // Main circle — solid fill
      let fillColor: string;
      if (isHit) {
        fillColor = '#00ff66';
      } else if (t.isTracking) {
        fillColor = '#00d2ff';
      } else {
        fillColor = '#ff3e3e';
      }

      ctx.beginPath();
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Health bar — only show if damaged (healthPercent < 1)
      if (t.healthPercent < 1) {
        const barWidth = r * 2.4;
        const barHeight = 3;
        const barX = screenX - barWidth / 2;
        const barY = screenY + r + 8;
        const hp = Math.max(0, t.healthPercent);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
        ctx.fill();

        // Remaining HP — color transitions green → yellow → red
        const hpR = hp > 0.5 ? Math.round((1 - hp) * 2 * 255) : 255;
        const hpG = hp > 0.5 ? 255 : Math.round(hp * 2 * 255);
        ctx.fillStyle = `rgb(${hpR}, ${hpG}, 0)`;
        if (hp > 0) {
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth * hp, barHeight, 1.5);
          ctx.fill();
        }

        // Glow on the bar when low HP
        if (hp < 0.35) {
          ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = `rgba(255, ${Math.round(hp * 200)}, 0, 0.8)`;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth * hp, barHeight, 1.5);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }
    }
  }
}
