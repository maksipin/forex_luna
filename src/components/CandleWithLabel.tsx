import VisualCandle from "./VisualCandle";

export default function CandleWithLabel({ label, data }: { label: string, data: any }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-200/50 dark:bg-slate-800 px-2 py-1 rounded-md">
        {label}
      </span>
      {data ? (
        <VisualCandle 
          height={80} 
          open={+data.open} 
          high={+data.high} 
          low={+data.low} 
          close={+data.close} 
        />
      ) : (
        <div className="h-20 flex items-center text-[10px] text-slate-300 italic">No data</div>
      )}
    </div>
  );
}