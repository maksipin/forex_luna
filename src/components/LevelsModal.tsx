import { X } from "lucide-react";

export const LevelsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  keyLevels: any[]; // Здесь можно указать более конкретный тип, если он есть
  selectedPair: string;
}> = ({ isOpen, onClose, keyLevels, selectedPair }) => {
  if (!isOpen) return null;

  return  (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
    <div className="bg-[#161b22] border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="h-2 w-full bg-emerald-600"></div>
      <button 
        onClick={() => onClose()}
        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>
      
      <div className="p-8">
        <div className="mb-6">
          <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Анализ структуры</span>
          <h3 className="text-2xl font-bold text-gray-100">Ключевые уровни {selectedPair}</h3>
          <p className="text-gray-500 text-sm mt-1">Зоны с наибольшим скоплением объема и касаний</p>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {keyLevels.length > 0 ? (
            keyLevels.map((level, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-gray-800 rounded-xl hover:border-emerald-500/50 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-lg font-mono font-bold text-gray-200">{level.price}</span>
                  <div className="flex gap-2 mt-1">
                    {level.isPsychological && (
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                        Психологический
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                      Касаний: {level.touches}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Сила уровня</div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${Math.min(level.strength * 10, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{level.strength}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-600 italic">
              Уровни еще не рассчитаны. Запустите анализ.
            </div>
          )}
        </div>

        <button 
          onClick={() => onClose()}
          className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
)}