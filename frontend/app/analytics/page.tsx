"use client";

import { useEffect, useState, useMemo } from 'react';
import { Job } from '@/lib/store';
import { computeAnalytics } from '@/lib/analytics';
import {
  BarChart2, Briefcase, Globe, MapPin, Calendar, TrendingUp, Users, Building2,
  ArrowUpRight, Layers, Zap
} from 'lucide-react';
import Link from 'next/link';
import { parseJobDate, extractDateString, isJobFresh } from '@/lib/utils';
import { useStore } from '@/lib/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

function deduplicateAndFilter(rawJobs: any[]): Job[] {
  const THIRTY_DAYS_AGO = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const seen = new Map<string, true>();
  const result: any[] = [];
  for (const job of rawJobs) {
    if (!job.url) continue;
    try { new URL(job.url); } catch { continue; }
    const allowedDomains = ['linkedin.com', 'indeed.', 'glassdoor.', 'naukri.com'];
    if (!allowedDomains.some(d => job.url.toLowerCase().includes(d))) continue;
    const dateStr = extractDateString(job.location) || extractDateString(job.description);
    const parsedDate = parseJobDate(dateStr || job.posted_date);
    if (parsedDate) {
      if (!isJobFresh(parsedDate, 30)) continue;
    } else if (job.created_at) {
      if (new Date(job.created_at).getTime() < THIRTY_DAYS_AGO) continue;
    }
    const key = [(job.title || '').toLowerCase().trim(), (job.company || '').toLowerCase().trim(), (job.location || '').toLowerCase().trim()].join('|');
    if (seen.has(key)) continue;
    seen.set(key, true);
    result.push({ ...job, parsedDate });
  }
  return result;
}

const CHART_COLORS = {
  indigo: '#6366f1',
  teal: '#2dd4bf',
  violet: '#a78bfa',
  cyan: '#22d3ee',
  emerald: '#34d399',
  fuchsia: '#e879f9',
  rose: '#fb7185',
  amber: '#fbbf24',
};

const PIE_COLORS = ['#6366f1', '#2dd4bf', '#a78bfa', '#22d3ee', '#e879f9', '#34d399', '#fb7185', '#fbbf24'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-black text-lg">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const AreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-violet-300 font-black text-lg">{payload[0].value.toLocaleString()} jobs</p>
      </div>
    );
  }
  return null;
};

