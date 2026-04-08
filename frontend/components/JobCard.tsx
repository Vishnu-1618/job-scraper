"use client";

import { Job } from '../lib/store';
import { Building2, MapPin, DollarSign, ExternalLink, Briefcase, Calendar, Bookmark, BookmarkCheck } from 'lucide-react';
import { parseJobDate, extractDateString } from '../lib/utils';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import CompanyLogo from '@/components/CompanyLogo';

interface JobCardProps {
    job: Job;
}

const PLATFORM_META: Record<string, { name: string; cls: string; iconBg: string }> = {
    'linkedin': { name: 'LinkedIn', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 transition-colors', iconBg: 'bg-blue-500' },
    'indeed': { name: 'Indeed', cls: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20 transition-colors', iconBg: 'bg-indigo-600' },
    'naukri': { name: 'Naukri', cls: 'bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20 transition-colors', iconBg: 'bg-sky-500' },
    'glassdoor': { name: 'Glassdoor', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors', iconBg: 'bg-emerald-500' },
};

function getSource(url: string) {
    if (!url) return { name: 'Other', cls: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/20 transition-colors', iconBg: 'bg-zinc-500' };
    for (const [domain, meta] of Object.entries(PLATFORM_META)) {
        if (url.toLowerCase().includes(domain)) return meta;
    }
    return { name: 'Other', cls: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/20 transition-colors', iconBg: 'bg-zinc-500' };
}

function formatSalary(min?: number, max?: number, currency?: string): string | null {
    if (!min && !max) return null;
    const curr = currency === 'EUR' ? '€' : currency === 'INR' ? '₹' : '$';
    if (min && max) return `${curr}${min.toLocaleString()} – ${curr}${max.toLocaleString()}`;
    if (min) return `From ${curr}${min.toLocaleString()}`;
    return null;
}

function timeAgo(job: Job): string {
    const dateStr = extractDateString(job.location) || extractDateString(job.description);
    const parsed = parseJobDate(dateStr || job.posted_date) || (job.created_at ? new Date(job.created_at) : null);
    if (!parsed) return 'Recently posted';
    const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

const JobCard = ({ job }: JobCardProps) => {
    const { savedJobIds, toggleSave } = useStore();
    const isSaved = savedJobIds.has(job.id);
    const source = getSource(job.url);
    const salary = formatSalary(job.salary_min, job.salary_max, job.currency);

    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    return (
        <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform, transformStyle: 'preserve-3d' }}
            className="group block relative bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] p-7 transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-indigo-400/40 hover:shadow-[0_20px_50px_-10px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col h-full transform hover:-translate-y-1.5 ring-1 ring-indigo-500/10"
        >
            {/* Top sheen line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Radial glow pulse on hover */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Save button */}
            <button
                id={`save-job-${job.id}`}
                onClick={e => { e.stopPropagation(); toggleSave(job); e.preventDefault(); }}
                className={`absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-[inset_0_1px_10px_rgba(255,255,255,0.02)] ${isSaved
                    ? 'bg-indigo-600 text-white border border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-indigo-400 hover:bg-slate-800 hover:border-indigo-500/50'
                    }`}
                title={isSaved ? 'Unsave job' : 'Save job'}
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                {isSaved ? <BookmarkCheck className={`w-5 h-5 ${isSaved ? '' : 'drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]'}`} /> : <Bookmark className="w-5 h-5" />}
            </button>

            {/* Header */}
            <div className="flex items-start gap-5 mb-5 pr-12 relative z-10">
                <div className="relative group-hover:scale-105 transition-transform duration-500 ease-out">
                    <CompanyLogo
                        companyName={job.company || 'Unknown'}
                        className="w-14 h-14 rounded-[1.2rem] shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)] overflow-hidden transition-all bg-slate-800 flex-shrink-0 border border-indigo-500/20 group-hover:border-indigo-400/50"
                    />
                    <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${source.iconBg} shadow-[0_0_10px_rgba(0,0,0,0.8)]`} title={`Origin: ${source.name}`} />
                </div>
                <div className="min-w-0 flex-1 pt-1 flex flex-col justify-center h-14">
                    <h4 className="font-extrabold text-slate-200 text-base truncate tracking-wide group-hover:text-indigo-300 transition-colors drop-shadow-sm">{job.company || 'Unknown Company'}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{timeAgo(job)}</span>
                    </div>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black text-white mb-6 line-clamp-2 leading-tight tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-teal-300 transition-all z-10 relative drop-shadow-sm">
                {job.title}
            </h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-2.5 mb-8 z-10 relative">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-inner ${source.cls}`}>
                    {source.name}
                </span>

                {job.is_remote && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[inset_0_1px_10px_rgba(16,185,129,0.1)]">
                        🌐 Remote
                    </span>
                )}

                {job.job_type && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800/80 text-slate-300 border border-slate-700/60 shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)]">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {job.job_type}
                    </span>
                )}

                {job.similarity && job.similarity > 0.0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner shadow-[0_0_15px_rgba(99,102,241,0.2)] saturate-150">
                        ⚡ {(job.similarity * 100).toFixed(0)}% Match
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="space-y-4 mb-8 flex-1 z-10 relative">
                <div className="flex items-start gap-3 text-[13px] text-slate-400 font-bold uppercase tracking-widest">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-slate-500 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{job.location || 'Location not specified'}</span>
                </div>
                {salary && (
                    <div className="flex items-center gap-3 text-[15px] text-white font-black bg-slate-800/80 border border-emerald-500/20 px-4 py-2.5 rounded-xl inline-flex shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <DollarSign className="w-4.5 h-4.5 flex-shrink-0 text-emerald-400" />
                        <span className="tracking-wide text-emerald-50">{salary}</span>
                    </div>
                )}
            </div>

            {/* Footer CTA indicator */}
            <div className="mt-auto pt-5 flex items-center justify-between z-10 relative border-t border-slate-700/50 group-hover:border-indigo-500/30 transition-colors">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Apply Now</span>
                <div className="flex items-center gap-2 text-slate-300 text-[11px] font-black uppercase tracking-widest group-hover:translate-x-2 group-hover:text-teal-400 transition-all group-hover:drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                    <span>View Role</span>
                    <ExternalLink className="w-4 h-4" />
                </div>
            </div>
        </a>
    );
};

export default JobCard;
