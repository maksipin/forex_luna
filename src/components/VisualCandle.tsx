// src/components/VisualCandle.tsx
import React from 'react';

interface VisualCandleProps {
  open: number;
  high: number;
  low: number;
  close: number;
  height?: number;
}

export default function VisualCandle({ open, high, low, close, height = 160 }: VisualCandleProps) {
  const isGreen = close >= open;
  const range = high - low;

  // Функция для определения позиции в % от верхнего края
  const getPos = (val: number) => ((high - val) / range) * 100;

  const bodyTop = getPos(Math.max(open, close));
  const bodyBottom = getPos(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1); // Минимум 1% для видимости

  // Форматирование цены (5 знаков после запятой для Forex)
  const f = (val: number) => val.toFixed(5);

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative flex justify-center" 
        style={{ height: `${height}px`, width: '100px' }} // Увеличили ширину для подписей
      >
        {/* --- ФИТИЛЬ --- */}
        <div className="absolute w-[1px] h-full bg-slate-300 dark:bg-slate-700" />

        {/* --- ПОДПИСИ MAX / MIN (ТЕНИ) --- */}
        <span className="absolute top-0 text-[9px] font-mono font-bold text-slate-400 -translate-y-4">
          {f(high)}
        </span>
        <span className="absolute bottom-0 text-[9px] font-mono font-bold text-slate-400 translate-y-4">
          {f(low)}
        </span>

        {/* --- ТЕЛО СВЕЧИ --- */}
        <div 
          className={`absolute w-6 rounded-sm border-x shadow-sm transition-colors duration-500 ${
            isGreen 
              ? 'bg-emerald-500/90 border-emerald-600 dark:border-emerald-400' 
              : 'bg-red-500/90 border-red-600 dark:border-red-400'
          }`}
          style={{ top: `${bodyTop}%`, height: `${bodyHeight}%` }}
        >
          {/* --- ПОДПИСИ OPEN / CLOSE (У КРАЕВ ТЕЛА) --- */}
          {/* Цена сверху тела */}
          <span className={`absolute left-6 top-[-10px] text-[10px] font-mono whitespace-nowrap ${isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isGreen ? f(close) : f(open)}
          </span>

          {/* Цена снизу тела */}
          <span className={`absolute left-6 bottom-[-10px] text-[10px] font-mono whitespace-nowrap ${isGreen ? 'text-emerald-700/70 dark:text-emerald-500/70' : 'text-red-700/70 dark:text-red-500/70'}`}>
             {isGreen ? f(open) : f(close)}
          </span>
        </div>
      </div>
    </div>
  );
}