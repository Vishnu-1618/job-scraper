"use client";

import { useEffect, useState } from 'react';
import { getSavedJobs } from '@/lib/localStorage';
import { useStore } from '@/lib/store';
import { Job } from '@/lib/store';
import JobCard from '@/components/JobCard';
import { Bookmark, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function SavedJobsPage() {
    const { savedJobIds, initSavedJobs } = useStore();
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);

    useEffect(() => {
        initSavedJobs();
        setSavedJobs(getSavedJobs());
    }, []);

    // Re-sync whenever savedJobIds changes (user removes a job)
    useEffect(() => {
        setSavedJobs(getSavedJobs());
    }, [savedJobIds]);

    return (
        <div className="min-h-screen bg-[#060810] text-slate-300 relative overflow-hidden font-sans">
            {/* Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)] z-0" />
            <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Hero */}
            <div className="relative border-b border-indigo-500/10 bg-slate-900/40 backdrop-blur-3xl pt-24 pb-12 z-10 w-full">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to all jobs
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-800 border border-indigo-500/20 rounded-[1.2rem] flex items-center justify-center shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
                            <Bookmark className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm mb-1">Saved Jobs</h1>
                            <p className="text-slate-400 text-sm font-medium">{savedJobs.length} position{savedJobs.length !== 1 ? 's' : ''} saved for later</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full animate-slide-up">
                {savedJobs.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/60 backdrop-blur-xl border border-indigo-500/10 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
                        
                        <div className="w-24 h-24 bg-slate-800/80 border border-indigo-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
                            <Bookmark className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-3 drop-shadow-sm">No saved jobs yet</h3>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">Bookmark interesting opportunities while browsing to keep them saved here.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.2rem] font-black transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-[0.98] border border-indigo-400/50 tracking-wide"
                        >
                            <Building2 className="w-4 h-4" />
                            Browse Available Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedJobs.map(job => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
