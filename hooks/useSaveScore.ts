'use client';

import { useRef, useCallback, useState } from 'react';

interface SaveScoreParams {
  mode: string;
  difficulty: string;
  score: number;
  totalShots: number;
  accuracy: string | null;
}

export function useSaveScore() {
  const savedRef = useRef(false);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const saveScore = useCallback(async (params: SaveScoreParams) => {
    if (savedRef.current) return;
    if (params.score === 0) return;

    savedRef.current = true;

    // Check if this is a new personal best
    if (personalBest !== null && params.score > personalBest) {
      setIsNewBest(true);
      setPersonalBest(params.score);
    } else if (personalBest === null) {
      setPersonalBest(params.score);
      setIsNewBest(true);
    }

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }, [personalBest]);

  const fetchBest = useCallback(async (mode: string, difficulty: string) => {
    try {
      const res = await fetch(`/api/scores/best?mode=${mode}&difficulty=${difficulty}`);
      if (res.ok) {
        const data = await res.json();
        setPersonalBest(data.bestScore ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  const resetSaved = useCallback(() => {
    savedRef.current = false;
    setIsNewBest(false);
  }, []);

  return { saveScore, resetSaved, fetchBest, personalBest, isNewBest };
}
