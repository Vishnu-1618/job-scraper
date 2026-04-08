"use client";

import { useState } from 'react';
import { Play, Square, Loader2, Sparkles, AlertTriangle, RefreshCw, Database, Settings } from 'lucide-react';

export default function ScraperControls({ onActionComplete }: { onActionComplete: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [platform, setPlatform] = useState('linkedin');

  const handleAction = async (action: string, endpoint: string, payload?: any) => {
    if (action === 'reset' && !confirm('Are you absolutely sure you want to delete ALL jobs? This cannot be undone.')) return;

    setLoading(action);
    try {
      if (action === 'scrape' && payload?.platform === 'all_platforms') {
        const platforms = ['linkedin', 'indeed', 'glassdoor', 'naukri'];
        const promises = platforms.map(p =>
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, platform: p }),
          }).then(r => r.json().catch(() => ({})))
        );

        await Promise.all(promises);
        alert('Scraping started across all 4 platforms. This may take a few minutes.');
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || { action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        alert(data.message || 'Action completed successfully');
      }
      onActionComplete();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl overflow-hidden group ring-1 ring-indigo-500/10 hover:border-indigo-400/40 transition-all duration-700">
      {/* Abstract Top Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Background Glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 tracking-tight relative z-10 drop-shadow-sm">
        <div className="w-10 h-10 rounded-[1.2rem] bg-slate-800 border border-indigo-500/20 flex items-center justify-center shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        Settings & Controls
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

        {/* Scraping Operations */}
        <div className="bg-slate-800/50 backdrop-blur-3xl p-6 rounded-[1.5rem] border border-indigo-500/10 shadow-inner flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                Run Manual Scrape
              </h3>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Platform</label>
              <div className="relative">
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-slate-900/50 border border-indigo-500/10 text-white text-sm font-bold rounded-[1.2rem] focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 p-3.5 appearance-none outline-none transition-all shadow-inner"
                >
                  <option value="all_platforms">All Platforms</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="naukri">Naukri</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-white/10 pl-3">
                  <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
              <button
              onClick={() => handleAction('scrape', '/api/scrape', { platform })}
              disabled={!!loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white text-sm font-black py-3.5 px-4 rounded-[1.2rem] transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              {loading === 'scrape' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-white text-white" />}
              Start Scraping
            </button>
            <button
              disabled={true}
              className="bg-slate-900/40 border border-indigo-500/5 text-slate-600 text-sm font-black py-3.5 px-4 rounded-[1.2rem] transition-colors flex justify-center items-center gap-2 cursor-not-allowed hidden xl:flex shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
              title="Stopping requires BullMQ worker integration"
            >
              <Square className="w-4 h-4 fill-slate-700 text-slate-700" />
              Stop
            </button>
          </div>
        </div>

        {/* Database Maintenance Block */}
        <div className="bg-slate-800/50 backdrop-blur-3xl p-6 rounded-[1.5rem] border border-indigo-500/10 shadow-inner flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div className="mb-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Database className="w-4 h-4 text-slate-400" />
              Data Integrity
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleAction('clean_old', '/api/admin/clean')}
                disabled={!!loading}
                className="w-full bg-slate-900/30 border border-indigo-500/10 hover:border-indigo-500/30 text-slate-300 text-sm font-bold py-3.5 px-5 rounded-[1.2rem] transition-all flex justify-between items-center group disabled:opacity-50 hover:bg-slate-800/50 active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                  Remove Jobs Older Than 30 Days
                </div>
                <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest border border-indigo-500/20 px-2 py-1 rounded-[8px] bg-indigo-500/10">Auto</span>
              </button>

              <button
                onClick={() => handleAction('remove_dupes', '/api/admin/clean')}
                disabled={!!loading}
                className="w-full bg-slate-900/30 border border-indigo-500/10 hover:border-indigo-500/30 text-slate-300 text-sm font-bold py-3.5 px-5 rounded-[1.2rem] transition-all flex justify-between items-center group disabled:opacity-50 hover:bg-slate-800/50 active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  Remove Duplicate Jobs
                </div>
                <span className="text-[10px] text-teal-300 font-black uppercase tracking-widest border border-teal-500/20 px-2 py-1 rounded-[8px] bg-teal-500/10">Smart</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-500/10">
            <button
              onClick={() => handleAction('reset', '/api/admin/clean')}
              disabled={!!loading}
              className="w-full bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 text-rose-500 text-sm font-bold py-3.5 px-5 rounded-[1.2rem] transition-all flex justify-between items-center group disabled:opacity-50 hover:bg-rose-500/10 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:animate-pulse" />
                Delete All Jobs
              </div>
              <span className="text-[10px] text-rose-500/80 font-black uppercase tracking-widest px-2 py-1 rounded-[8px] bg-rose-500/10 border border-rose-500/20">Danger</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
