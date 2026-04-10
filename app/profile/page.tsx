'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScoreChart from '@/components/ScoreChart';

interface BreakdownEntry {
  mode: string;
  difficulty: string;
  bestScore: number;
  avgScore: number;
  totalGames: number;
  bestAccuracy: string | null;
  lastPlayed: string;
}

interface ScorePoint {
  score: number;
  accuracy: string | null;
  createdAt: string;
}

interface HistoryEntry {
  mode: string;
  difficulty: string;
  scores: ScorePoint[];
}

interface RecentGame {
  mode: string;
  difficulty: string;
  score: number;
  accuracy: string | null;
  createdAt: string;
}

interface StatsData {
  username: string;
  overall: { totalGames: number; totalScore: number; firstGame: string | null };
  breakdown: BreakdownEntry[];
  history: HistoryEntry[];
  recentGames: RecentGame[];
}

const MODE_LABELS: Record<string, string> = {
  flick: 'Flick',
  tracking: 'Tracking',
  'micro-adjustment': 'Micro Adj',
};

const MODE_COLORS: Record<string, string> = {
  flick: '#ff3e3e',
  tracking: '#00d2ff',
  'micro-adjustment': '#a855f7',
};

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Build a lookup for history by mode|difficulty
  const historyLookup: Record<string, HistoryEntry> = {};
  for (const h of stats.history) {
    historyLookup[`${h.mode}|${h.difficulty}`] = h;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-wide">
              {stats.username}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {stats.overall.totalGames} games played
              {stats.overall.firstGame && (
                <> &middot; training since {new Date(stats.overall.firstGame).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-white/50 border border-white/15 px-4 py-2 rounded-lg hover:text-white hover:border-white/30 transition-colors"
          >
            Back to Menu
          </Link>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-center">
            <p className="text-3xl font-extrabold text-[#ff8c00]">{stats.overall.totalGames}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Total Games</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-center">
            <p className="text-3xl font-extrabold text-[#ff8c00]">{stats.overall.totalScore}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Total Score</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-center">
            <p className="text-3xl font-extrabold text-[#ff8c00]">
              {stats.breakdown.length > 0
                ? Math.max(...stats.breakdown.map((b) => b.bestScore))
                : 0}
            </p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">All-Time Best</p>
          </div>
        </div>

        {/* Progress Charts — one per mode+difficulty combo */}
        <h2 className="text-lg font-bold uppercase tracking-wider text-white/70 mb-4">
          Score Progress
        </h2>

        {stats.breakdown.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center text-white/30 mb-10">
            No games played yet. Start training to see your progress graphs!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
            {stats.breakdown.map((b) => {
              const key = `${b.mode}|${b.difficulty}`;
              const history = historyLookup[key];
              const color = MODE_COLORS[b.mode] || '#ff8c00';

              return (
                <div
                  key={key}
                  className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-white/15 transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-bold text-white uppercase">
                        {MODE_LABELS[b.mode] || b.mode}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                        {b.difficulty}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">{b.totalGames} games</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-6 mb-3 text-xs text-white/40">
                    <span>Best: <strong className="text-[#ff8c00]">{b.bestScore}</strong></span>
                    <span>Avg: <strong className="text-white/70">{b.avgScore}</strong></span>
                    {b.bestAccuracy && (
                      <span>Acc: <strong className="text-white/70">{b.bestAccuracy}%</strong></span>
                    )}
                  </div>

                  {/* Chart */}
                  <ScoreChart
                    data={history?.scores ?? []}
                    bestScore={b.bestScore}
                    accentColor={color}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Games */}
        <h2 className="text-lg font-bold uppercase tracking-wider text-white/70 mb-4">
          Recent Games
        </h2>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden mb-10">
          <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-white/5 text-xs font-semibold text-white/40 uppercase tracking-widest">
            <div>Mode</div>
            <div>Difficulty</div>
            <div className="text-right">Score</div>
            <div className="text-right">Accuracy</div>
            <div className="text-right">When</div>
          </div>

          {stats.recentGames.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/30">No games yet</div>
          ) : (
            stats.recentGames.map((g, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 px-6 py-3 border-t border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="text-sm text-white/80 font-semibold">
                  {MODE_LABELS[g.mode] || g.mode}
                </div>
                <div className="text-sm text-white/50 capitalize">{g.difficulty}</div>
                <div className="text-right text-sm font-bold text-white tabular-nums">{g.score}</div>
                <div className="text-right text-sm text-white/50 tabular-nums">
                  {g.accuracy ? `${g.accuracy}%` : '—'}
                </div>
                <div className="text-right text-xs text-white/40">
                  {timeAgo(g.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
