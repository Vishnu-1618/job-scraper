import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export default function StatCard({ title, value, icon, trend, trendUp, colorClass = 'text-white' }: StatCardProps) {
  // Extract the color name to use dynamically in glows
  const colorBase = colorClass.split('-')[1] || 'white';

  return (
    <div className="relative group bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden transition-all duration-500 hover:border-indigo-400/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] h-full flex flex-col justify-between">
      {/* Abstract Top Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Animated Glowing Background Matrix */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
      
      {/* Dynamic Radial Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700 opacity-50 group-hover:opacity-100 pointer-events-none" />

      {/* Top Row: Icon + Trend */}
      <div className="flex items-start justify-between mb-6 relative z-10 w-full">
        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center bg-slate-800/80 border border-indigo-500/20 shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)] group-hover:scale-105 transition-transform duration-500 ${colorClass}`}>
          <div className="relative z-10">{icon}</div>
        </div>

        {trend && (
          <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[8px] backdrop-blur-md shadow-sm transition-colors ${trendUp
            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 group-hover:bg-teal-500/20'
            : 'bg-slate-800/80 border border-slate-700 text-slate-400 group-hover:bg-slate-800'
            }`}>
            <span className="">{trendUp ? '↑' : '↓'}</span>
            {trend}
          </span>
        )}
      </div>

      {/* Bottom Row: Text + Value */}
      <div className="relative z-10 mt-auto w-full">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">
          {title}
        </p>
        <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-sm transition-all leading-none">
          {value}
        </h3>
      </div>
    </div>
  );
}
