import { formatCandleHour } from "@/lib/forexUtils";
import CandleWithLabel from "./CandleWithLabel";
import { Candle, CombinedSymbolData } from "@/app/actions/forexActions";
import { SYMBOLS_WITH_INFO } from "@/consts/consts";

export default function ResultCard({ data, loadingSymbols }: { data: CombinedSymbolData; loadingSymbols: string[] }) {
  const signal = data.signal
  const {atr, rsi, bollingerBands, macd, ema20, ema50, ema200} = data.hourly[1]
  const tp = atr < 0.01 ? (atr * 100000).toFixed(0) : (atr * 1000).toFixed(0)

  const swap = SYMBOLS_WITH_INFO.find((s) => s.symbol === data.symbol)
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm relative overflow-hidden">
      {/* Тонкая полоска-индикатор сверху */}
      <div className={`absolute top-0 left-0 right-0 h-1 'bg-blue-500'`} />

      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col items-start">
          <span className="text-2xl font-black font-mono tracking-tighter text-slate-800 dark:text-white">
            {data.symbol}
          </span>
          {/* Метка источника данных */}
          <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${data.hasLevels ? 'text-amber-600 dark:text-amber-500/70' : 'text-blue-600 dark:text-blue-400'}`}>
            {loadingSymbols.includes(data.symbol) ? '● В очереди' : data.hasLevels ?'● Риск отскока' : '● Обновлено сейчас'}
          </span>
          {/* {data.hourly[data.hourly.length - 1]?.reversalSignal && (<>
            <span className="text-amber-600 dark:text-amber-500/70 text-[8px] font-bold uppercase tracking-widest mt-1">
              Обнаружен {data.hourly[data.hourly.length - 1].reversalSignal?.pattern}
            </span>
            <span className="text-amber-600 dark:text-amber-500/70 text-[8px] font-bold uppercase tracking-widest mt-1">
              надежность: {data.hourly[data.hourly.length - 1].reversalSignal?.reliability}, тип: {data.hourly[data.hourly.length - 1].reversalSignal?.type}
            </span>
            <span className="text-amber-600 dark:text-amber-500/70 text-[8px] font-bold uppercase tracking-widest mt-1">
            тип: 
            </span>
          </>)} */}
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

        { data.signal !== 'NEUTRAL' && swap && (<div className="mt-4 flex justify-between">
        <span className="text-[10px] text-slate-400  tracking-widest font-bold">
          Commission: {swap ? `${swap.commission}$` : 'N/A'}
        </span>
        <span className={`${ swap.spread > 40 ? 'text-amber-600 dark:text-amber-500/70' : 'text-green-600'} text-[10px]   tracking-widest font-bold`}>
          Spread: {swap ? `${swap.spread} pips` : 'N/A'}
        </span>
         <span className={`${(signal === 'BUY' && swap?.swap?.long < -6.0) || (signal === 'SELL' && swap?.swap?.short < -6.0) ? 'text-amber-600 dark:text-amber-500/70' : 'text-green-600'} text-[10px] tracking-widest font-bold`}>
          Swap: {data.signal === 'BUY' && swap ? `${swap.swap.long}$` : data.signal === 'SELL' && swap ? `${swap.swap.short}$` : 'N/A'}
        </span>
      </div>)}

      <div className="mt-4 flex justify-between">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          TP: {tp}
        </span>
       { !!macd.macdLine && !!macd.signalLine && (<span className={`${(signal === 'BUY' && macd.macdLine > macd.signalLine) || (signal === 'SELL' && macd.macdLine < macd.signalLine) ?  'text-green-600' : 'text-amber-600 dark:text-amber-500/70'} text-[10px]  uppercase tracking-widest font-bold`}>
          MACD 
        </span>)}
        <span title={`RSI: ${rsi}`} className={`${(signal === 'BUY' && rsi > 50 && rsi < 70) || (signal === 'SELL' && rsi > 35 && rsi < 50) ? 'text-green-600' : 'text-amber-600 dark:text-amber-500/70'} text-[10px]  uppercase tracking-widest font-bold`}>
          RSI
        </span>
         <span title={`EMA20: ${ema20.toFixed(5)}, EMA50: ${ema50.toFixed(5)}, EMA200: ${ema200.toFixed(5)}`} className={`${(signal === 'BUY' && ema20 > ema50 && ema50 > ema200 ) || (signal === 'SELL' && ema20 < ema50 && ema50 < ema200) ?  'text-green-600' : 'text-amber-600 dark:text-amber-500/70'} text-[10px] uppercase tracking-widest font-bold`}>
          EMA 
        </span>
         {/* <span className={`${(signal === 'BUY' && ema20 > ema50 && ema50 > ema200 ) || (signal === 'SELL' && ema20 < ema50 && ema50 < ema200) ?  'text-green-600' : 'text-amber-600 dark:text-amber-500/70'} text-[10px] uppercase tracking-widest font-bold`}>
          EMA 50: {ema50.toFixed(5)}
        </span>
         <span className={`${(signal === 'BUY' && ema20 > ema50 && ema50 > ema200) || (signal === 'SELL' && ema20 < ema50 && ema50 < ema200) ? 'text-green-600' : 'text-amber-600 dark:text-amber-500/70'} text-[10px] uppercase tracking-widest font-bold`}>
          EMA 200: {ema200.toFixed(5)}
        </span> */}
      </div>
    </div>
  );
}