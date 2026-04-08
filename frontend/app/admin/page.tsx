"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Filter, MapPin, Briefcase, Globe, RefreshCw, TrendingUp, X, Radio, FileText, Zap, 
  Layers, Database, Activity, ShieldCheck, Settings, Github, AppWindow, 
  LayoutDashboard, Terminal, LogOut, Cpu, HardDrive, Network 
} from 'lucide-react';
import Link from 'next/link';

// Components
import StatCard from '@/components/admin/StatCard';
import ScraperControls from '@/components/admin/ScraperControls';
import LogsTable from '@/components/admin/LogsTable';
import SystemHealth from '@/components/admin/SystemHealth';
import BarChart from '@/components/admin/BarChart';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'scraper' | 'database' | 'logs' | 'health'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', { signal });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    
    // Poll every 60 seconds
    const interval = setInterval(() => fetchStats(controller.signal), 60000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth'); // Trigger GET logout route
    router.push('/admin/login');
  };

  const NavItem = ({ id, icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[1.2rem] transition-all font-bold text-sm tracking-wide ${activeTab === id
        ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/30'
        : 'text-slate-400 hover:text-indigo-200 hover:bg-indigo-500/10 border border-transparent'
        }`}
    >
      <span className={activeTab === id ? 'text-indigo-300' : 'text-slate-500 group-hover:text-indigo-300'}>{icon}</span>
      {label}
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 overflow-hidden relative">
      {/* Luxury Minimalist Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />

      {/* Edge-Anchored Enterprise Sidebar */}
      <aside className="fixed left-0 top-0 w-[280px] h-screen bg-slate-900/95 backdrop-blur-xl border-r border-indigo-500/10 z-20 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)]">
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent opacity-50" />
        <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-12 group/logo w-fit">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover/logo:scale-105 transition-all">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white transition-colors">JobRadar <span className="text-indigo-400">AI</span></span>
          </Link>

          <nav className="space-y-2 flex-1 relative">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4 mb-4">Command Center</div>
            <NavItem id="overview" label="Overview" icon={<LayoutDashboard className="w-5 h-5" />} />
            <NavItem id="scraper" label="Scraper Controls" icon={<Settings className="w-5 h-5" />} />
            <NavItem id="database" label="Database" icon={<Database className="w-5 h-5" />} />
            
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4 mt-8 mb-4">Monitoring</div>
            <NavItem id="logs" label="Activity Logs" icon={<Terminal className="w-5 h-5" />} />
            <NavItem id="health" label="System Status" icon={<Layers className="w-5 h-5" />} />
          </nav>

          <div className="pt-6 mt-8 border-t border-indigo-500/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-[1.2rem] bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all font-bold tracking-wide text-sm shadow-inner"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[280px] h-screen overflow-y-auto z-10 relative scrollbar-hide">
        <div className="max-w-[1600px] mx-auto w-full p-8 md:p-12">
          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12 w-full pb-6 border-b border-indigo-500/10 relative">
            <div className="relative z-10 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-[8px] text-teal-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                Network: Active & Syncing
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-sm flex items-center gap-4">
                {activeTab.replace('_', ' ')}
                {loading && <div className="w-6 h-6 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>}
              </h1>
              <p className="text-slate-400 font-medium mt-3 tracking-wide text-sm leading-relaxed max-w-xl">
                Real-time observability and control over your scraping pipelines, database retention, and system health metrics.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchStats()}
                className="flex items-center gap-2 px-6 py-3.5 border border-indigo-500/20 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-[1.2rem] transition-all shadow-[inset_0_1px_10px_rgba(255,255,255,0.02)] group relative z-10 hover:border-indigo-400/50 font-bold text-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : 'group-hover:rotate-180 transition-transform text-indigo-400'}`} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </header>

          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute inset-2 bg-indigo-500/10 rounded-full animate-pulse blur-md"></div>
              </div>
              <p className="text-indigo-400 font-black tracking-widest uppercase text-[10px] animate-pulse">Loading...</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-8">

              {/* OVERVIEW TAB (EXTREME BENTO GRID) */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Top Row: Quick Stats Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
                  <StatCard
                    title="Total Jobs Indexed"
                    value={stats?.totalJobs?.toLocaleString() || 0}
                    icon={<Briefcase className="w-6 h-6" />}
                    trend="Lifetime"
                    trendUp={true}
                    colorClass="text-indigo-400"
                  />
                  <StatCard
                    title="Active Listings"
                    value={stats?.activeJobs?.toLocaleString() || 0}
                    icon={<Zap className="w-6 h-6" />}
                    trend="+12% vs last month"
                    trendUp={true}
                    colorClass="text-emerald-400"
                  />
                  <StatCard
                    title="Source Distribution"
                    value={stats?.jobsPerPlatform?.length || 0}
                    icon={<Globe className="w-6 h-6" />}
                    trend="Across 4 Platforms"
                    trendUp={true}
                    colorClass="text-amber-400"
                  />
                  <StatCard
                    title="Daily Throughput"
                    value={stats?.jobsToday || 0}
                    icon={<TrendingUp className="w-6 h-6" />}
                    trend="+5% today"
                    trendUp={true}
                    colorClass="text-rose-400"
                  />
                </div>

                  {/* Middle Section: Chart & Health */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                    {/* Platform Distribution Chart */}
                    <div className="bg-slate-900/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-start justify-center ring-1 ring-indigo-500/10 group transition-all h-[400px]">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
                      <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 tracking-tight relative z-10 w-full drop-shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                          <Globe className="w-5 h-5" />
                        </div>
                        Jobs by Platform
                        <span className="ml-auto text-[10px] font-black text-teal-300 bg-teal-500/10 px-3 py-1.5 rounded-[8px] uppercase tracking-widest border border-teal-500/20 shadow-sm">Live Trace</span>
                      </h3>
                      <div className="relative z-10 w-full flex-1">
                        <BarChart data={stats?.jobsPerPlatform || []} />
                      </div>
                    </div>

                    {/* System Health */}
                    <div className="h-[400px]">
                      <SystemHealth />
                    </div>
                  </div>

                  {/* Recent Logs Section */}
                  <div className="pt-4">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Terminal className="w-4 h-4" />
                      </div>
                      Recent System Activity
                    </h3>
                    <LogsTable limit={5} />
                  </div>
                </div>
              )}

              {/* SCRAPER CONTROLS */}
              {activeTab === 'scraper' && (
                <div className="max-w-4xl">
                  <ScraperControls onActionComplete={fetchStats} />
                </div>
              )}

              {/* DATABASE INSIGHTS */}
              {activeTab === 'database' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-400/40 transition-all ring-1 ring-indigo-500/10">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 tracking-tight relative z-10 drop-shadow-sm">
                      <div className="w-10 h-10 rounded-[1.2rem] bg-slate-800/80 border border-indigo-500/20 flex items-center justify-center shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
                        <Globe className="w-5 h-5 text-indigo-400" />
                      </div>
                      Jobs by Platform
                      <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-[8px] border border-indigo-500/10 uppercase tracking-widest shadow-sm">Active 30d</span>
                    </h3>
                    <div className="relative z-10">
                      <BarChart data={stats?.jobsPerPlatform || []} />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGS TAB */}
              {activeTab === 'logs' && (
                <LogsTable />
              )}

              {/* HEALTH TAB */}
              {activeTab === 'health' && (
                <SystemHealth />
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
