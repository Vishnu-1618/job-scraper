"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { Bookmark, Zap, BarChart2, ShieldCheck, X } from 'lucide-react';
import SavedJobsPanel from './SavedJobsPanel';
import { usePathname } from 'next/navigation';

export default function NavbarClient() {
    const pathname = usePathname();
    const { savedJobIds, initSavedJobs, initViewedJobs } = useStore();
    const [savedPanelOpen, setSavedPanelOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const savedCount = savedJobIds.size;

    useEffect(() => {
        initSavedJobs();
        initViewedJobs();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (pathname?.startsWith('/admin')) return null;

    const navLinks = [
        { href: '/', label: 'Jobs', icon: <Zap className="w-3.5 h-3.5" /> },
        { href: '/analytics', label: 'Analytics', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-[#060810]/95 backdrop-blur-2xl shadow-[0_1px_0_rgba(99,102,241,0.12),0_4px_24px_rgba(0,0,0,0.4)] border-b border-indigo-500/15'
                : 'bg-transparent border-b border-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                        <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-teal-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={2.5} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                        <span className="font-black text-[17px] tracking-tight text-white">
                            JobRadar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">AI</span>
                        </span>
                    </Link>

                    {/* Center Nav */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-xl p-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${pathname === link.href
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Saved Jobs Button */}
                        <button
                            id="saved-jobs-btn"
                            onClick={() => setSavedPanelOpen(true)}
                            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white hover:border-slate-600/60 transition-all group"
                        >
                            <Bookmark className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                            <span className="hidden sm:inline">Saved</span>
                            {savedCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-indigo-600 rounded-full flex items-center justify-center text-[9px] text-white font-black shadow-[0_0_10px_rgba(99,102,241,0.6)] border border-indigo-400/30">
                                    {savedCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            <SavedJobsPanel isOpen={savedPanelOpen} onClose={() => setSavedPanelOpen(false)} />
        </>
    );
}
