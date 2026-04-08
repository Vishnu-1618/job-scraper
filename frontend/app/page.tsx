"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import JobCard from '@/components/JobCard';
import SearchBar from '@/components/SearchBar';
import { ResumeUpload } from '@/components/ResumeUpload';
import { parseJobDate, extractDateString, isJobFresh, deduplicateAndFilter } from '@/lib/utils';
import { getSearchState, saveSearchState } from '@/lib/localStorage';
import { Filter, MapPin, Briefcase, Globe, RefreshCw, TrendingUp, X, Radio, FileText, Zap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { jobs, setJobs, loading, setLoading, filters, setFilters, initSavedJobs, activeResumeId, setActiveResumeId, clearActiveResume } = useStore();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [liveInserts, setLiveInserts] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const matchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitRef = useRef(false);

  // ── On mount: restore last search state ──────────────────────────────────
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    // Load or generate a persistent dummy user ID for the session to view AI Matches
    let storedUserId = localStorage.getItem('jobradar_user_id');
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem('jobradar_user_id', storedUserId);
    }
    setUserId(storedUserId);

    initSavedJobs();

    const saved = getSearchState();
    if (saved) {
      setFilters(saved);
      setQuickSearch(saved.search || '');
    }

    fetchJobs(saved || filters);

    // ── Setup Supabase Realtime ──────────────────────────────────────────────
    const channel = supabase.channel('public:jobs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, (payload) => {
        const newJob = payload.new;

        // Pass it through our dedup/filter so it gets the right date attached
        const processed = deduplicateAndFilter([newJob]);

        if (processed.length > 0) {
          // It passed the freshness/format checks! Prepend to UI feed
          const currentJobs = useStore.getState().jobs;
          // Re-dedupe against current UI state
          const exists = currentJobs.some((j: any) =>
            j.title === processed[0].title &&
            j.company === processed[0].company &&
            j.location === processed[0].location
          );

          if (!exists) {
            setJobs([processed[0], ...currentJobs]);
            setLiveInserts((prev: number) => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Fetch jobs ─────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (activeFilters = filters, signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.location) params.append('location', activeFilters.location);
      if (activeFilters.is_remote) params.append('is_remote', 'true');
      if (activeFilters.job_type) params.append('job_type', activeFilters.job_type);
      if (activeFilters.platform) params.append('platform', activeFilters.platform);

      const res = await fetch(`/api/jobs?${params.toString()}`, { signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const { jobs: raw } = await res.json();
      setJobs(raw || []);
      console.log(`[JobRadar AI] Received ${raw?.length ?? 0} unique jobs from server`);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        // Silently handle abortions to prevent runtime error overlays
        return;
      }
      const msg = err?.message || 'Unknown error';
      console.error('Error fetching jobs:', msg);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, setJobs, setLoading]);

  // ── Save search state & refetch on filter changes ─────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveSearchState(filters);
    
    const controller = new AbortController();
    const id = setTimeout(() => fetchJobs(filters, controller.signal), 400);
    
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [filters.job_type, filters.platform, filters.is_remote, filters.search, filters.location, fetchJobs]);

  const handleSearch = () => {
    saveSearchState(filters);
    fetchJobs(filters);
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', job_type: '', experience_level: '', salary_min: 0, is_remote: false, platform: '', date_posted: '' });
    setQuickSearch('');
  };

  // ── Fetch matched jobs from DB when resume is active ──────────────────────
  const fetchMatches = useCallback(async (uid: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/matches?userId=${encodeURIComponent(uid)}`, { signal });
      if (!res.ok) return [];
      const { jobs: matched } = await res.json();
      return matched || [];
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      return [];
    }
  }, []);

  // When activeResumeId is set, poll for matches from DB
  useEffect(() => {
    if (!activeResumeId || !userId) {
      setMatchedJobs([]);
      setMatchLoading(false);
      if (matchPollRef.current) clearInterval(matchPollRef.current);
      return;
    }

    const controller = new AbortController();
    setMatchLoading(true);

    // Initial fetch
    fetchMatches(userId, controller.signal).then(matches => {
      if (matches === null) return; // Aborted
      setMatchedJobs(matches);
      setMatchLoading(false);
    });

    // Start polling
    matchPollRef.current = setInterval(async () => {
      const matches = await fetchMatches(userId, controller.signal);
      if (matches === null) return; // Aborted
      if (matches.length > 0) {
        setMatchedJobs(matches);
        setMatchLoading(false);
        if (matchPollRef.current) clearInterval(matchPollRef.current);
      }
    }, 3000);

    return () => {
      controller.abort();
      if (matchPollRef.current) clearInterval(matchPollRef.current);
    };
  }, [activeResumeId, userId, fetchMatches]);

  const hasActiveFilters = filters.search || filters.location || filters.job_type || filters.platform || filters.is_remote;

  // When resume is active: show matched jobs from DB (ordered by similarity)
  // Otherwise: show all fetched jobs
  const displayedJobs = activeResumeId ? matchedJobs : jobs;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">

      {/* ── Premium Midnight Aurora Hero Section ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-950 min-h-screen flex flex-col justify-center border-b border-indigo-500/10">
        {/* Deep Field Animated Nebula Orbs */}
        <div className="absolute top-[-10%] right-[10%] w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        {/* Tactical Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-2.5 bg-slate-900/60 border border-indigo-500/20 rounded-2xl backdrop-blur-xl mb-12 shadow-[0_0_40px_rgba(99,102,241,0.1)] group hover:border-indigo-400/40 hover:bg-slate-800/80 transition-all cursor-default ring-1 ring-indigo-500/10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              <Zap className="w-3.5 h-3.5" />
              JobRadar AI
            </div>
            <span className="text-slate-400 text-sm font-medium pr-2">Discover thousands of curated roles from 4 major platforms instantly</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-sm leading-[1.05]">
            Elevate Your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-400 to-indigo-400 animate-border-flow bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Career Journey
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
            Jobs from <span className="text-indigo-300 font-bold">LinkedIn</span>, <span className="text-indigo-300 font-bold">Indeed</span>, <span className="text-indigo-300 font-bold">Glassdoor</span>, and <span className="text-indigo-300 font-bold">Naukri</span> — collected, deduplicated, and matched to you with AI.
          </p>

          {/* V4 Stats Command Row */}
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <div className="group relative flex items-center justify-between gap-6 px-7 py-5 bg-slate-900/60 backdrop-blur-xl rounded-[1.5rem] border border-indigo-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-indigo-400/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all min-w-[220px] overflow-hidden ring-1 ring-indigo-500/10 hover:ring-indigo-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-start relative z-10">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover:text-indigo-300 transition-colors">Jobs Available</span>
                <span className="text-3xl font-black text-white leading-none drop-shadow-md">{jobs.length.toLocaleString()}</span>
              </div>
              <div className="relative flex h-3 w-3 z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
              </div>
            </div>

            {/* Live Updates Counter */}
            <div className={`transition-all duration-700 ${liveInserts > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
              <div className="group relative flex items-center justify-between gap-6 px-7 py-5 bg-teal-500/10 backdrop-blur-3xl rounded-[1.5rem] border border-teal-500/30 shadow-[0_8px_32px_rgba(20,184,166,0.15)] min-w-[220px] overflow-hidden ring-1 ring-teal-500/20">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(45,212,191,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-border-flow pointer-events-none" />
                <div className="flex flex-col items-start relative z-10">
                  <span className="text-[10px] font-black uppercase text-teal-400 tracking-widest mb-1 animate-pulse">New Today</span>
                  <span className="text-3xl font-black text-teal-100 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-teal-200">+{liveInserts}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-7 py-5 bg-slate-900/60 backdrop-blur-xl rounded-[1.5rem] border border-indigo-500/20 text-slate-300 font-black text-sm tracking-wide shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-indigo-400/40 transition-colors cursor-default ring-1 ring-indigo-500/10">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]"><Clock className="w-4 h-4" /></div>
              Last 30 Days Context
            </div>

            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="flex items-center gap-4 px-7 py-5 bg-rose-500/10 backdrop-blur-xl rounded-[1.5rem] border border-rose-500/20 text-rose-400 font-black text-sm tracking-wide shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-rose-500/20 transition-all ring-1 ring-rose-500/10"
              title="Clear all saved search filters and hard refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Force Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Command Center ──────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900/60 backdrop-blur-3xl border border-indigo-500/20 p-4 sm:p-5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col sm:flex-row gap-4 ring-1 ring-indigo-500/10 relative overflow-hidden group hover:border-indigo-500/40 transition-all hover:shadow-[0_20px_80px_rgba(99,102,241,0.15)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex-1">
            <SearchBar
              value={quickSearch}
              onChange={v => { setQuickSearch(v); setFilters({ ...filters, search: v }); }}
              onSearch={handleSearch}
            />
          </div>
          <div className="flex gap-3 relative z-10">
            <button
              onClick={() => setShowFilters(s => !s)}
              id="filters-toggle-btn"
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-[1.2rem] font-bold text-sm border transition-all ${showFilters || hasActiveFilters
                ? 'bg-indigo-500 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-indigo-500/50'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && !showFilters && (
                <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              )}
            </button>
            <button
              onClick={() => fetchJobs(filters)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800/80 text-slate-300 rounded-[1.2rem] font-bold text-sm hover:bg-slate-800 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-slate-700/60 hover:border-indigo-500/50 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-[1.2rem] font-bold text-sm border transition-all ${activeResumeId
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.2)]'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-teal-500/50'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">AI Match</span>
            </button>
          </div>
        </div>

        {/* Filter Glass Panel */}
        {showFilters && (
          <div className="mt-6 p-8 bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] animate-fade-in relative overflow-hidden ring-1 ring-indigo-500/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end relative z-10">

              {/* Job Type */}
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Briefcase className="w-3.5 h-3.5" /> Job Type
                </label>
                <select
                  value={filters.job_type || ''}
                  onChange={e => setFilters({ ...filters, job_type: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/60 text-white rounded-[1rem] px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all appearance-none shadow-inner"
                >
                  <option value="">All Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Freelance</option>
                </select>
              </div>

              {/* Platform */}
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-indigo-400 transition-colors"><Globe className="w-3.5 h-3.5" /> Platform</label>
                <select
                  value={filters.platform || ''}
                  onChange={e => setFilters({ ...filters, platform: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/60 text-white rounded-[1rem] px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all appearance-none shadow-inner"
                >
                  <option value="">All Platforms</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="naukri">Naukri</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-indigo-400 transition-colors"><MapPin className="w-3.5 h-3.5" /> Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Remote"
                  value={filters.location || ''}
                  onChange={e => setFilters({ ...filters, location: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/60 text-white rounded-[1rem] px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                />
              </div>

              {/* Remote */}
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-emerald-400 transition-colors">🌐 Remote</label>
                <button
                  onClick={() => setFilters({ ...filters, is_remote: !filters.is_remote })}
                  className={`w-full py-3 px-4 rounded-[1rem] font-bold text-sm transition-all border shadow-inner ${filters.is_remote ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:bg-slate-800'}`}
                >
                  {filters.is_remote ? '✓ Remote Only' : 'Any Location'}
                </button>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <div className="space-y-2">
                  <div className="h-[22px]" /> {/* Spacer aligning with labels */}
                  <button
                    onClick={clearFilters}
                    className="flex justify-center items-center gap-2 w-full py-3 px-4 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-[1rem] font-bold text-sm hover:bg-rose-500/20 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Active Resume Filter Banner */}
        {activeResumeId && (
          <div className="mb-8 p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-indigo-500/30 flex items-center justify-between shadow-[0_4px_20px_rgba(99,102,241,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wide">AI Resume Matching Active</h3>
                <p className="text-slate-400 text-sm">
                  {matchLoading
                    ? 'Retrieving your best job matches...'
                    : matchedJobs.length > 0
                    ? `Found ${matchedJobs.length} jobs matched to your resume`
                    : 'Syncing matches from database — appearing in seconds'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { clearActiveResume(); setShowUpload(false); setMatchedJobs([]); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        )}

        {/* Upload Panel */}
        {showUpload && !activeResumeId && (
          <div className="mb-12 animate-fade-in">
            <ResumeUpload userId={userId} onUploadComplete={() => setShowUpload(false)} />
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div className="mb-6 p-6 bg-rose-900/30 border border-rose-500/30 rounded-3xl text-rose-400 animate-slide-up backdrop-blur-md">
            <p className="font-bold text-lg mb-2 flex items-center gap-2">⚠️ Could not load jobs</p>
            <p className="text-sm font-mono text-rose-300 mb-4 bg-rose-950/50 p-3 rounded-xl">{fetchError}</p>
            <button
              onClick={() => fetchJobs(filters)}
              className="px-6 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 rounded-xl text-sm font-bold transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading — normal jobs */}
        {!activeResumeId && loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-indigo-500/10 rounded-full animate-pulse blur-md"></div>
            </div>
            <p className="text-indigo-300 font-bold tracking-widest uppercase text-sm animate-pulse">Synchronizing Data...</p>
          </div>
        )}

        {/* Match Loading State */}
        {activeResumeId && matchLoading && matchedJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-2 bg-indigo-500/10 rounded-full animate-pulse blur-md" />
            </div>
            <p className="text-indigo-300 font-bold tracking-widest uppercase text-sm animate-pulse">Finding Your Best Matches...</p>
            <p className="text-slate-500 text-sm">Searching {jobs.length.toLocaleString()} jobs using AI similarity</p>
          </div>
        )}

        {/* Empty — no matches yet after polling finished */}
        {activeResumeId && !matchLoading && matchedJobs.length === 0 && (
          <div className="text-center py-32 bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-indigo-500/20 shadow-[0_20px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden ring-1 ring-indigo-500/10 group">
            <div className="w-28 h-28 bg-slate-900/80 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-700/50">
              <Zap className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-3xl font-poppins font-black text-white mb-4 tracking-tight">No matches found yet</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto font-medium">JobRadar AI is still analyzing your resume. This may take up to 30 seconds.</p>
          </div>
        )}

        {/* Empty */}
        {!activeResumeId && !loading && displayedJobs.length === 0 && !fetchError && (
          <div className="text-center py-32 bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-indigo-500/20 shadow-[0_20px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden ring-1 ring-indigo-500/10 group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-28 h-28 bg-slate-900/80 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-indigo-500/30 transition-all rotate-3 group-hover:rotate-0">
              <Briefcase className="w-12 h-12 text-slate-500 group-hover:text-indigo-400 transition-colors drop-shadow-md" />
            </div>
            <h3 className="text-3xl font-poppins font-black text-white mb-4 tracking-tight drop-shadow-md">No positions found</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto font-medium">We couldn't find any roles matching this specific criteria right now.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl font-black hover:bg-slate-700 hover:border-slate-600 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && displayedJobs.length > 0 && (
          <div className="animate-slide-up relative bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-950/80 backdrop-blur-xl p-4 sm:p-8 rounded-[3rem] border border-indigo-500/10 shadow-[0_0_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden ring-1 ring-indigo-500/10">
            {/* Top accent sheen on the grid panel */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50" />
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-teal-500 rounded-full" />
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4 drop-shadow-sm">
                  Latest Matches
                  <span className="flex items-center justify-center px-4 py-1.5 bg-slate-900 text-slate-300 text-sm rounded-xl border border-slate-700/60 font-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
                    {displayedJobs.length} roles
                  </span>
                </h2>
              </div>
              {hasActiveFilters && !activeResumeId && (
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                  Filtered View Active
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {displayedJobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
