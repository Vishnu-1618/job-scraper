"use client";

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Terminal } from 'lucide-react';

interface Log {
  id: number;
  source: string;
  status: 'success' | 'failed' | 'partial';
  jobs_found: number;
  duration_ms: number;
  created_at: string;
}

export default function LogsTable({ limit: customLimit }: { limit?: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = customLimit || 10;

  const fetchLogs = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?limit=${limit}&offset=${(page - 1) * limit}&source=${search}`, { signal });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchLogs(controller.signal), 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search]);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Success</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm"><Clock className="w-3.5 h-3.5" /> Partial</span>;
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[2rem] shadow-2xl overflow-hidden relative group ring-1 ring-indigo-500/10 hover:border-indigo-400/40 transition-all duration-700">

      {/* Subtle Glows */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header & Search */}
      <div className="p-6 md:p-8 border-b border-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 bg-slate-900/40">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight drop-shadow-sm">
            <div className="w-10 h-10 rounded-[1.2rem] bg-slate-800 border border-indigo-500/20 flex items-center justify-center shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
              <Terminal className="w-5 h-5 text-indigo-400" />
            </div>
            Scraping Activity
          </h2>
          <p className="text-[10px] font-black text-slate-500 mt-2 tracking-widest uppercase">Real-time execution history of scraper runs.</p>
        </div>
        <div className="relative group/search">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/search:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Filter by platform..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-11 pr-4 py-3 bg-slate-800/50 border border-indigo-500/20 rounded-[1.2rem] text-sm font-bold tracking-wide text-white focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 w-full sm:w-72 outline-none transition-all placeholder:text-slate-600 shadow-inner"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-[10px] uppercase bg-slate-900/50 text-slate-500 border-b border-indigo-500/10 tracking-widest">
            <tr>
              <th className="px-8 py-5 font-black">Time</th>
              <th className="px-6 py-5 font-black">Platform</th>
              <th className="px-6 py-5 font-black">Status</th>
              <th className="px-6 py-5 font-black text-right">Jobs Collected</th>
              <th className="px-8 py-5 font-black text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-500/10 font-mono text-sm">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
                  <span className="text-slate-500 font-black tracking-widest uppercase text-[10px] animate-pulse">Retrieving Logs...</span>
                </div>
              </td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 bg-slate-900/20 font-sans text-xs">No activity yet. Scraping logs will appear here once jobs are collected.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-indigo-500/5 transition-colors group cursor-default">
                <td className="px-8 py-5 text-slate-500 group-hover:text-slate-300 transition-colors">
                  {new Date(log.created_at).toLocaleString(undefined, {
                    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </td>
                <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] ${log.source === 'LinkedIn' ? 'bg-blue-400' : log.source === 'Indeed' ? 'bg-blue-500' : log.source === 'Glassdoor' ? 'bg-green-400' : 'bg-orange-400'}`} />
                      <span className="text-sm font-bold text-slate-300 tracking-wide uppercase">{log.source || 'Scraper'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">{log.jobs_found || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-bold text-slate-400 tracking-tighter">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '--'}
                    </span>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 border-t border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 relative z-10 font-sans">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Showing <span className="font-black text-slate-300">{(page - 1) * limit + (logs.length > 0 ? 1 : 0)}</span> – <span className="font-black text-slate-300">{Math.min(page * limit, total)}</span> of <span className="font-black text-slate-300">{total}</span> logs
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2.5 rounded-[1rem] border border-indigo-500/20 bg-slate-800/50 hover:bg-slate-700 hover:border-indigo-400 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-inner"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total || loading}
            className="p-2.5 rounded-[1rem] border border-indigo-500/20 bg-slate-800/50 hover:bg-slate-700 hover:border-indigo-400 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-inner"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
