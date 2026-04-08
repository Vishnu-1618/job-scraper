"use client";

import { useMemo, useState } from 'react';
import { Job } from '@/lib/store';
import { computeAnalytics } from '@/lib/analytics';
import { BarChart2, ChevronDown, ChevronUp, Briefcase, Globe, MapPin } from 'lucide-react';

interface Props {
    jobs: Job[];
}

function BarChart({ data, colorFn }: {
    data: { label: string; count: number; color?: string }[];
    colorFn?: (item: { label: string; count: number; color?: string }) => string;
}) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="space-y-2.5">
            {data.map(item => (
                <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0 text-right">{item.label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                        <div
                            className="h-full rounded-md chart-bar transition-all duration-700"
                            style={{
                                width: `${(item.count / max) * 100}%`,
                                background: colorFn ? colorFn(item) : item.color || '#6366f1',
                            }}
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6 text-right">{item.count}</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsDashboard({ jobs }: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const stats = useMemo(() => computeAnalytics(jobs), [jobs]);

    if (jobs.length === 0) return null;

    return (
        <div className="analytics-section">
            {/* Header */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className="analytics-header"
                id="analytics-toggle"
            >
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-gray-900">Analytics Overview</span>
                    <span className="text-xs text-gray-500 font-normal">({stats.total} jobs)</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="analytics-body">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="stat-card">
                            <div className="stat-icon bg-indigo-50">
                                <Briefcase className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <div className="stat-value">{stats.total.toLocaleString()}</div>
                                <div className="stat-label">Total Jobs</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-purple-50">
                                <Globe className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <div className="stat-value">{stats.remoteCount.toLocaleString()}</div>
                                <div className="stat-label">Remote</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-blue-50">
                                <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="stat-value">{stats.onsiteCount.toLocaleString()}</div>
                                <div className="stat-label">On-site</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="chart-card">
                            <h4 className="chart-title">Jobs by Platform</h4>
                            <BarChart data={stats.byPlatform} />
                        </div>
                        <div className="chart-card">
                            <h4 className="chart-title">Top Job Titles</h4>
                            <BarChart data={stats.topTitles} colorFn={() => '#8b5cf6'} />
                        </div>
                        <div className="chart-card">
                            <h4 className="chart-title">Top Locations</h4>
                            <BarChart data={stats.topLocations} colorFn={() => '#06b6d4'} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
