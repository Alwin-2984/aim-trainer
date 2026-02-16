import { Settings as SettingsType, GameMode } from '@/types/game';
import ModeSelector from './ModeSelector';
import { SettingsIcon } from 'lucide-react';

interface OverlayProps {
  visible: boolean;
  title: string;
  description: string;
  startBtnText: string;
  showRestartBtn: boolean;
  showAIBtn: boolean;
  aiFeedback: string;
  aiLoading: boolean;
  isRestarting?: boolean;
  settings: SettingsType;
  sensitivity: number;
  onStart: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  onAIAnalysis: () => void;
  onSettingChange: (key: keyof SettingsType, value: any) => void;
  onSensitivityChange: (value: number) => void;
  onOpenSettings: () => void;
  onModeSelect: (mode: GameMode) => void;
}

export default function Overlay({
  visible,
  title,
  description,
  startBtnText,
  // showRestartBtn,
  showAIBtn,
  aiFeedback,
  aiLoading,
  // isRestarting = false,
  settings,
  onStart,
  // onRestart,
  onBackToMenu,
  onAIAnalysis,
  onOpenSettings,
  onModeSelect,
}: OverlayProps) {
  const isInitialScreen = startBtnText === 'Lock Mouse & Play';
  const isPaused = title === 'PAUSED';

  return (
    <div 
      id="overlay" 
      style={{ 
        opacity: visible ? 1 : 0, 
        visibility: visible ? 'visible' : 'hidden' 
      }}
    >
      {/* Settings Button - Top Right */}
      <button className="settings-btn" onClick={onOpenSettings} title="Settings">
       <SettingsIcon />
      </button>

      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-desc" dangerouslySetInnerHTML={{ __html: description }}></p>
        
        {/* Mode Selector - Only show on initial screen */}
        {isInitialScreen && (
          <ModeSelector 
            selectedMode={settings.mode} 
            onModeSelect={onModeSelect}
          />
        )}
        
        <div id="game-controls">
          <button className="btn btn-primary" id="start-btn" onClick={(e) => {
            setTimeout(() => {
              e.preventDefault();
              e.stopPropagation();
              onStart();
            }, 2000);
          }}>
            {startBtnText}
          </button>
          
          {isPaused && (
            <button 
              className="btn btn-menu" 
              onClick={onBackToMenu}
            >
              Back to Menu
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
