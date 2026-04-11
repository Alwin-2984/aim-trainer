'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Share2, Trash2 } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
  flick: 'Flick',
  tracking: 'Tracking',
  'micro-adjustment': 'Micro Adj',
  'pasu-track': 'Pasu Track',
};

const MODE_COLORS: Record<string, string> = {
  flick: 'bg-red-500/15 text-red-400 border-red-500/20',
  tracking: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'micro-adjustment': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'pasu-track': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

interface Replay {
  id: string;
  mode: string;
  difficulty: string;
  score: number;
  frameCount: number;
  duration: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${s}s`;
}

export default function ReplaysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/replays')
      .then((r) => r.json())
      .then(setReplays)
      .catch(() => setReplays([]))
      .finally(() => setLoading(false));
  }, [status]);

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/replay/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteReplay = async (id: string) => {
    try {
      await fetch(`/api/replays/${id}`, { method: 'DELETE' });
      setReplays((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[#ff8c00]/30 border-t-[#ff8c00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">My Replays</h1>
          <Link
            href="/"
            className="text-sm text-white/50 border border-white/15 px-4 py-2 rounded-lg hover:text-white hover:border-white/30 transition-colors"
          >
            Back to Menu
          </Link>
        </div>

        {replays.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-12 text-center">
            <p className="text-white/30 mb-2">No saved replays yet</p>
            <p className="text-white/20 text-sm">Play a game and click "Save Replay" after it ends</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replays.map((r) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/15 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  {/* Left — info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mode badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shrink-0 ${MODE_COLORS[r.mode] || 'bg-white/10 text-white/50 border-white/10'}`}>
                      {MODE_LABELS[r.mode] || r.mode}
                    </span>

                    {/* Difficulty */}
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 shrink-0">
                      {r.difficulty}
                    </span>

                    {/* Score */}
                    <span className="text-sm font-bold text-[#ff8c00] tabular-nums shrink-0">
                      {r.score}
                    </span>

                    {/* Duration */}
                    <span className="text-xs text-white/25 tabular-nums shrink-0">
                      {formatDuration(r.duration)}
                    </span>

                    {/* Frames */}
                    <span className="text-xs text-white/15 tabular-nums hidden sm:block">
                      {r.frameCount} frames
                    </span>
                  </div>

                  {/* Right — actions + time */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-white/20 hidden sm:block">
                      {timeAgo(r.createdAt)}
                    </span>

                    {/* Watch */}
                    <Link
                      href={`/replay/${r.id}`}
                      className="p-2 rounded-lg text-white/30 hover:text-[#ff8c00] hover:bg-[#ff8c00]/10 transition-colors"
                      title="Watch replay"
                    >
                      <Play className="w-4 h-4" />
                    </Link>

                    {/* Share */}
                    <button
                      onClick={() => copyShareLink(r.id)}
                      className="p-2 rounded-lg text-white/30 hover:text-[#ff8c00] hover:bg-[#ff8c00]/10 transition-colors cursor-pointer"
                      title="Copy share link"
                    >
                      {copiedId === r.id ? (
                        <span className="text-[10px] text-green-400 font-bold">Copied!</span>
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteReplay(r.id)}
                      className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete replay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
