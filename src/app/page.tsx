// src/app/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { fetchComplexSymbolData, fetchForexPairs } from './actions/forexActions';
import { MAJORS, CROSSES, calculateSignal } from '@/lib/forexUtils';
import VisualCandle from '@/components/VisualCandle';
import { Loader2, Search, Zap, Layers } from 'lucide-react';

export default function ProfessionalForexDashboard() {
  const [activeTab, setActiveTab] = useState<'majors' | 'crosses' | 'search'>('majors');
  const [allPairs, setAllPairs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairs, setSelectedPairs] = useState<string[]>(['EUR/USD']);
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchForexPairs().then(setAllPairs);
  }, []);

  const togglePair = (symbol: string) => {
    setSelectedPairs(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const handleFetch = () => {
    startTransition(async () => {
      // Чтобы не "повесить" бесплатный API, запрашиваем пары последовательно или небольшими пачками
      const data = [];
      for (const s of selectedPairs) {
        const res = await fetchComplexSymbolData(s);
        data.push(res);
      }
      setResults(data);
    });
  };

  // Логика отображения кнопок выбора
  const renderPairsSelectors = () => {
    let list: string[] = [];
    if (activeTab === 'majors') list = MAJORS;
    else if (activeTab === 'crosses') list = CROSSES;
    else if (activeTab === 'search') {
      return (
        <div className="w-full space-y-4">
          <input 
            type="text" 
            placeholder="Поиск по тикеру (напр. USD/TRY)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm focus:border-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {allPairs
              .filter(p => p.symbol.includes(searchQuery.toUpperCase()))
              .slice(0, 10)
              .map(p => (
                <PairButton key={p.symbol} symbol={p.symbol} selected={selectedPairs.includes(p.symbol)} onClick={() => togglePair(p.symbol)} />
              ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {list.map(symbol => (
          <PairButton key={symbol} symbol={symbol} selected={selectedPairs.includes(symbol)} onClick={() => togglePair(symbol)} />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0e14] text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Фильтр Категорий */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl inline-flex mb-8">
          <TabButton active={activeTab === 'majors'} onClick={() => setActiveTab('majors')} icon={<Zap size={14}/>} label="Majors" />
          <TabButton active={activeTab === 'crosses'} onClick={() => setActiveTab('crosses')} icon={<Layers size={14}/>} label="Crosses" />
          <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={14}/>} label="All Pairs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Левая панель: Выбор */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <h2 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Инструменты</h2>
              {renderPairsSelectors()}
              
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 mb-2 uppercase">Выбрано: {selectedPairs.length}</p>
                <button 
                  onClick={handleFetch}
                  disabled={isPending || selectedPairs.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : 'АНАЛИЗ РЫНКА'}
                </button>
              </div>
            </section>
          </div>

          {/* Правая панель: Результаты */}
          <div className="lg:col-span-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((data, idx) => (
                  <ResultCard key={idx} data={data} />
                ))}
                {results.length === 0 && !isPending && (
                  <div className="col-span-full py-20 border-2 border-dashed border-slate-800 rounded-3xl text-center text-slate-600">
                    Выберите пары и нажмите кнопку для получения сигналов
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Вспомогательные мини-компоненты для чистоты кода
function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon} {label}
    </button>
  );
}

function PairButton({ symbol, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${selected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
    >
      {symbol}
    </button>
  );
}

function ResultCard({ data }: { data: any }) {
  const signal = calculateSignal(data);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xl font-mono font-bold tracking-tighter">{data.symbol}</span>
        <div className={`px-2 py-1 rounded text-[10px] font-black ${
          signal === 'BUY' ? 'bg-emerald-500 text-black' : 
          signal === 'SELL' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
        }`}>
          {signal}
        </div>
      </div>
      
      <div className="flex justify-between items-end bg-black/40 p-4 rounded-xl border border-white/5 h-32">
        <div className="text-center">
          <span className="text-[8px] text-slate-600 block mb-2">D1</span>
          {data.daily && <VisualCandle {...data.daily} height={60} open={+data.daily.open} high={+data.daily.high} low={+data.daily.low} close={+data.daily.close} />}
        </div>
        <div className="flex gap-4">
          {data.hourly?.map((h: any, i: number) => (
            <div key={i} className="text-center">
              <span className="text-[8px] text-slate-600 block mb-2">{i === 0 ? 'H1' : 'H1-1'}</span>
              <VisualCandle {...h} height={60} open={+h.open} high={+h.high} low={+h.low} close={+h.close} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}