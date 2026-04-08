export default function BarChart({ data, colorFn }: {
  data: { label: string; count: number; color?: string }[];
  colorFn?: (item: { label: string; count: number; color?: string }) => string;
}) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-5 pt-2">
      {data.map(item => {
        const barBg = colorFn ? colorFn(item) : item.color || '#6366f1';
        const pct = (item.count / max) * 100;
        return (
          <div key={item.label} className="flex items-center gap-4 group">
            <span className="text-sm font-bold text-slate-400 w-28 truncate flex-shrink-0 text-right capitalize tracking-wide group-hover:text-slate-200 transition-colors">{item.label}</span>
            <div className="flex-1 h-7 bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800 shadow-inner relative">
              <div
                className="h-full rounded-xl transition-all duration-1000 flex items-center relative"
                style={{
                  width: `${pct}%`,
                  background: barBg,
                  boxShadow: `0 0 16px ${barBg}50, inset 0 1px 0 rgba(255,255,255,0.15)`
                }}
              >
                {pct > 15 && (
                  <span className="absolute left-3 text-[11px] font-black text-white drop-shadow-md">
                    {item.count.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {pct <= 15 && (
              <span className="text-xs font-black text-slate-400 w-10 text-left tabular-nums">{item.count.toLocaleString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
