'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Settings, GameState, GameMode } from '@/types/game';
import Crosshair from './Crosshair';
import FPSCounter from './FPSCounter';
import GameUI from './GameUI';
import Overlay from './Overlay';
import SettingsModal from './SettingsModal';

const M_YAW = 0.022;
const CS_FOV_HORZ = 106.26;

// Target radius constants (matches CSS: flick=6, tracking=14)
const FLICK_RADIUS = 6;
const TRACKING_RADIUS = 14;
const WALL_SIZE = 600;
const WALL_HALF = WALL_SIZE / 2;

interface TargetData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTracking: boolean;
  isHit: boolean;
  pulsePhase: number;
}

const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1.0,
  color: '#00ff00',
  length: 0,
  thickness: 0,
  gap: 0,
  dot: true,
  mode: 'flick',
};

export default function AimTrainer() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    totalShots: 0,
    timeLeft: 60,
    posX: 0,
    posY: 0,
    isLocked: false,
    isFiring: false,
    gameInterval: null,
    activeTargets: [],
  });

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [pixelsPerDegree, setPixelsPerDegree] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayTitle, setOverlayTitle] = useState('train your skills here');
  const [overlayDesc, setOverlayDesc] = useState('');
  const [startBtnText, setStartBtnText] = useState('Lock Mouse & Play');
  const [showRestartBtn, setShowRestartBtn] = useState(false);
  const [showAIBtn, setShowAIBtn] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hot-path values in refs (no re-renders on mutation)
  const posRef = useRef({ x: 0, y: 0 });
  const isFiringRef = useRef(false);
  const isLockedRef = useRef(false);
  const activeTargetsRef = useRef<TargetData[]>([]);
  const sensitivityRef = useRef(1.0);
  const pixelsPerDegreeRef = useRef(0);
  const modeRef = useRef<GameMode>('flick');

  const animationFrameRef = useRef<number>(null);
  const isInitialMount = useRef(true);
  const lastUnlockTime = useRef<number>(0);
  const lockRequestPending = useRef(false);

  // Keep refs in sync with state
  sensitivityRef.current = sensitivity;
  pixelsPerDegreeRef.current = pixelsPerDegree;
  modeRef.current = settings.mode;

  const updatePixelsPerDegree = useCallback(() => {
    setPixelsPerDegree(window.innerWidth / CS_FOV_HORZ);
  }, []);

  useEffect(() => {
    updatePixelsPerDegree();
    const handler = () => updatePixelsPerDegree();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [updatePixelsPerDegree]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aimTrainerSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        if (parsed.sensitivity !== undefined) {
          setSensitivity(parsed.sensitivity);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    setSettingsLoaded(true);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    const settingsToSave = { ...settings, sensitivity };
    localStorage.setItem('aimTrainerSettings', JSON.stringify(settingsToSave));
  }, [settings, sensitivity]);

  // Update CSS variables for crosshair
  useEffect(() => {
    document.documentElement.style.setProperty('--ch-color', settings.color);
    document.documentElement.style.setProperty('--ch-length', `${settings.length}px`);
    document.documentElement.style.setProperty('--ch-thickness', `${settings.thickness}px`);
    document.documentElement.style.setProperty('--ch-gap', `${settings.gap}px`);
    document.documentElement.style.setProperty('--ch-dot-opacity', settings.dot ? '1' : '0');
  }, [settings]);

  // --- Canvas Rendering ---
  const renderTargets = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const time = performance.now() / 1000;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    for (const t of activeTargetsRef.current) {
      const screenX = t.x;
      const screenY = t.y;
      const radius = t.isTracking ? TRACKING_RADIUS : FLICK_RADIUS;
      const pulseScale = t.isTracking ? 1 : 1 + 0.05 * Math.sin(time * Math.PI);
      const r = radius * pulseScale;
      const isHit = t.isHit;

      // Pulse ring
      const ringScale = t.isTracking
        ? 0.9 + 0.6 * Math.sin(time * 1.5 - 0.5)
        : 0.8 + 0.4 * Math.sin(time * 0.5 - 0.5);
      const ringOpacity = t.isTracking
        ? Math.max(0, 0.8 - (time * 1.5 % 1) * 0.8)
        : Math.max(0, 0.6 - Math.abs(Math.sin(time * 0.5)) * 0.6);

      // Outer glow
      const glowColor = isHit ? 'rgba(0, 255, 100, 0.4)' : t.isTracking ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 62, 62, 0.3)';
      const glowRadius = (r + 12) * (isHit ? 2.5 : 1);
      const gradient = ctx.createRadialGradient(screenX, screenY, r, screenX, screenY, glowRadius);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main circle with radial gradient
      const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r);
      if (isHit) {
        mainGradient.addColorStop(0, '#ffffff');
        mainGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        mainGradient.addColorStop(1, 'rgba(0, 255, 100, 0.6)');
      } else if (t.isTracking) {
        mainGradient.addColorStop(0, '#00d2ff');
        mainGradient.addColorStop(0.7, 'rgba(0, 210, 255, 0.6)');
        mainGradient.addColorStop(1, 'transparent');
      } else {
        mainGradient.addColorStop(0, '#ff3e3e');
        mainGradient.addColorStop(0.7, 'rgba(255, 62, 62, 0.6)');
        mainGradient.addColorStop(1, 'transparent');
      }

      ctx.beginPath();
      ctx.arc(screenX, screenY, r * (isHit ? 1.15 : 1), 0, Math.PI * 2);
      ctx.fillStyle = mainGradient;
      ctx.fill();

      // Center highlight
      ctx.beginPath();
      ctx.arc(screenX - r * 0.2, screenY - r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Pulsing ring
      const ringColor = isHit ? 'rgba(0, 255, 100, 0.6)' : t.isTracking ? 'rgba(0, 210, 255, 0.6)' : 'rgba(255, 62, 62, 0.6)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, r * ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = t.isTracking ? 2 : 1.5;
      ctx.globalAlpha = ringOpacity;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Border ring
      ctx.beginPath();
      ctx.arc(screenX, screenY, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = isHit ? 'rgba(0, 255, 100, 0.4)' : t.isTracking ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 62, 62, 0.3)';
      ctx.lineWidth = t.isTracking ? 2 : 1.5;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, []);

  // Game tick for tracking mode — runs on refs, only updates state for score
  const gameTick = useCallback(() => {
    if (!isLockedRef.current || modeRef.current !== 'tracking') return;

    const targets = activeTargetsRef.current;
    const isFiring = isFiringRef.current;
    // Crosshair position in canvas space
    const crosshairCanvasX = WALL_HALF - posRef.current.x;
    const crosshairCanvasY = WALL_HALF - posRef.current.y;
    let scored = false;

    for (const t of targets) {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x <= TRACKING_RADIUS || t.x >= WALL_SIZE - TRACKING_RADIUS) t.vx *= -1;
      if (t.y <= TRACKING_RADIUS || t.y >= WALL_SIZE - TRACKING_RADIUS) t.vy *= -1;

      t.x = Math.max(TRACKING_RADIUS, Math.min(WALL_SIZE - TRACKING_RADIUS, t.x));
      t.y = Math.max(TRACKING_RADIUS, Math.min(WALL_SIZE - TRACKING_RADIUS, t.y));

      // Pure math hit detection (no DOM)
      const dx = crosshairCanvasX - t.x;
      const dy = crosshairCanvasY - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wasHit = t.isHit;

      if (isFiring && dist < TRACKING_RADIUS) {
        t.isHit = true;
        if (!wasHit) scored = true;
      } else {
        t.isHit = false;
      }
    }

    renderTargets();

    if (scored) {
      setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
    }

    animationFrameRef.current = requestAnimationFrame(gameTick);
  }, [renderTargets]);

  useEffect(() => {
    if (gameState.isLocked && settings.mode === 'tracking') {
      animationFrameRef.current = requestAnimationFrame(gameTick);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isLocked, settings.mode, gameTick]);

  // --- Target Creation (Canvas) ---
  const createTargetFlick = useCallback(() => {
    const x = Math.random() * (WALL_SIZE - FLICK_RADIUS * 2 - 40) + FLICK_RADIUS + 20;
    const y = Math.random() * (WALL_SIZE - FLICK_RADIUS * 2 - 40) + FLICK_RADIUS + 20;
    activeTargetsRef.current.push({
      x, y, vx: 0, vy: 0, isTracking: false, isHit: false, pulsePhase: Math.random() * Math.PI * 2,
    });
    renderTargets();
  }, [renderTargets]);

  const createTargetTracking = useCallback(() => {
    const x = Math.random() * (WALL_SIZE - TRACKING_RADIUS * 4) + TRACKING_RADIUS * 2;
    const y = Math.random() * (WALL_SIZE - TRACKING_RADIUS * 4) + TRACKING_RADIUS * 2;

    let vx = (Math.random() - 0.5) * 6;
    let vy = (Math.random() - 0.5) * 6;
    if (Math.abs(vx) < 1) vx = 2;

    activeTargetsRef.current = [{
      x, y, vx, vy, isTracking: true, isHit: false, pulsePhase: 0,
    }];
    renderTargets();
  }, [renderTargets]);

  // --- Reset Game ---
  const resetGame = useCallback(() => {
    activeTargetsRef.current = [];
    isFiringRef.current = false;
    posRef.current = { x: 0, y: 0 };

    if (worldRef.current) {
      worldRef.current.style.transform = 'translate3d(-50%, -50%, 0)';
    }

    setGameState((prev) => ({
      ...prev,
      score: 0,
      totalShots: 0,
      timeLeft: 60,
      activeTargets: [],
    }));

    setShowAIBtn(false);
    setAiFeedback('');

    if (settings.mode === 'flick') {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => createTargetFlick(), i * 10);
      }
    } else {
      createTargetTracking();
    }
  }, [settings.mode, createTargetFlick, createTargetTracking]);

  // --- Timer ---
  const startTimer = useCallback(() => {
    if (gameState.timeLeft > 0 && !gameState.gameInterval) {
      const interval = setInterval(() => {
        setGameState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            clearInterval(interval);
            document.exitPointerLock();
            return { ...prev, timeLeft: 0, gameInterval: null };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);

      setGameState((prev) => ({ ...prev, gameInterval: interval }));
    }
  }, [gameState.timeLeft, gameState.gameInterval]);

  const stopTimer = useCallback(() => {
    if (gameState.gameInterval) {
      clearInterval(gameState.gameInterval);
      setGameState((prev) => ({ ...prev, gameInterval: null }));
    }
  }, [gameState.gameInterval]);

  // --- Overlay Text ---
  const updateOverlayText = useCallback(() => {
    if (gameState.timeLeft <= 0) {
      setOverlayTitle('CHALLENGE COMPLETE');
      let statsHtml = `Score: <span style="color:${settings.color}; font-weight:800; font-size:1.2rem;">${gameState.score}</span>`;

      if (settings.mode === 'flick') {
        const acc = getAccuracy();
        statsHtml += ` | Accuracy: <span style="color:${settings.color}; font-weight:800; font-size:1.2rem;">${acc}%</span>`;
      }

      setOverlayDesc(`${statsHtml}<br>Time's up!`);
      setStartBtnText('Play Again');
      setShowAIBtn(true);
      setShowRestartBtn(false);
    } else if (gameState.score > 0 || gameState.timeLeft < 60) {
      setOverlayTitle('PAUSED');
      setOverlayDesc('Click to resume your session');
      setStartBtnText('Resume');
      setShowRestartBtn(true);
      setShowAIBtn(false);
    } else {
      setOverlayTitle('train your skills here');
      setStartBtnText('Lock Mouse & Play');
      setShowRestartBtn(false);
      setShowAIBtn(false);
    }
  }, [gameState.timeLeft, gameState.score, settings.color, settings.mode]);

  // --- Accuracy ---
  const getAccuracy = useCallback(() => {
    if (gameState.totalShots === 0) return '100';
    return ((gameState.score / gameState.totalShots) * 100).toFixed(1);
  }, [gameState.score, gameState.totalShots]);

  // --- Hit Detection for Flick Mode (pure math) ---
  const checkHitFlick = useCallback(() => {
    // Crosshair position in canvas space = center - world offset
    // The world moves, so the crosshair points to a shifted position on the canvas
    const crosshairCanvasX = WALL_HALF - posRef.current.x;
    const crosshairCanvasY = WALL_HALF - posRef.current.y;
    const targets = activeTargetsRef.current;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (t.isTracking) continue;

      const dx = crosshairCanvasX - t.x;
      const dy = crosshairCanvasY - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < FLICK_RADIUS) {
        setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
        targets.splice(i, 1);
        setFlashOpacity(0.15);
        setTimeout(() => setFlashOpacity(0), 50);
        createTargetFlick();
        return;
      }
    }
  }, [createTargetFlick]);

  // --- Mouse Movement (direct DOM, no state) ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isLockedRef.current || !worldRef.current) return;

    const degX = e.movementX * sensitivityRef.current * M_YAW;
    const degY = e.movementY * sensitivityRef.current * M_YAW;
    const pixelMoveX = degX * pixelsPerDegreeRef.current;
    const pixelMoveY = degY * pixelsPerDegreeRef.current;

    const newPosX = Math.max(-2500, Math.min(2500, posRef.current.x - pixelMoveX));
    const newPosY = Math.max(-2500, Math.min(2500, posRef.current.y - pixelMoveY));
    posRef.current = { x: newPosX, y: newPosY };

    // Direct DOM update — no state, no re-render
    // translate3d forces GPU compositing, eliminating layout pipeline
    worldRef.current.style.transform = `translate3d(calc(-50% + ${newPosX}px), calc(-50% + ${newPosY}px), 0)`;
  }, []);

  // --- Mouse Down ---
  const handleMouseDown = useCallback(() => {
    if (!isLockedRef.current) return;

    isFiringRef.current = true;

    if (crosshairRef.current) {
      crosshairRef.current.classList.remove('recoil');
      void crosshairRef.current.offsetWidth;
      crosshairRef.current.classList.add('recoil');
    }

    if (gameState.timeLeft > 0 && modeRef.current === 'flick') {
      setGameState((prev) => ({ ...prev, totalShots: prev.totalShots + 1 }));
      checkHitFlick();
    }
  }, [gameState.timeLeft, checkHitFlick]);

  // --- Mouse Up ---
  const handleMouseUp = useCallback(() => {
    isFiringRef.current = false;
  }, []);

  const crosshairRef = useRef<HTMLDivElement>(null);

  // --- Pointer Lock ---
  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement === document.body) {
        isLockedRef.current = true;
        lockRequestPending.current = false;
        setOverlayVisible(false);
        setGameState((prev) => ({ ...prev, isLocked: true }));
        startTimer();
      } else {
        isLockedRef.current = false;
        lockRequestPending.current = false;
        lastUnlockTime.current = Date.now();
        setOverlayVisible(true);
        setGameState((prev) => ({ ...prev, isLocked: false }));
        stopTimer();
        updateOverlayText();
      }
    };

    const handlePointerLockError = () => {
      lockRequestPending.current = false;
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [startTimer, stopTimer, updateOverlayText]);

  // --- Mouse Events ---
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  // --- Initialize Game ---
  useEffect(() => {
    if (settingsLoaded && isInitialMount.current) {
      resetGame();
      isInitialMount.current = false;
    }
  }, [settingsLoaded, resetGame]);

  // --- Mode Change ---
  useEffect(() => {
    if (!isInitialMount.current && settingsLoaded) {
      resetGame();
      setOverlayTitle('train your skills here');
      setOverlayDesc('');
      setStartBtnText('Lock Mouse & Play');
      setShowRestartBtn(false);
      setShowAIBtn(false);
    }
  }, [settings.mode, settingsLoaded, resetGame]);

  // --- Start Button ---
  const handleStart = () => {
    if (document.pointerLockElement === document.body) return;
    if (lockRequestPending.current) return;

    if (gameState.timeLeft <= 0) {
      resetGame();
    }

    const timeSinceUnlock = Date.now() - lastUnlockTime.current;
    const minCooldown = 300;

    const requestLock = () => {
      if (document.pointerLockElement !== document.body && !lockRequestPending.current) {
        lockRequestPending.current = true;
        document.body.requestPointerLock().catch((error) => {
          lockRequestPending.current = false;
          if (error.message.includes('exited the lock')) {
            setTimeout(() => {
              if (document.pointerLockElement !== document.body && !lockRequestPending.current) {
                lockRequestPending.current = true;
                document.body.requestPointerLock().catch(() => {});
              }
            }, 500);
          }
        });
      }
    };

    if (timeSinceUnlock < minCooldown) {
      setTimeout(requestLock, minCooldown - timeSinceUnlock);
    } else {
      setTimeout(requestLock, 50);
    }
  };

  // --- Restart ---
  const handleRestart = useCallback((e?: React.MouseEvent) => {
    if (isRestarting) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsRestarting(true);

    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }

    setOverlayVisible(true);

    setTimeout(() => {
      resetGame();
      setTimeout(() => {
        updateOverlayText();
        setIsRestarting(false);
      }, 50);
    }, 50);
  }, [isRestarting, resetGame, updateOverlayText]);

  // --- AI Analysis ---
  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiFeedback('<em>Analyzing your performance data...</em>');

    const accuracy = getAccuracy();
    const modeName = settings.mode === 'flick' ? 'Micro-Adjustment Clicking' : 'Smooth Tracking';
    const prompt = `
      I just finished a 60-second aim training session.
      Scenario: ${modeName}
      Stats:
      - Score: ${gameState.score} ${settings.mode === 'tracking' ? '(Frames Tracked)' : '(Targets Hit)'}
      - Accuracy: ${settings.mode === 'tracking' ? 'N/A (Tracking)' : accuracy + '%'}
      - Sensitivity: ${sensitivity} (CS2)

      Act as a professional Esports Aim Coach.
      1. Assessment: 1 sentence on my performance.
      2. Advice: 1 specific, actionable drill or tip for ${modeName}.
      3. Keep response under 60 words.
    `;

    try {
      const apiKey = '';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      setAiFeedback(`<h3><span style="font-size:1.4em">🤖</span> Coach's Feedback</h3>${formattedText}`);
    } catch (error) {
      console.error(error);
      setAiFeedback('<span style="color: #ff3e3e;">Error: Coach disconnected.</span>');
    } finally {
      setAiLoading(false);
    }
  };

  // --- Settings Handlers ---
  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeSelect = (mode: GameMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  // --- Back to Menu ---
  const handleBackToMenu = useCallback(() => {
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }
    resetGame();
    setOverlayTitle('train your skills here');
    setOverlayDesc('');
    setStartBtnText('Lock Mouse & Play');
    setShowRestartBtn(false);
    setShowAIBtn(false);
    setAiFeedback('');
    setOverlayVisible(true);
  }, [resetGame]);

  return (
    <>
      <Overlay
        visible={overlayVisible}
        title={overlayTitle}
        description={overlayDesc}
        startBtnText={startBtnText}
        showRestartBtn={showRestartBtn}
        showAIBtn={showAIBtn}
        aiFeedback={aiFeedback}
        aiLoading={aiLoading}
        isRestarting={isRestarting}
        settings={settings}
        sensitivity={sensitivity}
        onStart={handleStart}
        onRestart={handleRestart}
        onBackToMenu={handleBackToMenu}
        onAIAnalysis={handleAIAnalysis}
        onSettingChange={handleSettingChange}
        onSensitivityChange={setSensitivity}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onModeSelect={handleModeSelect}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSettingChange={handleSettingChange}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />

      <GameUI
        timeLeft={gameState.timeLeft}
        score={gameState.score}
        accuracy={getAccuracy() + '%'}
        gameMode={settings.mode}
      />

      <FPSCounter />

      <div id="hit-flash" style={{ opacity: flashOpacity }}></div>

      <Crosshair className={gameState.isFiring ? 'recoil' : ''} />

      <div id="world" ref={worldRef}>
        <svg id="room-lines" viewBox="0 0 6000 6000" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="2700" y2="2700" />
          <line x1="6000" y1="0" x2="3300" y2="2700" />
          <line x1="6000" y1="6000" x2="3300" y2="3300" />
          <line x1="0" y1="6000" x2="2700" y2="3300" />
        </svg>

        {/* Canvas replaces the old wall div + DOM targets */}
        <canvas
          id="wall"
          ref={canvasRef}
          width={WALL_SIZE}
          height={WALL_SIZE}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.2), inset 0 0 100px rgba(0, 0, 0, 0.5)',
            background: `
              linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              #1e1e1e
            `,
            backgroundSize: '50px 50px',
            contain: 'strict',
            zIndex: 10,
          }}
        />

        {/* Corner gradient overlay (was ::before on wall) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: WALL_SIZE + 6,
          height: WALL_SIZE + 6,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(168, 85, 247, 0.1) 100%)',
          pointerEvents: 'none',
          zIndex: 11,
          borderRadius: 2,
        }} />
      </div>
    </>
  );
}
