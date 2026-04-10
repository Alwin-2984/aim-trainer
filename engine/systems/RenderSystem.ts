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
      const pulseScale = t.isTracking ? 1 : 1 + 0.05 * Math.sin(time * Math.PI);
      const r = radius * pulseScale;
      const isHit = t.isHit;

      // Pulse ring
      const ringScale = t.isTracking
        ? 0.9 + 0.6 * Math.sin(time * 1.5 - 0.5)
        : 0.8 + 0.4 * Math.sin(time * 0.5 - 0.5);
      const ringOpacity = t.isTracking
        ? Math.max(0, 0.8 - (time * 1.5 % 1) * 0.8)
        : Math.max(0, 0.6 - Math.abs(Math.sin(time * 0.5)) * 0.6);

      // Outer glow
      const glowColor = isHit
        ? 'rgba(0, 255, 100, 0.4)'
        : t.isTracking
          ? 'rgba(0, 210, 255, 0.3)'
          : 'rgba(255, 62, 62, 0.3)';
      const glowRadius = (r + 12) * (isHit ? 2.5 : 1);
      const gradient = ctx.createRadialGradient(screenX, screenY, r, screenX, screenY, glowRadius);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main circle
      const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r);
      if (isHit) {
        mainGradient.addColorStop(0, '#ffffff');
        mainGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        mainGradient.addColorStop(1, 'rgba(0, 255, 100, 0.6)');
      } else if (t.isTracking) {
        mainGradient.addColorStop(0, '#00d2ff');
        mainGradient.addColorStop(0.7, 'rgba(0, 210, 255, 0.6)');
        mainGradient.addColorStop(1, 'transparent');
      } else {
        mainGradient.addColorStop(0, '#ff3e3e');
        mainGradient.addColorStop(0.7, 'rgba(255, 62, 62, 0.6)');
        mainGradient.addColorStop(1, 'transparent');
      }
      ctx.beginPath();
      ctx.arc(screenX, screenY, r * (isHit ? 1.15 : 1), 0, Math.PI * 2);
      ctx.fillStyle = mainGradient;
      ctx.fill();

      // Center highlight
      ctx.beginPath();
      ctx.arc(screenX - r * 0.2, screenY - r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Pulsing ring
      const ringColor = isHit
        ? 'rgba(0, 255, 100, 0.6)'
        : t.isTracking
          ? 'rgba(0, 210, 255, 0.6)'
          : 'rgba(255, 62, 62, 0.6)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, r * ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = t.isTracking ? 2 : 1.5;
      ctx.globalAlpha = ringOpacity;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Border ring
      ctx.beginPath();
      ctx.arc(screenX, screenY, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = isHit
        ? 'rgba(0, 255, 100, 0.4)'
        : t.isTracking
          ? 'rgba(0, 210, 255, 0.3)'
          : 'rgba(255, 62, 62, 0.3)';
      ctx.lineWidth = t.isTracking ? 2 : 1.5;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
