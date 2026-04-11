import { GameSystem, GameEngineInterface } from '../types';
import { TargetSystem } from './TargetSystem';
import { drawTargets } from '../rendering';

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
    drawTargets(this.ctx, this.canvas.width, this.canvas.height, targetSystem.targets);
  }

  reset(): void {
    this.update(0);
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
