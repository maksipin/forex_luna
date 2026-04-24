import { calculateSignal, formatCandleHour } from "@/lib/forexUtils";
import CandleWithLabel from "./CandleWithLabel";

export default function ResultCard({ data, loadingSymbols }: { data: any; loadingSymbols: string[] }) {
  const signal = calculateSignal(data);
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm relative overflow-hidden">
      {/* Тонкая полоска-индикатор сверху */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${data.isCached ? 'bg-amber-400/50' : 'bg-blue-500'}`} />

      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <span className="text-2xl font-black font-mono tracking-tighter text-slate-800 dark:text-white">
            {data.symbol}
          </span>
          {/* Метка источника данных */}
          <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${data.isCached ? 'text-amber-600 dark:text-amber-500/70' : 'text-blue-600 dark:text-blue-400'}`}>
            {loadingSymbols.includes(data.symbol) ? '● В очереди' : data.isCached ? '● Из кэша (20м)' : '● Обновлено сейчас'}
          </span>
        </div>
        
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] shadow-sm ${
          signal === 'BUY' ? 'bg-emerald-500 text-white' : 
          signal === 'SELL' ? 'bg-red-500 text-white' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          {signal}
        </div>
      </div>
      
      <div className="flex justify-between items-end bg-slate-50 dark:bg-black/40 p-6 px-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 h-44 relative">
        {/* Дневная свеча */}
        <CandleWithLabel label="Daily" data={data.daily} />
        
        <div className="w-px h-20 bg-slate-200 dark:bg-slate-800 self-center" />
        
        {/* Часовые свечи с динамическими метками времени */}
        <div className="flex gap-2">
          {data.hourly?.map((h: any, i: number) => (
            <CandleWithLabel 
              key={h.datetime}
              label={formatCandleHour(h.datetime)} 
              data={h} 
            />
          ))}
        </div>
      </div>

      {/* Маленькая подпись о свежести данных под графиком */}
      <div className="mt-4 flex justify-end">
        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
          Data cached & verified
        </span>
      </div>
    </div>
  );
}