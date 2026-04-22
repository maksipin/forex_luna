'use client';

import { useState, useEffect, useTransition } from 'react';
import { analyzeMajorForexSignals, fetchComplexSymbolData, fetchForexPairs } from './actions/forexActions';
import { MAJORS, CROSSES, calculateSignal, delay, getCachedData, setCachedData, getAppConfig, ALL_SYMBOLS } from '@/lib/forexUtils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Loader2, 
  Zap, 
  Layers, 
  Search, 
  TrendingUp, 
  RefreshCw, 
  Save, 
  SettingsIcon
} from 'lucide-react';
import SkeletonCard from '@/components/SkeletonCard';
import SettingsModal from '@/components/SettingsModal';
import FilterButton from '@/components/FilterButton';
import ResultCard from '@/components/ResultCard';
import TabButton from '@/components/TabButton';

export default function ProfessionalForexDashboard() {
  // Состояния для UI
  const [activeTab, setActiveTab] = useState<'fx' | 'majors' | 'crosses' | 'search'>('majors');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Данные
  const [allPairs, setAllPairs] = useState<any[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const [loadingSymbols, setLoadingSymbols] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [filter, setFilter] = useState<'ALL' | 'SIGNALS' | 'NEUTRAL'>('ALL');

  const handleStartAnalysis = async () => {
    setIsProcessing(true);
    const signals = await analyzeMajorForexSignals('USD/CHF');
    console.log('Полученные сигналы:', signals);
    setIsProcessing(false);
  }

  // 1. Инициализация (Загрузка из памяти и API)
  useEffect(() => {
    async function init() {
      // Загружаем список всех пар для поиска
      const pairs = await fetchForexPairs();
      setAllPairs(pairs);

      // Загружаем настройки пользователя
      const savedPairs = localStorage.getItem('selected_forex_pairs');
      const savedResults = localStorage.getItem('last_analysis_results');

      if (savedPairs) setSelectedPairs(JSON.parse(savedPairs));
      else setSelectedPairs(['EUR/USD']);

      if (savedResults) setResults(JSON.parse(savedResults));
      
      setIsLoaded(true);
    }
    init();
  }, []);

  // 2. Сохранение выбранных пар при изменении
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('selected_forex_pairs', JSON.stringify(selectedPairs));
    }
  }, [selectedPairs, isLoaded]);
  

  // Обработчик запроса данных
  const handleFetch = async () => {
  if (isProcessing) return;
  setIsProcessing(true);
  
  const config = getAppConfig();
  setLoadingSymbols(selectedPairs);
  const updatedResults = [...results];

  for (let i = 0; i < selectedPairs.length; i++) {
    const symbol = selectedPairs[i];
    const cached = getCachedData(symbol);
    
    if (cached) {
      // Помечаем данные как кэшированные
      const dataWithStatus = { ...cached, isCached: true };
      
      const idx = updatedResults.findIndex(r => r.symbol === symbol);
      if (idx > -1) updatedResults[idx] = dataWithStatus;
      else updatedResults.push(dataWithStatus);
      
      setResults([...updatedResults]);
      setLoadingSymbols(prev => prev.filter(s => s !== symbol));
      // Если данные из кэша, задержка не нужна, идем к следующей паре
    } else {
      const data = await fetchComplexSymbolData(symbol, true);
      
      
      if (!data.error) {
        // Помечаем данные как новые
        const dataWithStatus = { ...data, isCached: false };
        setCachedData(symbol, data);
        
        const idx = updatedResults.findIndex(r => r.symbol === symbol);
        if (idx > -1) updatedResults[idx] = dataWithStatus;
        else updatedResults.push(dataWithStatus);
        
        setResults([...updatedResults]);
      }
      
      setLoadingSymbols(prev => prev.filter(s => s !== symbol));

      // Задержка только после реального запроса к API
      if (i < selectedPairs.length - 1) {
        await delay(config.apiInterval * 1000); 
      }
    }
  }
  setIsProcessing(false);
};

  const togglePair = (symbol: string) => {
    setSelectedPairs(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredResults = results.filter(data => {
  const signal = calculateSignal(data);
  if (filter === 'SIGNALS') return signal === 'BUY' || signal === 'SELL';
  if (filter === 'NEUTRAL') return signal === 'NEUTRAL';
  return true; // ALL
});

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0e14] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-200 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Хедер */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <TrendingUp className="text-blue-500" /> FOREX LUNA
            </h1>
            <p className="text-slate-500 text-sm font-medium">Анализ японских свечей и сигналы</p>
          </div>
          <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all"
          >
            <SettingsIcon size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <ThemeToggle />
        </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Левая панель: Инструменты */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-6 tracking-[0.2em]">Выбор пар</h2>
              
              {/* Вкладки */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-6">
                <TabButton active={activeTab === 'fx'} onClick={() => setActiveTab('fx')} icon={<Zap size={14}/>} label="FX" />
                <TabButton active={activeTab === 'majors'} onClick={() => setActiveTab('majors')} icon={<Zap size={14}/>} label="Majors" />
                <TabButton active={activeTab === 'crosses'} onClick={() => setActiveTab('crosses')} icon={<Layers size={14}/>} label="Cross" />
                <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={14}/>} label="All" />
              </div>

              {/* Списки пар */}
              <div className="space-y-4 min-h-[200px]">
                {activeTab === 'search' && (
                  <input 
                    type="text" 
                    placeholder="Поиск (напр. BTC/USD)..."
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 ring-blue-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                )}

                <div className="flex flex-wrap gap-2">
                  {(activeTab === 'fx' ? ALL_SYMBOLS : activeTab === 'majors' ? MAJORS : activeTab === 'crosses' ? CROSSES :
                    allPairs.filter(p => p.symbol.includes(searchQuery.toUpperCase())).slice(0, 12).map(p => p.symbol)
                  ).map(symbol => (
                    <button 
                      key={symbol}
                      onClick={() => togglePair(symbol)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                        selectedPairs.includes(symbol)
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-400'
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопка запуска */}
              <button 
                onClick={handleFetch}
                disabled={isPending || selectedPairs.length === 0}
                className="w-full mt-8 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10"
              >
                {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><RefreshCw size={18}/> ОБНОВИТЬ ЦЕНЫ</>}
              </button>

              <button 
                onClick={handleStartAnalysis}
                disabled={isPending || selectedPairs.length === 0}
                className="w-full mt-8 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10"
              >
                {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><RefreshCw size={18}/> Анализ пары</>}
              </button>
            </div>
          </aside>

         {/* Правая панель: Результаты */}
<section className="lg:col-span-8 xl:col-span-8">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
      Результаты анализа ({filteredResults.length})
    </h2>

    {/* Переключатель фильтров */}
    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
      <FilterButton 
        active={filter === 'ALL'} 
        onClick={() => setFilter('ALL')} 
        label="Все" 
      />
      <FilterButton 
        active={filter === 'SIGNALS'} 
        onClick={() => setFilter('SIGNALS')} 
        label="Сигналы" 
        count={results.filter(r => calculateSignal(r) !== 'NEUTRAL').length}
        color="text-emerald-500"
      />
      <FilterButton 
        active={filter === 'NEUTRAL'} 
        onClick={() => setFilter('NEUTRAL')} 
        label="Neutral" 
      />
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {filteredResults.map((data) => (
      <ResultCard key={data.symbol} data={data} loadingSymbols={loadingSymbols} />
    ))}
    
    {/* Состояние "Ничего не найдено" */}
    {filteredResults.length === 0 && results.length > 0 && (
      <div className="col-span-full py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center">
        <p className="text-slate-400 font-medium italic">Нет результатов, подходящих под выбранный фильтр</p>
      </div>
    )}

    {/* Скелетоны (те, что еще грузятся, всегда внизу) */}
    {loadingSymbols
      .filter(s => !results.find(r => r.symbol === s))
      .map(symbol => (
        <SkeletonCard key={symbol} symbol={symbol} />
      ))
    }
  </div>
</section>
         <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      </div>
    </main>
  );
}