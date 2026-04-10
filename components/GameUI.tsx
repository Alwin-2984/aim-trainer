interface GameUIProps {
  timeLeft: number;
  score: number;
  accuracy: string;
  scoreLabel: string;
  showAccuracy: boolean;
}

export default function GameUI({ timeLeft, score, accuracy, scoreLabel, showAccuracy }: GameUIProps) {
  return (
    <div id="ui">
      <div className="stat-group">
        <div className="stat-label">Time Remaining</div>
        <div className="stat-value" id="timer">{timeLeft}</div>
      </div>
      <div className="stat-group">
        <div className="stat-label" id="score-label">{scoreLabel}</div>
        <div className="stat-value" id="score">{score}</div>
      </div>
      {showAccuracy && (
        <div className="stat-group" id="acc-group">
          <div className="stat-label">Accuracy</div>
          <div className="stat-value" id="accuracy">{accuracy}</div>
        </div>
      )}
    </div>
  );
}
