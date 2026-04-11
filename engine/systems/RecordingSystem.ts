import {
  GameSystem,
  GameEngineInterface,
  GamePhase,
  ReplayRecording,
} from '../types';
import { TargetSystem } from './TargetSystem';
import { ScoreSystem } from './ScoreSystem';
import { TimerSystem } from './TimerSystem';

export class RecordingSystem implements GameSystem {
  readonly id = 'recording';
  private engine!: GameEngineInterface;
  private recording: ReplayRecording;
  private startTime = 0;
  private started = false;

  constructor(recording: ReplayRecording) {
    this.recording = recording;
  }

  init(engine: GameEngineInterface): void {
    this.engine = engine;
  }

  update(_dt: number): void {
    if (this.engine.phase !== GamePhase.PLAYING) return;

    if (!this.started) {
      this.startTime = performance.now();
      this.started = true;
    }

    const input = this.engine.input;
    const targets = this.engine.getSystem<TargetSystem>('target').targets;
    const score = this.engine.getSystem<ScoreSystem>('score');
    const timer = this.engine.getSystem<TimerSystem>('timer');

    this.recording.frames.push({
      time: performance.now() - this.startTime,
      crosshairX: input.canvasPosition.x,
      crosshairY: input.canvasPosition.y,
      isFiring: input.isFiring,
      score: score.score,
      timeLeft: timer.timeLeft,
      targets: targets.map((t) => ({
        x: t.x,
        y: t.y,
        radius: t.radius,
        isHit: t.isHit,
        isTracking: t.isTracking,
        healthPercent: t.healthPercent,
      })),
    });

    this.recording.frameCount = this.recording.frames.length;
    this.recording.duration = performance.now() - this.startTime;
  }

  reset(): void {
    // No-op — recording data must survive GAME_OVER
  }

  destroy(): void {
    // Nothing to clean up
  }
}
