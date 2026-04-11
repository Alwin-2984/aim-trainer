'use client';

import { useRef, useCallback } from 'react';
import { ReplayRecording } from '@/engine/types';

export function useReplayRecording() {
  const recordingRef = useRef<ReplayRecording | null>(null);

  const createRecording = useCallback((modeId: string): ReplayRecording => {
    const rec: ReplayRecording = {
      duration: 0,
      frameCount: 0,
      modeId,
      frames: [],
    };
    recordingRef.current = rec;
    return rec;
  }, []);

  const clearRecording = useCallback(() => {
    recordingRef.current = null;
  }, []);

  return {
    recording: recordingRef.current,
    recordingRef,
    createRecording,
    clearRecording,
  };
}
