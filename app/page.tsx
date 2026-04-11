'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ModeSelector from '@/components/ModeSelector';
import SettingsModal from '@/components/SettingsModal';
import { useSettings } from '@/hooks/useSettings';
import { Trophy, TrendingUp, LogOut, Crosshair, Flame, Target, Percent, Settings, Film } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  bestAccuracy: string | null;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, sensitivity, setSensitivity, handleSettingChange } = useSettings();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        const best = data.breakdown?.length > 0
          ? Math.max(...data.breakdown.map((b: any) => b.bestScore))
          : 0;
        const bestAcc = data.breakdown?.find((b: any) => b.bestAccuracy)?.bestAccuracy ?? null;
        setStats({
          totalGames: data.overall?.totalGames ?? 0,
          totalScore: data.overall?.totalScore ?? 0,
          bestScore: best,
          bestAccuracy: bestAcc,
        });
      })
      .catch(() => setStats({ totalGames: 0, totalScore: 0, bestScore: 0, bestAccuracy: null }));
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[#ff8c00]/30 border-t-[#ff8c00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const initial = (session.user?.name?.[0] ?? '?').toUpperCase();

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] flex flex-col">
      {/* ═══ Background Effects ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,140,0,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,140,0,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
      </div>

      {/* ═══ Settings Modal ═══ */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingChange={handleSettingChange}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />

      {/* ═══ Top Bar ═══ */}
      <header className="relative z-20 flex items-center justify-between px-5 lg:px-8 py-3 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#ff8c00]/15 border border-[#ff8c00]/30 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-[#ff8c00]" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black uppercase tracking-widest text-white">
              <span className="text-[#ff8c00]">AIM</span> TRAINER
            </span>
            <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] -mt-0.5">Precision Drills</p>
          </div>
        </div>

        {/* Profile + Nav */}
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group">
            <TrendingUp className="w-4 h-4 text-white/40 group-hover:text-[#ff8c00] transition-colors" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider hidden md:block group-hover:text-white/80 transition-colors">Progress</span>
          </Link>
          <Link href="/rankings" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group">
            <Trophy className="w-4 h-4 text-white/40 group-hover:text-[#ff8c00] transition-colors" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider hidden md:block group-hover:text-white/80 transition-colors">Rankings</span>
          </Link>
          <Link href="/replays" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group">
            <Film className="w-4 h-4 text-white/40 group-hover:text-[#ff8c00] transition-colors" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider hidden md:block group-hover:text-white/80 transition-colors">Replays</span>
          </Link>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white/40 group-hover:text-[#ff8c00] transition-colors" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider hidden md:block group-hover:text-white/80 transition-colors">Settings</span>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff8c00] to-[#ff6600] flex items-center justify-center text-white text-xs font-black shadow-[0_0_12px_rgba(255,140,0,0.4)]">
              {initial}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{session.user?.name}</p>
              <p className="text-[9px] text-white/30 mt-0.5">{stats?.totalGames ?? 0} games played</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero */}
        <section className="text-center px-5 pt-10 pb-6 lg:pt-14 lg:pb-8">
          <h1
            className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent leading-none"
            style={{ animation: 'titleGlow 3s ease-in-out infinite' }}
          >
            TRAIN YOUR <span className="text-[#ff8c00]" style={{ WebkitTextFillColor: '#ff8c00' }}>AIM</span>
          </h1>
          <p className="mt-3 text-white/40 text-sm sm:text-base max-w-md mx-auto">
            Precision drills for FPS players. Flick, track, adjust, react.
          </p>
        </section>

        {/* Stats Bar */}
        <section className="px-5 pb-6 lg:pb-8">
          <div className="max-w-2xl mx-auto flex justify-center gap-3 sm:gap-5">
            <StatBox icon={Target} value={stats?.totalGames} label="Games" loading={!stats} />
            <StatBox icon={Flame} value={stats?.bestScore} label="Best" loading={!stats} />
            <StatBox icon={Crosshair} value={stats?.totalScore} label="Total" loading={!stats} />
            <StatBox icon={Percent} value={stats?.bestAccuracy ? `${stats.bestAccuracy}%` : 'N/A'} label="Accuracy" loading={!stats} />
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3 px-5 max-w-6xl mx-auto w-full mb-6 lg:mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff8c00]/25 to-transparent" />
          <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/30">
            Select Training Mode
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff8c00]/25 to-transparent" />
        </div>

        {/* Mode Cards */}
        <section className="px-5 max-w-6xl mx-auto w-full pb-8 flex-1">
          <ModeSelector />
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.04] py-4 text-center shrink-0">
          <p className="text-[10px] text-white/15 uppercase tracking-[0.2em]">
            Aim Trainer — built for precision
          </p>
        </footer>
      </main>
    </div>
  );
}

function StatBox({
  icon: Icon,
  value,
  label,
  loading,
}: {
  icon: LucideIcon;
  value: string | number | null | undefined;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-4 sm:px-6 py-3 bg-white/[0.03] border border-white/[0.07] rounded-xl min-w-[80px] sm:min-w-[110px]">
      <Icon className="w-3.5 h-3.5 text-[#ff8c00]/60 mb-1.5" />
      {loading ? (
        <div className="h-6 w-10 bg-white/10 rounded animate-pulse" />
      ) : (
        <span className="text-lg sm:text-xl font-extrabold text-[#ff8c00] tabular-nums leading-none">
          {value ?? 0}
        </span>
      )}
      <span className="text-[9px] sm:text-[10px] text-white/30 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}
