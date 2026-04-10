import { GamePhase } from '@/engine/types';
import { SettingsIcon } from 'lucide-react';
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
  /** Extra content rendered between description and buttons (e.g. difficulty selector) */
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
  children,
}: OverlayProps) {
  const isPaused = phase === GamePhase.PAUSED;
  const isMenu = phase === GamePhase.MENU;

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

        {/* Slot for difficulty selector or other content — only on initial/menu screen */}
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
