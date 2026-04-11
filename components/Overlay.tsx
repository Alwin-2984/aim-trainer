import { GamePhase } from '@/engine/types';
import { SettingsIcon, Upload, Check } from 'lucide-react';
import Link from 'next/link';

interface OverlayProps {
  visible: boolean;
  phase: GamePhase;
  title: string;
  description: string;
  startBtnText: string;
  showAIBtn: boolean;
  aiFeedback: string;
  aiLoading: boolean;
  onStart: () => void;
  onReset: () => void;
  onAIAnalysis: () => void;
  onOpenSettings: () => void;
  showReplayBtn?: boolean;
  onWatchReplay?: () => void;
  onSaveReplay?: () => void;
  replaySaving?: boolean;
  replaySaved?: boolean;
  children?: React.ReactNode;
}

export default function Overlay({
  visible,
  phase,
  title,
  description,
  startBtnText,
  showAIBtn,
  aiFeedback,
  aiLoading,
  onStart,
  onReset,
  onAIAnalysis,
  onOpenSettings,
  showReplayBtn,
  onWatchReplay,
  onSaveReplay,
  replaySaving,
  replaySaved,
  children,
}: OverlayProps) {
  const isPaused = phase === GamePhase.PAUSED;
  const isMenu = phase === GamePhase.MENU;
  const isGameOver = phase === GamePhase.GAME_OVER;

  return (
    <div
      id="overlay"
      style={{
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      <button className="settings-btn" onClick={onOpenSettings} title="Settings">
        <SettingsIcon />
      </button>

      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-desc" dangerouslySetInnerHTML={{ __html: description }}></p>

        {isMenu && children}

        <div id="game-controls">
          <button
            className="btn btn-primary"
            id="start-btn"
            onClick={(e) => {
              setTimeout(() => {
                e.preventDefault();
                e.stopPropagation();
                onStart();
              }, 2000);
            }}
          >
            {startBtnText}
          </button>

          {isPaused && (
            <button className="btn btn-menu" onClick={onReset}>
              Restart
            </button>
          )}

          {showAIBtn && (
            <button
              className="btn btn-ai"
              id="ai-btn"
              onClick={onAIAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? 'Coach is Analyzing...' : 'Get AI Coach Tips'}
            </button>
          )}

          {/* Replay buttons — game over only */}
          {isGameOver && showReplayBtn && onWatchReplay && (
            <button className="btn btn-menu" onClick={onWatchReplay}>
              Watch Replay
            </button>
          )}

          {isGameOver && onSaveReplay && !replaySaved && (
            <button
              className="btn btn-menu"
              onClick={onSaveReplay}
              disabled={replaySaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload style={{ width: '14px', height: '14px' }} />
              {replaySaving ? 'Uploading...' : 'Save Replay'}
            </button>
          )}

          {isGameOver && replaySaved && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00ff88', fontSize: '0.85rem', fontWeight: 600 }}>
              <Check style={{ width: '14px', height: '14px' }} />
              Replay Saved
            </span>
          )}

          <Link href="/" className="btn btn-menu">
            Change Mode
          </Link>
        </div>

        {aiFeedback && (
          <div id="ai-feedback" style={{ display: 'block' }}>
            <div dangerouslySetInnerHTML={{ __html: aiFeedback }}></div>
          </div>
        )}

        <p className="hint-text">
          Press <kbd>ESC</kbd> to Pause / Unlock mouse
        </p>
      </div>
    </div>
  );
}
