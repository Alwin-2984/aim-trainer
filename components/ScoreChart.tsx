'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface ScorePoint {
  score: number;
  accuracy: string | null;
  createdAt: string;
}

interface ScoreChartProps {
  data: ScorePoint[];
  bestScore: number;
  accentColor?: string;
}

const PADDING = { top: 28, right: 16, bottom: 36, left: 48 };
const DOT_RADIUS = 4;
const HOVER_RADIUS = 6;

export default function ScoreChart({ data, bestScore, accentColor = '#ff8c00' }: ScoreChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ScorePoint; idx: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => {
      setSize({ w: container.clientWidth, h: 180 });
    });
    obs.observe(container);
    setSize({ w: container.clientWidth, h: 180 });
    return () => obs.disconnect();
  }, []);

  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, bestScore, 1);
  const range = maxScore - minScore || 1;

  const chartW = size.w - PADDING.left - PADDING.right;
  const chartH = size.h - PADDING.top - PADDING.bottom;

  const getX = useCallback((i: number) => PADDING.left + (data.length <= 1 ? chartW / 2 : (i / (data.length - 1)) * chartW), [data.length, chartW]);
  const getY = useCallback((score: number) => PADDING.top + chartH - ((score - minScore) / range) * chartH, [chartH, minScore, range]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || data.length === 0) return;

    canvas.width = size.w * 2;
    canvas.height = size.h * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    // Background
    ctx.clearRect(0, 0, size.w, size.h);

    // Grid lines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = PADDING.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartW, y);
      ctx.stroke();

      // Y-axis labels
      const val = Math.round(maxScore - (i / gridLines) * range);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(val), PADDING.left - 8, y + 3);
    }

    // X-axis game numbers
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
      ctx.fillText(`#${i + 1}`, getX(i), size.h - 8);
    }
    if (data.length > 1) {
      ctx.fillText(`#${data.length}`, getX(data.length - 1), size.h - 8);
    }

    // Best score line
    const bestY = getY(bestScore);
    ctx.strokeStyle = 'rgba(0,255,136,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, bestY);
    ctx.lineTo(PADDING.left + chartW, bestY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0,255,136,0.5)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`BEST ${bestScore}`, PADDING.left + 4, bestY - 5);

    // Area fill under line
    if (data.length > 1) {
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(scores[0]));
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(scores[i]));
      }
      ctx.lineTo(getX(data.length - 1), PADDING.top + chartH);
      ctx.lineTo(getX(0), PADDING.top + chartH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + chartH);
      grad.addColorStop(0, accentColor + '25');
      grad.addColorStop(1, accentColor + '05');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(scores[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(scores[i]));
    }
    ctx.stroke();

    // Dots
    for (let i = 0; i < data.length; i++) {
      const x = getX(i);
      const y = getY(scores[i]);

      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = scores[i] === bestScore ? '#00ff88' : accentColor;
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data, scores, size, bestScore, accentColor, chartW, chartH, range, maxScore, getX, getY]);

  // Mouse hover
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dx = Math.abs(mouseX - getX(i));
      if (dx < closestDist) {
        closestDist = dx;
        closest = i;
      }
    }

    if (closestDist < 30) {
      setTooltip({ x: getX(closest), y: getY(data[closest].score), point: data[closest], idx: closest });
    } else {
      setTooltip(null);
    }
  }, [data, getX, getY]);

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-white/20 text-sm">
        No games yet
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full" onMouseLeave={() => setTooltip(null)}>
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#1a1a2e] border border-white/15 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
          style={{
            left: Math.min(tooltip.x, size.w - 130),
            top: tooltip.y - 60,
          }}
        >
          <div className="text-white font-bold tabular-nums">
            Score: <span style={{ color: accentColor }}>{tooltip.point.score}</span>
          </div>
          {tooltip.point.accuracy && (
            <div className="text-white/50">Accuracy: {tooltip.point.accuracy}%</div>
          )}
          <div className="text-white/30 mt-0.5">
            Game #{tooltip.idx + 1} &middot; {new Date(tooltip.point.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
