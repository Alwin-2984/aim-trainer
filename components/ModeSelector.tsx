import { GameMode } from '@/types/game';
import Link from 'next/link';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeSelect: (mode: GameMode) => void;
}

export default function ModeSelector({ selectedMode, onModeSelect }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <h3>Select Training Mode</h3>
      <div className="mode-cards">
        <button
          className={`mode-card ${selectedMode === 'flick' ? 'active' : ''}`}
          onClick={() => onModeSelect('flick')}
        >
          <div className="mode-icon">🎯</div>
          <h4>Micro-Flick</h4>
          <p>Static target clicking for precision training</p>
          <div className="mode-stats">
            <span>5 Targets</span>
            <span>60s</span>
          </div>
        </button>

        <button
          className={`mode-card ${selectedMode === 'tracking' ? 'active' : ''}`}
          onClick={() => onModeSelect('tracking')}
        >
          <div className="mode-icon">📍</div>
          <h4>Smooth Tracking</h4>
          <p>Moving target tracking for consistency</p>
          <div className="mode-stats">
            <span>1 Target</span>
            <span>60s</span>
          </div>
        </button>

        <Link href="/reaction" className="mode-card">
          <div className="mode-icon">⚡</div>
          <h4>Reaction Time</h4>
          <p>Test your reaction speed — Human Benchmark style</p>
          <div className="mode-stats">
            <span>Custom Trials</span>
            <span>Summary</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
