"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

interface Props {
    value: string;
    onChange: (val: string) => void;
    onSearch: () => void;
}

function highlight(text: string, query: string): React.ReactElement {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default function SearchBar({ value, onChange, onSearch }: Props) {
    const jobs = useStore(s => s.jobs);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Build suggestion list debounced via backend endpoint
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const trimmedVal = value.trim();
            if (trimmedVal.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const res = await fetch(`/api/jobs/suggest?q=${encodeURIComponent(trimmedVal)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.suggestions && Array.isArray(data.suggestions)) {
                        setSuggestions(data.suggestions);
                        setShowSuggestions(data.suggestions.length > 0);
                        setActiveIdx(-1);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            }
        }, 250);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectSuggestion = useCallback((title: string) => {
        onChange(title);
        setShowSuggestions(false);
        setTimeout(onSearch, 0);
    }, [onChange, onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0) {
                e.preventDefault();
                selectSuggestion(suggestions[activeIdx]);
            } else {
                setShowSuggestions(false);
                onSearch();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={containerRef} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
                id="job-search-input"
                type="text"
                placeholder="Search jobs, titles, companies..."
                className="w-full px-4 py-3 pl-12 pr-10 bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-xl font-medium text-slate-100 placeholder-slate-500 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-indigo-500/40 hover:bg-slate-800/80"
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
            />
            {value && (
                <button
                    onClick={() => { onChange(''); setSuggestions([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors bg-slate-800 hover:bg-slate-700 p-1 rounded-md"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                    {/* Header */}
                    <div className="autocomplete-header">
                        <Sparkles className="w-3 h-3" style={{ color: 'rgba(99,102,241,0.8)' }} />
                        <span className="autocomplete-header-label">Suggestions</span>
                    </div>

                    {/* Items */}
                    <div className="autocomplete-list">
                        {suggestions.map((s, i) => (
                            <button
                                key={s}
                                className={`autocomplete-item ${i === activeIdx ? 'autocomplete-item-active' : ''}`}
                                onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                                onMouseEnter={() => setActiveIdx(i)}
                            >
                                <span className="autocomplete-item-icon">
                                    <Search className="w-3.5 h-3.5" />
                                </span>
                                <span className="autocomplete-item-text">
                                    {highlight(s, value)}
                                </span>
                                <span className="autocomplete-item-arrow">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Footer hints */}
                    <div className="autocomplete-footer">
                        <span className="autocomplete-footer-hint">
                            <kbd className="autocomplete-kbd">↑↓</kbd> navigate
                            <span style={{ margin: '0 4px', opacity: 0.3 }}>·</span>
                            <kbd className="autocomplete-kbd">↵</kbd> select
                            <span style={{ margin: '0 4px', opacity: 0.3 }}>·</span>
                            <kbd className="autocomplete-kbd">esc</kbd> close
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

