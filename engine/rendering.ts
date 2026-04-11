import { TargetData, ReplayTargetSnapshot } from './types';

type DrawableTarget = TargetData | ReplayTargetSnapshot;

/** Draw targets on a canvas — used by both live game and replay viewer. */
export function drawTargets(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  targets: ReadonlyArray<DrawableTarget>,
): void {
  ctx.clearRect(0, 0, width, height);

  for (const t of targets) {
    const r = t.radius;
    const isHit = t.isHit;

    let fillColor: string;
    if (isHit) {
      fillColor = '#00ff66';
    } else if (t.isTracking) {
      fillColor = '#00d2ff';
    } else {
      fillColor = '#ff3e3e';
    }

    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Health bar — only if damaged
    if (t.healthPercent < 1) {
      const barWidth = r * 2.4;
      const barHeight = 3;
      const barX = t.x - barWidth / 2;
      const barY = t.y + r + 8;
      const hp = Math.max(0, t.healthPercent);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
      ctx.fill();

      const hpR = hp > 0.5 ? Math.round((1 - hp) * 2 * 255) : 255;
      const hpG = hp > 0.5 ? 255 : Math.round(hp * 2 * 255);
      ctx.fillStyle = `rgb(${hpR}, ${hpG}, 0)`;
      if (hp > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * hp, barHeight, 1.5);
        ctx.fill();
      }

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

/** Draw crosshair dot at a position. */
export function drawCrosshairDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isFiring: boolean,
): void {
  ctx.beginPath();
  ctx.arc(x, y, isFiring ? 4 : 3, 0, Math.PI * 2);
  ctx.fillStyle = isFiring ? '#ff8c00' : '#00ff00';
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, isFiring ? 6 : 5, 0, Math.PI * 2);
  ctx.strokeStyle = isFiring ? 'rgba(255, 140, 0, 0.5)' : 'rgba(0, 255, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Draw fading trail of recent crosshair positions. */
export function drawCrosshairTrail(
  ctx: CanvasRenderingContext2D,
  frames: ReadonlyArray<{ crosshairX: number; crosshairY: number }>,
  currentIndex: number,
  trailLength: number,
): void {
  const start = Math.max(0, currentIndex - trailLength);
  if (currentIndex - start < 2) return;

  ctx.beginPath();
  ctx.moveTo(frames[start].crosshairX, frames[start].crosshairY);
  for (let i = start + 1; i <= currentIndex; i++) {
    ctx.lineTo(frames[i].crosshairX, frames[i].crosshairY);
  }
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
