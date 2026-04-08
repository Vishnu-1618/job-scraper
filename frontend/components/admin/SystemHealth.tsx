"use client";

import { Activity, Cpu, HardDrive, Network } from 'lucide-react';

interface HealthGaugeProps {
  title: string;
  max: number;
  current: number;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
  glowColor: string;
}

function HealthGauge({ title, max, current, unit, icon, colorClass }: HealthGaugeProps) {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="flex flex-col gap-5 group/gauge">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-800/50 border border-white/5 ${colorClass}`}>
            {icon}
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/gauge:text-slate-400 transition-colors">{title}</span>
        </div>
        <span className="text-[10px] font-black text-white/50">{current}{unit}</span>
      </div>
      
      <div className="relative h-2.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 p-[2px]">
        <div 
          className="absolute inset-y-[2px] left-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          style={{ width: `calc(${percentage}% - 4px)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default function SystemHealth() {
  return (
    <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all duration-500 hover:border-indigo-500/30 flex flex-col h-full shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      {/* Dynamic Background Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] group-hover:bg-indigo-600/10 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Infrastructure</h3>
            <p className="text-xl font-black text-white tracking-tight">System Health</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 relative z-10 flex-1">
        <HealthGauge
          title="Worker Threads"
          max={10}
          current={4}
          unit=""
          icon={<Cpu className="w-4 h-4" />}
          colorClass="text-slate-300"
          glowColor="rgba(99,102,241,0.2)"
        />
        <HealthGauge
          title="Queue Status"
          max={100}
          current={2}
          unit=" jobs"
          icon={<Network className="w-4 h-4" />}
          colorClass="text-slate-300"
          glowColor="rgba(99,102,241,0.2)"
        />
        <HealthGauge
          title="Database"
          max={500}
          current={142}
          unit="MB"
          icon={<HardDrive className="w-4 h-4" />}
          colorClass="text-slate-300"
          glowColor="rgba(99,102,241,0.2)"
        />
      </div>
    </div>
  );
}
