'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-5">
      <div className="w-full max-w-[420px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl px-8 py-10 backdrop-blur-xl">
        <h1 className="text-3xl font-extrabold text-white text-center uppercase tracking-wide mb-1">
          Create Account
        </h1>
        <p className="text-center text-white/50 text-sm mb-7">
          Join the aim trainer
        </p>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg text-sm mb-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              className="px-3.5 py-3 rounded-lg border-2 border-white/12 bg-white/5 text-white text-[0.95rem] outline-none transition-colors duration-200 focus:border-[#ff8c00] placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="px-3.5 py-3 rounded-lg border-2 border-white/12 bg-white/5 text-white text-[0.95rem] outline-none transition-colors duration-200 focus:border-[#ff8c00] placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="px-3.5 py-3 rounded-lg border-2 border-white/12 bg-white/5 text-white text-[0.95rem] outline-none transition-colors duration-200 focus:border-[#ff8c00] placeholder:text-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 rounded-xl border-none bg-gradient-to-br from-[#ff8c00] to-[#ff7700] text-white text-base font-bold uppercase tracking-widest cursor-pointer transition-all duration-250 shadow-[0_4px_20px_rgba(255,140,0,0.3)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_28px_rgba(255,140,0,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-5 text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-[#ff8c00] font-semibold no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
