'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Settings, GameState, TrackingTarget, GameMode } from '@/types/game';
import Crosshair from './Crosshair';
import GameUI from './GameUI';
import Overlay from './Overlay';
import SettingsModal from './SettingsModal';

const M_YAW = 0.022;
const CS_FOV_HORZ = 106.26;

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
  const wallRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(null);
  const isInitialMount = useRef(true);
  const lastUnlockTime = useRef<number>(0);
  const lockRequestPending = useRef(false);

  // Calculate pixels per degree
  const updatePixelsPerDegree = useCallback(() => {
    setPixelsPerDegree(window.innerWidth / CS_FOV_HORZ);
  }, []);

  useEffect(() => {
    updatePixelsPerDegree();
    window.addEventListener('resize', updatePixelsPerDegree);
    return () => window.removeEventListener('resize', updatePixelsPerDegree);
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

  // Game tick for tracking mode
  const gameTick = useCallback(() => {
    if (!gameState.isLocked || settings.mode !== 'tracking') return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    gameState.activeTargets.forEach((t) => {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x <= 12 || t.x >= 588) t.vx *= -1;
      if (t.y <= 12 || t.y >= 588) t.vy *= -1;

      t.el.style.left = `${t.x}px`;
      t.el.style.top = `${t.y}px`;

      const rect = t.el.getBoundingClientRect();

      if (
        gameState.isFiring &&
        centerX >= rect.left &&
        centerX <= rect.right &&
        centerY >= rect.top &&
        centerY <= rect.bottom
      ) {
        setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
        t.el.classList.add('hit');
      } else {
        t.el.classList.remove('hit');
      }
    });

    animationFrameRef.current = requestAnimationFrame(gameTick);
  }, [gameState.isLocked, gameState.isFiring, gameState.activeTargets, settings.mode]);

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

  // Create flick target
  const createTargetFlick = useCallback(() => {
    if (!wallRef.current) return;

    const t = document.createElement('div');
    t.className = 'target';
    const x = Math.random() * 560 + 20;
    const y = Math.random() * 560 + 20;
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    wallRef.current.appendChild(t);
  }, []);

  // Create tracking target
  const createTargetTracking = useCallback(() => {
    console.log('[TARGET] createTargetTracking called');
    if (!wallRef.current) return;
    
    // Safety check: don't create if tracking targets already exist
    const existingTracking = wallRef.current.querySelectorAll('.target.tracking');
    if (existingTracking.length > 0) {
      console.warn('[TARGET] Tracking target already exists, skipping creation');
      return;
    }

    console.log('[TARGET] Creating new tracking target');
    const t = document.createElement('div');
    t.className = 'target tracking';

    const x = Math.random() * 500 + 50;
    const y = Math.random() * 500 + 50;

    let vx = (Math.random() - 0.5) * 6;
    let vy = (Math.random() - 0.5) * 6;
    if (Math.abs(vx) < 1) vx = 2;

    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    wallRef.current.appendChild(t);

    setGameState((prev) => ({
      ...prev,
      activeTargets: [...prev.activeTargets, { el: t, x, y, vx, vy }],
    }));
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    console.log('[RESET] resetGame called, mode:', settings.mode);
    
    // Clear wall and active targets first
    if (wallRef.current) {
      wallRef.current.innerHTML = '';
    }

    // Reset state synchronously
    setGameState((prev) => ({
      ...prev,
      score: 0,
      totalShots: 0,
      timeLeft: 60,
      activeTargets: [],
    }));

    setShowAIBtn(false);
    setAiFeedback('');

    // Initialize targets with a slight delay to ensure state is cleared
    setTimeout(() => {
      if (settings.mode === 'flick') {
        console.log('[RESET] Spawning 5 flick targets');
        for (let i = 0; i < 5; i++) {
          setTimeout(() => createTargetFlick(), i * 10);
        }
      } else {
        console.log('[RESET] Spawning 1 tracking target');
        // Only spawn one tracking target
        createTargetTracking();
      }
    }, 50);
  }, [settings.mode, createTargetFlick, createTargetTracking]);

  // Start timer
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

  // Stop timer
  const stopTimer = useCallback(() => {
    if (gameState.gameInterval) {
      clearInterval(gameState.gameInterval);
      setGameState((prev) => ({ ...prev, gameInterval: null }));
    }
  }, [gameState.gameInterval]);

  // Update overlay text
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

  // Get accuracy
  const getAccuracy = useCallback(() => {
    if (gameState.totalShots === 0) return '100';
    return ((gameState.score / gameState.totalShots) * 100).toFixed(1);
  }, [gameState.score, gameState.totalShots]);

  // Check hit for flick mode
  const checkHitFlick = useCallback(() => {
    if (!wallRef.current) return;

    const targets = wallRef.current.querySelectorAll('.target:not(.tracking)');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    targets.forEach((t) => {
      const rect = t.getBoundingClientRect();
      if (
        centerX >= rect.left &&
        centerX <= rect.right &&
        centerY >= rect.top &&
        centerY <= rect.bottom
      ) {
        setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
        t.remove();
        setFlashOpacity(0.15);
        setTimeout(() => setFlashOpacity(0), 50);
        createTargetFlick();
      }
    });
  }, [createTargetFlick]);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameState.isLocked || !worldRef.current) return;

      const degX = e.movementX * sensitivity * M_YAW;
      const degY = e.movementY * sensitivity * M_YAW;
      const pixelMoveX = degX * pixelsPerDegree;
      const pixelMoveY = degY * pixelsPerDegree;

      setGameState((prev) => {
        const newPosX = Math.max(-2500, Math.min(2500, prev.posX - pixelMoveX));
        const newPosY = Math.max(-2500, Math.min(2500, prev.posY - pixelMoveY));

        if (worldRef.current) {
          worldRef.current.style.transform = `translate(calc(-50% + ${newPosX}px), calc(-50% + ${newPosY}px))`;
        }

        return { ...prev, posX: newPosX, posY: newPosY };
      });
    },
    [gameState.isLocked, sensitivity, pixelsPerDegree]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(() => {
    if (!gameState.isLocked) return;

    setGameState((prev) => ({ ...prev, isFiring: true }));

    if (crosshairRef.current) {
      crosshairRef.current.classList.remove('recoil');
      void crosshairRef.current.offsetWidth;
      crosshairRef.current.classList.add('recoil');
    }

    if (gameState.timeLeft > 0 && settings.mode === 'flick') {
      setGameState((prev) => ({ ...prev, totalShots: prev.totalShots + 1 }));
      checkHitFlick();
    }
  }, [gameState.isLocked, gameState.timeLeft, settings.mode, checkHitFlick]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setGameState((prev) => ({ ...prev, isFiring: false }));
  }, []);

  // Handle pointer lock change
  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement === document.body) {
        console.log('[POINTER LOCK] Locked successfully');
        lockRequestPending.current = false;
        setOverlayVisible(false);
        setGameState((prev) => ({ ...prev, isLocked: true }));
        startTimer();
      } else {
        console.log('[POINTER LOCK] Unlocked');
        lockRequestPending.current = false;
        lastUnlockTime.current = Date.now(); // Track when we unlocked
        setOverlayVisible(true);
        setGameState((prev) => ({ ...prev, isLocked: false }));
        stopTimer();
        updateOverlayText();
      }
    };

    const handlePointerLockError = () => {
      console.warn('[POINTER LOCK] Error - user may have exited lock too quickly');
      lockRequestPending.current = false;
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [startTimer, stopTimer, updateOverlayText]);

  // Mouse events
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

  // Initialize game after settings are loaded
  useEffect(() => {
    console.log('[EFFECT] Init effect, settingsLoaded:', settingsLoaded, 'isInitialMount:', isInitialMount.current);
    if (settingsLoaded && isInitialMount.current) {
      console.log('[EFFECT] Running initial resetGame');
      resetGame();
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

  // Reset game when mode changes (after initial mount)
  useEffect(() => {
    console.log('[EFFECT] Mode change effect, mode:', settings.mode, 'isInitialMount:', isInitialMount.current);
    if (!isInitialMount.current && settingsLoaded) {
      console.log('[EFFECT] Running mode change resetGame');
      resetGame();
      
      // Reset overlay to initial state
      setOverlayTitle('train your skills here');
      setOverlayDesc('');
      setStartBtnText('Lock Mouse & Play');
      setShowRestartBtn(false);
      setShowAIBtn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, settingsLoaded]);

  // Handle start button with proper cooldown
  const handleStart = () => {
    // Don't try to lock if already locked or if a request is pending
    if (document.pointerLockElement === document.body) {
      console.log('[START] Already locked, skipping');
      return;
    }
    
    if (lockRequestPending.current) {
      console.log('[START] Lock request already pending, skipping');
      return;
    }
    
    if (gameState.timeLeft <= 0) {
      resetGame();
    }
    
    // Calculate time since last unlock
    const timeSinceUnlock = Date.now() - lastUnlockTime.current;
    const minCooldown = 300; // Minimum 300ms cooldown after unlock
    
    const requestLock = () => {
      if (document.pointerLockElement !== document.body && !lockRequestPending.current) {
        console.log('[START] Requesting pointer lock');
        lockRequestPending.current = true;
        
        document.body.requestPointerLock().catch((error) => {
          console.warn('[POINTER LOCK] Request failed:', error.message);
          lockRequestPending.current = false;
          
          // If failed due to timing, retry after cooldown
          if (error.message.includes('exited the lock')) {
            console.log('[START] Retrying after extended cooldown');
            setTimeout(() => {
              if (document.pointerLockElement !== document.body && !lockRequestPending.current) {
                lockRequestPending.current = true;
                document.body.requestPointerLock().catch((retryError) => {
                  console.error('[POINTER LOCK] Retry failed:', retryError.message);
                  lockRequestPending.current = false;
                });
              }
            }, 500);
          }
        });
      }
    };
    
    // If recently unlocked, wait for cooldown
    if (timeSinceUnlock < minCooldown) {
      const remainingCooldown = minCooldown - timeSinceUnlock;
      console.log(`[START] Waiting ${remainingCooldown}ms for cooldown`);
      setTimeout(requestLock, remainingCooldown);
    } else {
      // Cooldown passed, request immediately (with small delay for UI)
      setTimeout(requestLock, 50);
    }
  };

  // Handle restart button
  const handleRestart = useCallback((e?: React.MouseEvent) => {
    console.log('[RESTART] Button clicked, isRestarting:', isRestarting);
    
    // Prevent double-clicks
    if (isRestarting) {
      console.log('[RESTART] Already restarting, ignoring');
      return;
    }
    
    // Prevent any event bubbling or default actions
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsRestarting(true);
    
    // First, ensure we're unlocked and overlay is visible
    if (document.pointerLockElement === document.body) {
      console.log('[RESTART] Exiting pointer lock first');
      document.exitPointerLock();
    }
    
    // Force overlay to be visible immediately
    setOverlayVisible(true);
    
    // Reset game state after a small delay to ensure DOM is ready
    setTimeout(() => {
      resetGame();
      
      // Update overlay text after reset completes
      setTimeout(() => {
        updateOverlayText();
        setIsRestarting(false);
      }, 50);
    }, 50);
  }, [isRestarting, resetGame, updateOverlayText]);

  // Handle AI analysis
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
      const apiKey = ''; // Add your API key here
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

  // Handle setting change
  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Handle mode selection
  const handleModeSelect = (mode: GameMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    console.log('[MENU] Back to menu clicked');
    
    // Exit pointer lock if active
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }
    
    // Reset to initial state
    resetGame();
    
    // Update overlay to show initial screen
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

      <div id="hit-flash" style={{ opacity: flashOpacity }}></div>

      <Crosshair className={gameState.isFiring ? 'recoil' : ''} />

      <div id="world" ref={worldRef}>
        <svg id="room-lines" viewBox="0 0 6000 6000" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="2700" y2="2700" />
          <line x1="6000" y1="0" x2="3300" y2="2700" />
          <line x1="6000" y1="6000" x2="3300" y2="3300" />
          <line x1="0" y1="6000" x2="2700" y2="3300" />
        </svg>

        <div id="wall" ref={wallRef}></div>
      </div>
    </>
  );
}
