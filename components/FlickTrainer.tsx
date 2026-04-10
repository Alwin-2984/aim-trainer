'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GamePhase, CS_FOV_HORZ, Difficulty } from '@/engine/types';
import { FlickModes } from '@/engine/modes';
import { analyzePerformance } from '@/game/aiAnalysis';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useSettings } from '@/hooks/useSettings';
import { useSaveScore } from '@/hooks/useSaveScore';
import GameShell, { GameShellHandles } from './GameShell';
import GameUI from './GameUI';
import Overlay from './Overlay';
import SettingsModal from './SettingsModal';
import DifficultySelector from './DifficultySelector';

export default function FlickTrainer() {
  const { state, actions } = useGameEngine();
  const { settings, sensitivity, settingsLoaded, setSensitivity, handleSettingChange } = useSettings();
  const { saveScore, resetSaved, fetchBest, personalBest, isNewBest } = useSaveScore();

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const shellRef = useRef<GameShellHandles>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (shell.canvas) actions.attachCanvas(shell.canvas);
    if (shell.world) actions.attachWorld(shell.world);
    if (shell.crosshair) actions.attachCrosshair(shell.crosshair);
  });

  useEffect(() => { actions.setSensitivity(sensitivity); }, [sensitivity, actions]);

  useEffect(() => {
    const update = () => actions.setPixelsPerDegree(window.innerWidth / CS_FOV_HORZ);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [actions]);

  // Load mode + fetch personal best when difficulty changes
  useEffect(() => {
    if (!settingsLoaded) return;
    actions.loadMode(FlickModes[difficulty]);
    fetchBest('flick', difficulty);
    setAiFeedback('');
  }, [difficulty, settingsLoaded, actions, fetchBest]);

  // Save score on game over
  useEffect(() => {
    if (state.phase === GamePhase.GAME_OVER && state.score > 0) {
      const acc = state.totalShots === 0 ? '100' : ((state.score / state.totalShots) * 100).toFixed(1);
      saveScore({ mode: 'flick', difficulty, score: state.score, totalShots: state.totalShots, accuracy: acc });
    }
  }, [state.phase, state.score, state.totalShots, difficulty, saveScore]);

  useEffect(() => {
    if (state.score > 0) {
      setFlashOpacity(0.15);
      const id = setTimeout(() => setFlashOpacity(0), 50);
      return () => clearTimeout(id);
    }
  }, [state.score]);

  const handleStart = useCallback(() => {
    if (state.phase === GamePhase.GAME_OVER) {
      actions.loadMode(FlickModes[difficulty]);
      setAiFeedback('');
      resetSaved();
    }
    actions.start();
  }, [state.phase, difficulty, actions, resetSaved]);

  const handleReset = useCallback(() => {
    actions.loadMode(FlickModes[difficulty]);
    setAiFeedback('');
  }, [difficulty, actions]);

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiFeedback('<em>Analyzing your performance data...</em>');
    try {
      const feedback = await analyzePerformance({
        modeName: `Micro-Flick (${difficulty})`,
        score: state.score,
        accuracy: actions.getAccuracy(),
        sensitivity,
        isTrackingMode: false,
      });
      setAiFeedback(feedback);
    } catch (error) {
      console.error(error);
      setAiFeedback('<span style="color: #ff3e3e;">Error: Coach disconnected.</span>');
    } finally {
      setAiLoading(false);
    }
  };

  const overlayVisible = state.phase !== GamePhase.PLAYING;
  const overlayInfo = getOverlayConfig(state.phase, state, settings.color, difficulty, personalBest, isNewBest);

  return (
    <GameShell ref={shellRef} flashOpacity={flashOpacity}>
      <Overlay
        visible={overlayVisible}
        phase={state.phase}
        title={overlayInfo.title}
        description={overlayInfo.description}
        startBtnText={overlayInfo.btnText}
        showAIBtn={state.phase === GamePhase.GAME_OVER}
        aiFeedback={aiFeedback}
        aiLoading={aiLoading}
        onStart={handleStart}
        onReset={handleReset}
        onAIAnalysis={handleAIAnalysis}
        onOpenSettings={() => setSettingsModalOpen(true)}
      >
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
      </Overlay>

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSettingChange={handleSettingChange}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />

      <GameUI
        timeLeft={state.timeLeft}
        score={state.score}
        accuracy={actions.getAccuracy() + '%'}
        scoreLabel="Targets Cleared"
        showAccuracy={true}
      />
    </GameShell>
  );
}

function getOverlayConfig(
  phase: GamePhase,
  state: { score: number; totalShots: number },
  accentColor: string,
  difficulty: Difficulty,
  personalBest: number | null,
  isNewBest: boolean,
) {
  switch (phase) {
    case GamePhase.MENU:
      return {
        title: 'Micro-Flick',
        description: FlickModes[difficulty].description + (personalBest !== null ? `<br><span style="color:rgba(255,255,255,0.4); font-size:0.85rem;">Personal Best: <strong style="color:#ff8c00">${personalBest}</strong></span>` : ''),
        btnText: 'Lock Mouse & Play',
      };
    case GamePhase.PAUSED:
      return { title: 'PAUSED', description: 'Click to resume your session', btnText: 'Resume' };
    case GamePhase.GAME_OVER: {
      const accuracy = state.totalShots === 0 ? '100' : ((state.score / state.totalShots) * 100).toFixed(1);
      const newBestTag = isNewBest ? '<br><span style="color:#00ff88; font-weight:800; font-size:1rem;">NEW PERSONAL BEST!</span>' : (personalBest !== null ? `<br><span style="color:rgba(255,255,255,0.4); font-size:0.85rem;">Personal Best: <strong style="color:#ff8c00">${personalBest}</strong></span>` : '');
      const stats = `Score: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${state.score}</span> | Accuracy: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${accuracy}%</span><br>Time's up!${newBestTag}`;
      return { title: 'CHALLENGE COMPLETE', description: stats, btnText: 'Play Again' };
    }
    default:
      return { title: '', description: '', btnText: '' };
  }
}
