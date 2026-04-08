"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
            <ShieldAlert className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Enter the system password to access the dashboard.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Admin Password"
                required
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-indigo-500/20 shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
