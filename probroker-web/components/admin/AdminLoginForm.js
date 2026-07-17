'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientFetch } from '@/lib/api';

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await clientFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Invalid username or password');
        setLoading(false);
        return;
      }
      const next = searchParams.get('next') || '/admin';
      router.push(next);
      router.refresh();
    } catch (err) {
      setError('Network error: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 bg-gradient-to-br from-[#1E0A3C] via-[#2D0B59] to-[#4D3C9A] text-white flex flex-col items-center justify-center p-10">
        <h1 className="text-3xl font-extrabold mb-1">PRObroker Admin</h1>
        <p className="text-white/70">Manage your property platform</p>
        <div className="mt-10 flex flex-col gap-4 text-sm text-white/80">
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Manage property listings</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Approve owner submissions</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Bulk import via JSON/CSV</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Track inquiries & leads</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-10 bg-white">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-7">Sign in to your admin account</p>

          {error && (
            <div className="bg-red-100 text-red-800 px-3.5 py-2.5 rounded-lg text-sm font-medium mb-4">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
          <div className="text-center text-xs text-gray-400 mt-7">PRObroker Admin Panel v1.0</div>
        </form>
      </div>
    </div>
  );
}
