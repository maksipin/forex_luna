import { formatCandleHour } from "@/lib/forexUtils";
import CandleWithLabel from "./CandleWithLabel";
import { Candle, CombinedSymbolData } from "@/app/actions/forexActions";

export default function ResultCard({ data, loadingSymbols }: { data: CombinedSymbolData; loadingSymbols: string[] }) {
  const signal = data.signal
  const {atr, rsi, bollingerBands, macd, ema20, ema50, ema200} = data.hourly[1]
  const tp = atr < 0.01 ? (atr * 100000).toFixed(0) : (atr * 1000).toFixed(0)
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm relative overflow-hidden">
      {/* Тонкая полоска-индикатор сверху */}
      <div className={`absolute top-0 left-0 right-0 h-1 'bg-blue-500'`} />

      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <span className="text-2xl font-black font-mono tracking-tighter text-slate-800 dark:text-white">
            {data.symbol}
          </span>
          {/* Метка источника данных */}
          <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${data.hasLevels ? 'text-amber-600 dark:text-amber-500/70' : 'text-blue-600 dark:text-blue-400'}`}>
            {loadingSymbols.includes(data.symbol) ? '● В очереди' : data.hasLevels ?'● Риск отскока' : '● Обновлено сейчас'}
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
          {data.hourly?.map((h: Candle, i: number) => (
            <CandleWithLabel 
              key={h.fullTimeStr}
              label={formatCandleHour(h.fullTimeStr)} 
              data={h} 
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          TP: {tp}
        </span>
        <span className={`${(signal === 'BUY' && rsi > 70) || (signal === 'SELL' && rsi < 30) ? 'text-red-800' : 'text-green-700'} text-[10px]  uppercase tracking-widest font-bold`}>
          RSI: {rsi}
        </span>
         <span className={`${(signal === 'BUY' && ema20 > data.hourly[1].close) || (signal === 'SELL' && ema20 < data.hourly[1].close) ? 'text-red-800' : 'text-green-700'} text-[10px] uppercase tracking-widest font-bold`}>
          EMA 20: {ema20.toFixed(5)}
        </span>
      </div>
    </div>
  );
}