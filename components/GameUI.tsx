import { GameMode } from '@/types/game';

interface GameUIProps {
  timeLeft: number;
  score: number;
  accuracy: string;
  gameMode: GameMode;
}

export default function GameUI({ timeLeft, score, accuracy, gameMode }: GameUIProps) {
  return (
    <div id="ui">
      <div className="stat-group">
        <div className="stat-label">Time Remaining</div>
        <div className="stat-value" id="timer">{timeLeft}</div>
      </div>
      <div className="stat-group">
        <div className="stat-label" id="score-label">
          {gameMode === 'tracking' ? 'Tracking Score' : 'Targets Cleared'}
        </div>
        <div className="stat-value" id="score">{score}</div>
      </div>
      {gameMode === 'flick' && (
        <div className="stat-group" id="acc-group">
          <div className="stat-label">Accuracy</div>
          <div className="stat-value" id="accuracy">{accuracy}</div>
        </div>
      )}
    </div>
  );
}
