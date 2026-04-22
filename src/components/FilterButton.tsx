export default function FilterButton({ active, onClick, label, count, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${
        active 
          ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-white shadow-inner' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 shadow-sm ${color || ''}`}>
          {count}
        </span>
      )}
    </button>
  );
}