function StatCard({ title, value, icon, color, sub }: { title: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className={`relative bg-slate-900/80 backdrop-blur-3xl border rounded-2xl p-6 overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${color}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-[40px] opacity-10 bg-current pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{title}</p>
          <p className="text-4xl font-black text-white tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center border border-current/20 text-current">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { jobs, setJobs } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobs.length > 0) return;
    setLoading(true);
    fetch('/api/jobs')
      .then(res => { if (!res.ok) throw new Error('Failed to fetch data'); return res.json(); })
      .then(data => { const processed = deduplicateAndFilter(data.jobs || []); setJobs(processed); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => computeAnalytics(jobs), [jobs]);

  // Recharts-formatted data
  const titlesData = stats.topTitles.slice(0, 8).map(d => ({ name: d.label.length > 18 ? d.label.slice(0, 18) + '…' : d.label, value: d.count }));
  const locationData = stats.topLocations.slice(0, 8).map(d => ({ name: d.label.length > 18 ? d.label.slice(0, 18) + '…' : d.label, value: d.count }));
  const platformData = stats.byPlatform.map(d => ({ name: d.label, value: d.count }));
  const dateData = stats.jobsByDate.slice(0, 14).reverse().map(d => ({ name: d.label, value: d.count }));
  const jobTypeData = stats.byJobType.slice(0, 6).map(d => ({ name: d.label, value: d.count }));
  const companiesData = stats.topCompanies.slice(0, 8).map(d => ({ name: d.label.length > 20 ? d.label.slice(0, 20) + '…' : d.label, value: d.count }));

  const remotePercent = stats.total > 0 ? Math.round((stats.remoteCount / stats.total) * 100) : 0;
  const todayJobs = stats.jobsByDate[0]?.count || 0;

  return (
    <div className="min-h-screen bg-[#060810] text-slate-300 relative overflow-hidden pt-16 font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <div className="relative border-b border-slate-800/60 py-12 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-black uppercase tracking-widest mb-4">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                Live Analytics
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">
                Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Insights</span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-xl">
                Real-time intelligence across <span className="text-indigo-300 font-bold">{stats.total.toLocaleString()}</span> active job listings.
              </p>
            </div>
            <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-800 transition-all w-fit">
              <ArrowUpRight className="w-4 h-4 rotate-180" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
            </div>
            <p className="text-indigo-400 font-black tracking-widest uppercase text-xs animate-pulse">Loading Analytics...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl font-bold">⚠️ {error}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-40">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
              <BarChart2 className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No data yet</h3>
            <p className="text-slate-400">JobRadar AI is collecting data in the background. Check back shortly.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Active Jobs" value={stats.total} icon={<Briefcase className="w-5 h-5" />} color="border-indigo-500/20 text-indigo-400" sub="Verified & deduplicated" />
              <StatCard title="Remote Positions" value={stats.remoteCount} icon={<Globe className="w-5 h-5" />} color="border-teal-500/20 text-teal-400" sub={`${remotePercent}% of all listings`} />
              <StatCard title="Posted Today" value={todayJobs} icon={<Calendar className="w-5 h-5" />} color="border-violet-500/20 text-violet-400" sub="New in last 24 hours" />
              <StatCard title="Active Companies" value={stats.topCompanies.length} icon={<Building2 className="w-5 h-5" />} color="border-cyan-500/20 text-cyan-400" sub="Currently hiring" />
            </div>

            {/* ── Row 1: Area Chart (full width) ── */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Jobs Posted by Date
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Daily job posting volume trend (last 14 days)</p>
                </div>
                <span className="text-xs font-black text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">Trend</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'rgba(167,139,250,0.2)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gradViolet)" dot={false} activeDot={{ r: 5, fill: '#a78bfa', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Row 2: Top Job Titles + Platform Split ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Job Titles (8 cols) */}
              <div className="lg:col-span-8 bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-400" />
                      Top Job Titles
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Most in-demand roles right now</p>
                  </div>
                  <span className="text-xs font-black text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Volume</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={titlesData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIndigo" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                    <Bar dataKey="value" fill="url(#gradIndigo)" radius={[0, 6, 6, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Platform Pie Chart (4 cols) */}
              <div className="lg:col-span-4 bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                <div className="mb-4">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-400" />
                    Jobs by Platform
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Source distribution</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {platformData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {platformData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-400 font-medium capitalize">{d.name}</span>
                      </div>
                      <span className="text-white font-black text-xs">{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Row 3: Top Locations + Job Types ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Locations */}
              <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                      Top Locations
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Where jobs are concentrated</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCyan" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#67e8f9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.05)' }} />
                    <Bar dataKey="value" fill="url(#gradCyan)" radius={[0, 6, 6, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Job Types */}
              <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      Job Types
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">Employment type breakdown</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={jobTypeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(52,211,153,0.05)' }} />
                    <Bar dataKey="value" fill="url(#gradEmerald)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Remote ratio visual */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Remote Ratio</span>
                    <span className="text-sm font-black text-teal-300">{remotePercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${remotePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 4: Top Hiring Companies (full width) ── */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-fuchsia-400" />
                    Top Hiring Companies
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Companies with the most active job listings</p>
                </div>
                <span className="text-xs font-black text-fuchsia-300 bg-fuchsia-500/10 px-3 py-1.5 rounded-full border border-fuchsia-500/20">Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {companiesData.map((company, i) => (
                  <div key={company.name} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-fuchsia-500/30 hover:bg-slate-800/60 transition-all group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 text-white" style={{ background: PIE_COLORS[i % PIE_COLORS.length] + '33', border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}44` }}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate group-hover:text-fuchsia-300 transition-colors">{company.name}</p>
                      <p className="text-slate-500 text-xs">{company.value} open role{company.value !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full bar chart for companies */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={companiesData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradFuchsia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e879f9" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,121,249,0.05)' }} />
                    <Bar dataKey="value" fill="url(#gradFuchsia)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
