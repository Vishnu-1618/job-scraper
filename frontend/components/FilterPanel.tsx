import { useStore } from '../lib/store';
import { Filter, X, Search, MapPin, Briefcase, DollarSign, Calendar, Building2, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface FilterPanelProps {
    onSearch?: () => void;
}

const FilterPanel = ({ onSearch }: FilterPanelProps = {}) => {
    const { filters, setFilters } = useStore();
    const [jobSources, setJobSources] = useState<string[]>(['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri']);

    useEffect(() => {
        const fetchJobSources = async () => {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('url')
                    .limit(1000);

                if (data && !error) {
                    const sources = new Set<string>();
                    data.forEach(job => {
                        if (job.url.includes('linkedin.com')) sources.add('LinkedIn');
                        else if (job.url.includes('indeed.com')) sources.add('Indeed');
                        else if (job.url.includes('naukri.com')) sources.add('Naukri');
                        else if (job.url.includes('glassdoor.com')) sources.add('Glassdoor');
                    });
                    const allSources = new Set([...Array.from(sources), 'LinkedIn', 'Indeed', 'Glassdoor', 'Naukri']);
                    setJobSources(Array.from(allSources).sort());
                }
            } catch (err) {
                console.error('Failed to fetch job sources:', err);
            }
        };

        fetchJobSources();
    }, []);

    const toggleFilter = (key: keyof typeof filters, value: any) => {
        setFilters({ [key]: value });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar group/panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 border border-indigo-500/20 rounded-[1.2rem] flex items-center justify-center shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]">
                        <Filter className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-black text-white tracking-tight drop-shadow-sm">Filters</h2>
                </div>
                {(filters.search || filters.location || filters.job_type) && (
                    <button
                        onClick={() => setFilters({ search: '', location: '', job_type: '', experience_level: '', salary_min: 0, is_remote: false, platform: '', date_posted: '' })}
                        className="text-[10px] text-rose-400/80 hover:text-rose-400 bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-1.5 px-3 rounded-lg transition-all font-black flex items-center gap-1 uppercase tracking-widest"
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Keywords */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-indigo-400" />
                        Keywords
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. React Developer, Python"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl font-medium text-slate-200 placeholder-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner hover:border-indigo-500/40"
                        value={filters.search}
                        onChange={(e) => toggleFilter('search', e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                </div>

                {/* Location */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        Location
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Bangalore, Remote"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl font-medium text-slate-200 placeholder-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner hover:border-indigo-500/40"
                        value={filters.location}
                        onChange={(e) => toggleFilter('location', e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                </div>

                {/* Date Posted */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Date Posted
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Any time', value: '' },
                            { label: 'Past 24h', value: '1' },
                            { label: 'Past 3 days', value: '3' },
                            { label: 'Past week', value: '7' },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => toggleFilter('date_posted', opt.value)}
                                className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border ${filters.date_posted === opt.value
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                    : 'bg-slate-800/50 text-slate-400 border-indigo-500/10 hover:border-indigo-500/30 hover:bg-slate-800 hover:text-slate-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job Source */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        Source
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {jobSources.map((source) => {
                            const isActive = filters.platform === source.toLowerCase();
                            return (
                                <button
                                    key={source}
                                    onClick={() => toggleFilter('platform', isActive ? '' : source.toLowerCase())}
                                    className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border ${isActive
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'bg-slate-800/50 text-slate-400 border-indigo-500/10 hover:border-indigo-500/30 hover:bg-slate-800 hover:text-slate-300'
                                        }`}
                                >
                                    {source}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Remote Toggle */}
                <label
                    onClick={() => setFilters({ is_remote: !filters.is_remote })}
                    className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-[1.2rem] border border-indigo-500/10 cursor-pointer hover:bg-slate-800 hover:border-indigo-500/30 transition-all shadow-inner"
                >
                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-teal-400" />
                        Remote Only
                    </span>
                    <div className={`w-11 h-6 rounded-full relative transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${filters.is_remote ? 'bg-teal-500/80' : 'bg-slate-900 border border-slate-700'}`}>
                        <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full transition-transform shadow-[0_0_10px_rgba(255,255,255,0.5)] ${filters.is_remote ? 'left-[22px]' : 'left-[3px]'}`} />
                    </div>
                </label>

                {/* Job Type */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                        Job Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Full-time', 'Contract', 'Internship', 'Freelance'].map((type) => {
                            const isActive = filters.job_type === type.toLowerCase();
                            return (
                                <button
                                    key={type}
                                    onClick={() => toggleFilter('job_type', isActive ? '' : type.toLowerCase())}
                                    className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border ${isActive
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'bg-slate-800/50 text-slate-400 border-indigo-500/10 hover:border-indigo-500/30 hover:bg-slate-800 hover:text-slate-300'
                                        }`}
                                >
                                    {type}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Salary Range */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                        Min Salary
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                        <input
                            type="number"
                            placeholder="e.g. 50000"
                            className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-[1.2rem] font-medium text-slate-200 placeholder-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner hover:border-indigo-500/40"
                            value={filters.salary_min || ''}
                            onChange={(e) => toggleFilter('salary_min', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* Find Jobs Button */}
                <div className="pt-2">
                    <button
                        onClick={onSearch}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 text-white font-black py-4 px-4 rounded-[1.2rem] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-[0.98] tracking-wide"
                    >
                        <Search className="w-4 h-4" />
                        <span>Find Jobs</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
