'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import ModeSelector from '@/components/ModeSelector';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div id="overlay" style={{ opacity: 1, visibility: 'visible' }}>
      <div className="hero-content">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-white/50 text-sm">
            Welcome, <strong className="text-[#ff8c00]">{session.user?.name}</strong>
          </span>
          <Link
            href="/profile"
            className="bg-white/[0.08] border border-white/15 text-white/60 px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wide font-semibold hover:bg-[#ff8c00]/15 hover:text-[#ff8c00] hover:border-[#ff8c00]/30 transition-colors"
          >
            My Progress
          </Link>
          <Link
            href="/rankings"
            className="bg-white/[0.08] border border-white/15 text-white/60 px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wide font-semibold hover:bg-[#ff8c00]/15 hover:text-[#ff8c00] hover:border-[#ff8c00]/30 transition-colors"
          >
            Rankings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-white/[0.08] border border-white/15 text-white/60 px-3.5 py-1.5 rounded-md text-xs cursor-pointer uppercase tracking-wide font-semibold hover:bg-white/15 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
        <h1 className="hero-title">train your skills here</h1>
        <ModeSelector />
      </div>
    </div>
  );
}
