import { Candle } from '@/app/actions/forexActions';

interface CandleCardProps {
  candle: Candle;
  title: string;
  isCompact?: boolean;
}

export default function CandleCard({ candle, title, isCompact = false }: CandleCardProps) {
  const isBullish = parseFloat(candle.close) >= parseFloat(candle.open);
  
  // Форматирование даты
  const dateObj = new Date(candle.datetime);
  const formattedDate = isCompact 
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' });

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 border ${isBullish ? 'border-emerald-900/50' : 'border-red-900/50'}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-slate-400 tracking-wider uppercase">{title}</h4>
        <span className="text-xs text-slate-500 font-mono">{formattedDate}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono">
        <div className="text-2xl font-semibold col-span-2 mb-1" style={{ color: isBullish ? '#10b981' : '#ef4444' }}>
          {parseFloat(candle.close).toFixed(5)}
        </div>
        
        <DataField label="O" value={parseFloat(candle.open).toFixed(5)} />
        <DataField label="H" value={parseFloat(candle.high).toFixed(5)} />
        <DataField label="L" value={parseFloat(candle.low).toFixed(5)} />
        {/* close уже выведен крупно */}
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}