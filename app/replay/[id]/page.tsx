'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReplayViewer from '@/components/ReplayViewer';
import { ReplayRecording } from '@/engine/types';

const MODE_LABELS: Record<string, string> = {
  flick: 'Flick',
  tracking: 'Tracking',
  'micro-adjustment': 'Micro Adj',
  'pasu-track': 'Pasu Track',
};

interface ReplayMeta {
  id: string;
  username: string;
  mode: string;
  difficulty: string;
  score: number;
  blobUrl: string;
  createdAt: string;
}

export default function SharedReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [meta, setMeta] = useState<ReplayMeta | null>(null);
  const [recording, setRecording] = useState<ReplayRecording | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch replay metadata
        const metaRes = await fetch(`/api/replays/${id}`);
        if (!metaRes.ok) { setError('Replay not found'); return; }
        const metaData = await metaRes.json();
        setMeta(metaData);

        // Fetch actual recording from Vercel Blob
        const blobRes = await fetch(metaData.blobUrl);
        if (!blobRes.ok) { setError('Failed to load replay data'); return; }
        const rec = await blobRes.json();
        setRecording(rec);
      } catch {
        setError('Failed to load replay');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[#ff8c00]/30 border-t-[#ff8c00] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !recording || !meta) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <p className="text-white/50">{error || 'Replay not found'}</p>
        <Link href="/" className="text-sm text-[#ff8c00] hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      {/* Info bar */}
      <div className="shrink-0 px-6 py-3 border-b border-white/[0.08] bg-black/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Replay</span>
          <span className="text-sm text-white font-bold">{meta.username}</span>
          <span className="text-xs text-white/30">
            {MODE_LABELS[meta.mode] || meta.mode} &middot; {meta.difficulty} &middot; Score: <strong className="text-[#ff8c00]">{meta.score}</strong>
          </span>
        </div>
        <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">
          Home
        </Link>
      </div>

      {/* Viewer fills remaining space */}
      <div className="flex-1 relative">
        <ReplayViewer recording={recording} onClose={() => window.history.back()} />
      </div>
    </div>
  );
}
