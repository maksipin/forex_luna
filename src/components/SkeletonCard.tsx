// src/components/SkeletonCard.tsx
import { Timer } from 'lucide-react';

export default function SkeletonCard({ symbol }: { symbol: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-7 shadow-sm opacity-60">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <span className="text-2xl font-black font-mono tracking-tighter text-slate-300 dark:text-slate-700">
            {symbol}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
            <Timer size={10} className="animate-spin" /> Ожидание очереди...
          </span>
        </div>
        <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
      </div>
      
      <div className="bg-slate-50/50 dark:bg-black/10 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800 h-44 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full animate-bounce" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Запрос будет отправлен скоро</span>
      </div>
    </div>
  );
}