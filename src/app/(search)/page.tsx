'use client';

import { useState, useEffect } from 'react';
import { fetchMarketCheeseComplexData } from '@/app/actions/forexActions';
import { calculateSignal, ALL_SYMBOLS } from '@/lib/forexUtils';
import { 
  Loader2, 
  TrendingUp, 
  RefreshCw, 
} from 'lucide-react';
import SkeletonCard from '@/components/SkeletonCard';
import FilterButton from '@/components/FilterButton';
import ResultCard from '@/components/ResultCard';
import dynamic  from 'next/dynamic';
// import Graph from '@/components/Graph';


const Graph = dynamic(() => import('@/components/Graph'), { 
  ssr: false 
});

export default function ProfessionalForexDashboard() {
  // Состояния для UI

  const [isLoaded, setIsLoaded] = useState(false);
  
  // Данные
  const [allPairs, setAllPairs] = useState<any[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const [loadingSymbols, setLoadingSymbols] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState("");

  const [filter, setFilter] = useState<'ALL' | 'SIGNALS' | 'NEUTRAL'>('ALL');

  const [isMounted, setIsMounted] = useState(false);
  
    useEffect(() => {
      setIsMounted(true);
    }, []);
  
  // 1. Инициализация (Загрузка из памяти и API)
  useEffect(() => {
    function init() {
      
      setAllPairs(ALL_SYMBOLS);

      // Загружаем настройки пользователя
      const savedPairs = localStorage.getItem('selected_forex_pairs');

      if (savedPairs) setSelectedPairs(JSON.parse(savedPairs));
      else setSelectedPairs(['EUR/USD']);

      
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

      // 3. Чтобы избежать мерцания пустого интерфейса, можно вернуть null или скелетон
    if (!isMounted) return null;
  

  // Обработчик запроса данных
  const handleFetch = async () => {
  if (isProcessing) return;
  setIsProcessing(true);
  
  // const config = getAppConfig();
  setLoadingSymbols(selectedPairs);
  const updatedResults = [...results];

  for (let i = 0; i < selectedPairs.length; i++) {
    const symbol = selectedPairs[i];
    // const cached = getCachedData(symbol);
      const cached = null
    
  
       const data = await fetchMarketCheeseComplexData(symbol, false);
       console.log(`Данные для ${symbol}:`, data);
      
      
      if (!data.error) {
        // Помечаем данные как новые
        const dataWithStatus = { ...data, isCached: false };
        // setCachedData(symbol, data);
        
        const idx = updatedResults.findIndex(r => r.symbol === symbol);
        if (idx > -1) updatedResults[idx] = dataWithStatus;
        else updatedResults.push(dataWithStatus);
        
        setResults([...updatedResults]);
      }
      
      setLoadingSymbols(prev => prev.filter(s => s !== symbol));

      // Задержка только после реального запроса к API
      if (i < selectedPairs.length - 1) {
        // await delay(config.apiInterval * 1000); 
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
            <p className="text-right text-slate-500 text-sm font-medium">Поиск сигналов</p>
          </div>
          
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Левая панель: Инструменты */}
          <aside className="lg:col-span-12 xl:col-span-12 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
              <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-[0.2em]">Выбор пар</h2>

              {/* Списки пар */}
              <div className='flex flex-col  lg:flex-row gap-8 '>
              <div className="space-y-4">
                <div className="flex xl:justify-between flex-wrap gap-2">
                  {allPairs.map(symbol => (
                    <button 
                      disabled={symbol === 'CHF/JPY' || symbol === 'EUR/NZD'} // Пример блокировки пары
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
              <div className="h-min">
              <button 
                onClick={handleFetch}
                disabled={isProcessing || selectedPairs.length === 0}
                className="w-max h-min bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white p-2 px-4 rounded-xl text-xs tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw size={18}/> }<>НАЙТИ СИГНАЛЫ</>
              </button>
              </div>
              </div>

            </div>
          </aside>

         {/* Правая панель: Результаты */}
          <section className="lg:col-span-12 xl:col-span-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Результаты анализа ({results.length})
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResults.map((data) => (
                <button key={data.symbol} onClick={() => setIsSettingsOpen(data.symbol.replace('/', ''))} className="w-full cursor-pointer">
                <ResultCard key={data.symbol} data={data} loadingSymbols={loadingSymbols} />
                </button>
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
        </div>
        {isSettingsOpen && <Graph symbol={isSettingsOpen} onClose={() => setIsSettingsOpen('')} />}
      </div>
    </main>
  );
}