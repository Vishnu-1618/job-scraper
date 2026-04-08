"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

interface ResumeUploadProps {
    userId: string | null;
    onUploadComplete?: () => void;
}

export function ResumeUpload({ userId, onUploadComplete }: ResumeUploadProps) {
    const { setActiveResumeId } = useStore();
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('Upload failed. Retry?');

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setStatus('idle');

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            if (userId) {
                formData.append('userId', userId);
            }

            // Use the API route instead of direct Supabase client to bypass RLS
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload success:', data);

            // Give a success state, then close the panel after a short delay
            setStatus('success');
            
            // Set active resume ID in store to trigger filtering
            setActiveResumeId(data.resume?.id || userId || 'active');

            if (onUploadComplete) {
                setTimeout(() => {
                    onUploadComplete();
                }, 2000);
            }

            // The backend resume-worker handles matching automatically.
            // No need to trigger scraping here — it searches existing DB first.

        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Upload failed. Retry?');
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] bg-slate-900/80 backdrop-blur-xl text-slate-100 overflow-hidden relative ring-1 ring-indigo-500/10 group hover:ring-indigo-500/30 transition-all rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8 blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-tr-full -ml-8 -mb-8 blur-2xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

            <CardHeader className="pb-2 relative z-10 p-6 md:p-8">
                <CardTitle className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-tight drop-shadow-sm">
                    <div className="p-2.5 bg-slate-800 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    AI Resume MatchMaker
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 px-6 pb-6 md:px-8 md:pb-8">
                <div className="space-y-6">
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                        Upload your resume and JobRadar AI will instantly surface the most relevant job matches from thousands of listings — no waiting, no searching.
                    </p>

                    <div className="relative group/upload">
                        <label
                            htmlFor="resume-upload"
                            className={`
                                flex flex-col items-center justify-center w-full min-h-[200px] 
                                border border-dashed border-indigo-500/30 rounded-2xl 
                                cursor-pointer bg-slate-800/50 hover:bg-slate-800/80 
                                hover:border-indigo-400/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]
                                transition-all duration-300
                                ${uploading ? 'opacity-50 cursor-not-allowed border-indigo-500/50 bg-slate-800/80' : ''}
                            `}
                        >
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${uploading ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-700/50 border border-slate-600/50 group-hover/upload:bg-slate-700 group-hover/upload:border-indigo-500/40 group-hover/upload:-translate-y-1'}`}>
                                    <Upload className={`w-8 h-8 ${uploading ? 'text-indigo-400 animate-bounce' : 'text-slate-400 group-hover/upload:text-indigo-300'} transition-colors`} />
                                </div>
                                <p className="mb-2 text-lg text-slate-300 font-medium">
                                    <span className="text-indigo-400 font-bold group-hover/upload:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all">Select a file</span> or drag and drop here
                                </p>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">PDF or DOCX up to 5MB</p>
                            </div>
                            <input
                                id="resume-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {uploading && (
                        <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/80 rounded-xl text-indigo-300 font-bold border border-indigo-500/20 shadow-inner">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            Analyzing deep structure...
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl text-emerald-400 font-bold border border-emerald-500/20 shadow-[inset_0_1px_10px_rgba(16,185,129,0.05)] animate-slide-up">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <span>Resume analyzed! Matching you with the best jobs now...</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col gap-2 p-4 bg-rose-500/10 rounded-xl text-rose-300 border border-rose-500/20 animate-slide-up">
                            <div className="flex items-center gap-2 font-black text-rose-400">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>Processing Failed</span>
                            </div>
                            <span className="text-sm font-medium opacity-90">{errorMessage}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
