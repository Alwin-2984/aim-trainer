'use client';

import { useState, useCallback } from 'react';
import { ReplayRecording } from '@/engine/types';

export function useSaveReplay() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [replayId, setReplayId] = useState<string | null>(null);

  const saveReplay = useCallback(async (params: {
    recording: ReplayRecording;
    mode: string;
    difficulty: string;
    score: number;
  }) => {
    if (saving || saved) return;
    setSaving(true);

    try {
      const res = await fetch('/api/replays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recording: params.recording,
          mode: params.mode,
          difficulty: params.difficulty,
          score: params.score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplayId(data.id);
        setSaved(true);
      }
    } catch (err) {
      console.error('Failed to save replay:', err);
    } finally {
      setSaving(false);
    }
  }, [saving, saved]);

  const resetReplaySave = useCallback(() => {
    setSaved(false);
    setSaving(false);
    setReplayId(null);
  }, []);

  return { saveReplay, resetReplaySave, saving, saved, replayId };
}
