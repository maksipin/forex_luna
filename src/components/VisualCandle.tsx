// src/components/VisualCandle.tsx

interface VisualCandleProps {
  open: number;
  high: number;
  low: number;
  close: number;
  height?: number;
}

export default function VisualCandle({ open, high, low, close, height = 120 }: VisualCandleProps) {
  const isGreen = close >= open;
  const range = high - low;
  
  // Расчет позиции в % относительно High/Low
  const getPos = (val: number) => ((high - val) / range) * 100;

  const bodyTop = getPos(Math.max(open, close));
  const bodyBottom = getPos(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 2); // Минимум 2% для видимости

  return (
    <div className="relative flex flex-col items-center" style={{ height: `${height}px`, width: '40px' }}>
      {/* Фитиль (Wick) */}
      <div className="absolute w-[2px] h-full bg-slate-600 rounded-full" />
      
      {/* Тело (Body) */}
      <div 
        className={`absolute w-6 rounded-sm border ${
          isGreen 
            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
            : 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
        }`}
        style={{
          top: `${bodyTop}%`,
          height: `${bodyHeight}%`
        }}
      />
    </div>
  );
}