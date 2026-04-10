'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Difficulty = 'easy' | 'medium' | 'hard';

interface RankEntry {
  rank: number;
  username: string;
  bestScore: number;
  bestAccuracy: number | null;
  totalGames: number;
}

const MODES = [
  { id: 'flick', label: 'Flick' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'micro-adjustment', label: 'Micro Adj' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function RankingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState('flick');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?mode=${mode}&difficulty=${difficulty}`);
        const data = await res.json();
        setRankings(data);
      } catch {
        setRankings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, [mode, difficulty]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  const isFlick = mode === 'flick';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">
            Rankings
          </h1>
          <Link
            href="/"
            className="text-sm text-white/50 border border-white/15 px-4 py-2 rounded-lg hover:text-white hover:border-white/30 transition-colors"
          >
            Back to Menu
          </Link>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                mode === m.id
                  ? 'bg-[#ff8c00] text-white shadow-[0_0_20px_rgba(255,140,0,0.35)]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Difficulty Tabs */}
        <div className="flex gap-2 mb-8">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                difficulty === d.value
                  ? 'bg-white/15 text-white border border-white/25'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/70'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          {/* Header Row */}
          <div className={`grid ${isFlick ? 'grid-cols-5' : 'grid-cols-4'} gap-4 px-6 py-3 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-widest`}>
            <div>Rank</div>
            <div>Player</div>
            <div className="text-right">Best Score</div>
            {isFlick && <div className="text-right">Accuracy</div>}
            <div className="text-right">Games</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="px-6 py-12 text-center text-white/30">Loading rankings...</div>
          ) : rankings.length === 0 ? (
            <div className="px-6 py-12 text-center text-white/30">
              No scores yet. Be the first!
            </div>
          ) : (
            rankings.map((entry) => {
              const isMe = entry.username === session?.user?.name;
              return (
                <div
                  key={entry.rank}
                  className={`grid ${isFlick ? 'grid-cols-5' : 'grid-cols-4'} gap-4 px-6 py-3.5 border-t border-white/5 transition-colors ${
                    isMe ? 'bg-[#ff8c00]/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">
                        {entry.rank === 1 ? '\u{1F947}' : entry.rank === 2 ? '\u{1F948}' : '\u{1F949}'}
                      </span>
                    ) : (
                      <span className="text-white/40 font-mono text-sm w-6 text-center">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <div className={`font-semibold ${isMe ? 'text-[#ff8c00]' : 'text-white/90'}`}>
                    {entry.username}
                    {isMe && <span className="text-[10px] ml-1.5 text-[#ff8c00]/70 uppercase">(you)</span>}
                  </div>
                  <div className="text-right font-bold text-white tabular-nums">
                    {entry.bestScore}
                  </div>
                  {isFlick && (
                    <div className="text-right text-white/60 tabular-nums">
                      {entry.bestAccuracy != null ? `${entry.bestAccuracy}%` : '—'}
                    </div>
                  )}
                  <div className="text-right text-white/40 tabular-nums">
                    {entry.totalGames}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
