export default function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
        active ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon} {label}
    </button>
  );
}