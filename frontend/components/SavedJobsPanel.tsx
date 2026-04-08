"use client";

import { useStore } from '@/lib/store';
import { getSavedJobs } from '@/lib/localStorage';
import { X, Bookmark, ExternalLink, Building2, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Job } from '@/lib/store';
import Link from 'next/link';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SavedJobsPanel({ isOpen, onClose }: Props) {
    const { savedJobIds, toggleSave } = useStore();
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);

    useEffect(() => {
        setSavedJobs(getSavedJobs());
    }, [savedJobIds, isOpen]);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full bg-slate-900/90 backdrop-blur-2xl border-l border-slate-700/60 shadow-[0_0_60px_rgba(0,0,0,0.5)] flex flex-col">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                                <Bookmark className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="font-black text-white text-lg tracking-tight">Saved Jobs</h2>
                                <p className="text-[11px] text-slate-500 font-medium">{savedJobs.length} role{savedJobs.length !== 1 ? 's' : ''} bookmarked</p>
                            </div>
                            {savedJobs.length > 0 && (
                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-black shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                                    {savedJobs.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-xl transition-all text-slate-400 hover:text-slate-200"
                            aria-label="Close saved jobs panel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {savedJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                                <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                    <Star className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="font-bold text-slate-300 mb-2">No saved jobs yet</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Hit the bookmark icon on any job card to save it here for later.</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {savedJobs.map(job => (
                                    <div key={job.id} className="group flex items-start gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all duration-200">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Building2 className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-200 text-sm truncate leading-tight mb-0.5">{job.title}</p>
                                            <p className="text-xs text-slate-400 font-medium truncate">{job.company}</p>
                                            {job.location && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-600" />
                                                    <p className="text-xs text-slate-500 truncate">{(job.location || '').split(',')[0]}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                            <a
                                                href={job.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 rounded-lg transition-all"
                                                title="Open job"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => toggleSave(job)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                                                title="Remove"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {savedJobs.length > 0 && (
                        <div className="p-4 border-t border-slate-800 flex-shrink-0">
                            <Link
                                href="/saved"
                                onClick={onClose}
                                className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-teal-500 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]"
                            >
                                View All Saved Jobs →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
