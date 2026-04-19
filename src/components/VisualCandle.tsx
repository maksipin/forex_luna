// src/components/VisualCandle.tsx

interface VisualCandleProps {
  open: number;
  high: number;
  low: number;
  close: number;
  height?: number;
}

// src/components/VisualCandle.tsx
export default function VisualCandle({ open, high, low, close, height = 120 }: any) {
  const isGreen = close >= open;
  const range = high - low;
  const getPos = (val: number) => ((high - val) / range) * 100;

  const bodyTop = getPos(Math.max(open, close));
  const bodyBottom = getPos(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

  return (
    <div className="relative flex flex-col items-center" style={{ height: `${height}px`, width: '32px' }}>
      {/* Фитиль: темный для светлой темы, светлый для темной */}
      <div className="absolute w-[1.5px] h-full bg-slate-300 dark:bg-slate-600 rounded-full" />
      
      <div 
        className={`absolute w-5 rounded-sm border ${
          isGreen 
            ? 'bg-emerald-500 border-emerald-600 dark:border-emerald-400 shadow-sm' 
            : 'bg-red-500 border-red-600 dark:border-red-400 shadow-sm'
        }`}
        style={{ top: `${bodyTop}%`, height: `${bodyHeight}%` }}
      />
    </div>
  );
}