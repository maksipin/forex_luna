'use client';

import { useEffect, useState } from 'react';
import { 
  Play, 
  Filter, 
  Clock, 
  Target, 
  ArrowUpCircle, 
  ArrowDownCircle,
  X,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart,
  Layers
} from 'lucide-react';
import { analyzeMarketCheeseSignals } from '../actions/forexActions';
import { ALL_SYMBOLS } from '@/lib/forexUtils';
import Graph from '@/components/Graph';
import { LevelsModal } from '@/components/LevelsModal';


// Типизация для сигналов
export interface TradeSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: string;
  targetPrice: number;
  resultTime: string | null;
  candlesPassed: number | null;
  rsi: number;
  ema: number;
  atr: number;
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
}



export default function StatisticsPage() {
  // --- Состояния фильтров и параметров ---
  const [selectedPair, setSelectedPair] = useState(ALL_SYMBOLS[0]);

  const [takeProfit, setTakeProfit] = useState(150);
  
  // --- Состояния данных и интерфейса ---
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TradeSignal[]>([]);
  const [selectedRow, setSelectedRow] = useState<TradeSignal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Внутри компонента StatisticsPage:
  const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
  const [keyLevels, setKeyLevels] = useState<any[]>([]);
  

  useEffect(() => {
    setIsMounted(true);
    // setStartDate(DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd HH:mm:ss'));
    // setEndDate(DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'));
  }, []);

  // 3. Чтобы избежать мерцания пустого интерфейса, можно вернуть null или скелетон
  if (!isMounted) return null;

  // Имитация запуска анализа (сюда нужно будет интегрировать вашу функцию fetch)
  const handleAnalyze = async () => {
    setIsLoading(true);

    const { signals, levels } = await analyzeMarketCheeseSignals(selectedPair, startDate, endDate, takeProfit) as unknown as { signals: TradeSignal[], levels: any[] };
     

    // const result = await analyzeMajorForexSignals(selectedPair, startDate, endDate, takeProfit) as unknown as TradeSignal[];
    console.log('Результат анализа:', signals, levels);
    setData(signals); // Преобразуем результат в массив для отображения
    setKeyLevels(levels); // Сохраняем ключевые уровни
    setIsLoading(false);
  };

    const getSignalRisk = (row: TradeSignal) => {
    const risks = {
      rsi: false,
      bb: false,
      total: false
    };

    if (row.type === 'SELL') {
      if (row.rsi < 35) risks.rsi = true;
      if (row.bollingerBands && row.entryPrice < row.bollingerBands.lower) risks.bb = true;
    }

    if (row.type === 'BUY') {
      if (row.rsi > 65) risks.rsi = true;
      if (row.bollingerBands && row.entryPrice > row.bollingerBands.upper) risks.bb = true;
    }

    risks.total = risks.rsi || risks.bb;
    return risks;
  };

    const filteredData = data

  return (
    <div className="relative space-y-6 mx-auto p-8 bg-slate-50 dark:bg-[#0b0e14]">
        <div className="fixed bottom-10 right-14 flex justify-center items-end gap-3">
          <button 
            onClick={() => setIsChartOpen(true)}
            className="text-slate-500 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all"
          >
            <BarChart size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <TrendingUp className="text-blue-500" /> FOREX LUNA
            </h1>
            <p className="text-right text-slate-500 text-sm font-medium">Анализ статистики</p>
          </div>
        <div className="text-sm text-gray-500">
          Найдено сигналов: <span className="text-blue-400">{filteredData.length}</span>
        </div>
      </div>

      {/* --- ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl mb-6 shadow-lg shadow-blue-900/10">
        
        <div>
          <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-bold">Инструмент</label>
          <select 
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 shadow-sm rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 text-slate-500 transition-all"
          >
            {ALL_SYMBOLS.map(pair => <option key={pair} value={pair}>{pair}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-bold">Дата начала</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 shadow-sm rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 text-slate-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-bold">Дата окончания</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 shadow-sm rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 text-slate-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-bold">Take Profit (п)</label>
          <input 
            type="number" 
            value={takeProfit}
            onChange={(e) => setTakeProfit(Number(e.target.value))}
            className="w-full bg-slate-100 dark:bg-slate-950 shadow-sm rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 text-slate-500 transition-all"
          />
        </div>

        <div className="flex justify-center items-end gap-3">
          <button 
            onClick={() => setIsChartOpen(true)}
            className="flex gap-2 text-slate-500 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all"
          >
            <BarChart size={20} className="text-slate-600 dark:text-slate-400" /> <p>График</p>
          </button>
          <button 
            disabled={keyLevels.length === 0}
            onClick={() => {
              setIsLevelsModalOpen(true);
            }}
            className="flex gap-2 text-slate-500 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all"
          >
            <Layers size={20} className="text-slate-600 dark:text-slate-400" />
            <p className="hidden xl:block">Уровни</p>
        </button>

        </div>

        {isChartOpen && <Graph symbol={selectedPair.replace('/', '')} onClose={() => setIsChartOpen(false)}/>}

        {/* <div className="hidden lg:block"></div> Распорка */}

        <div className="flex items-end">
          <button 
            onClick={handleAnalyze}
            disabled={isLoading || !startDate || !endDate}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
          >
            {isLoading ? <span className="animate-spin text-lg">◌</span> : <Play size={18} fill="currentColor" />}
            Анализировать
          </button>
        </div>
      </div>

      {/* --- ТАБЛИЦА РЕЗУЛЬТАТОВ --- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 shadow-lg shadow-blue-900/10 overflow-hidden shadow-xl">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-semibold text-gray-500 flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-500" />
            Журнал сигналов
          </h2>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Поиск по типу..." 
              className="w-full bg-white dark:bg-slate-900 shadow-sm rounded-lg text-sm outline-none focus:border-blue-500 text-slate-500 transition-all pl-10 pr-4 py-2 text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950 rounded-lg shadow-sm text-slate-500 uppercase text-[10px] tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4 font-bold">Пара</th>
                <th className="px-6 py-4 font-bold">Сигнал</th>
                <th className="px-6 py-4 font-bold">Цена входа</th>
                <th className="px-6 py-4 font-bold">RSI</th>
                <th className="px-6 py-4 font-bold">EMA</th>
                <th className="px-6 py-4 font-bold">ATR</th>
                <th className="px-6 py-4 font-bold">Bollinger Bands</th>
                <th className="px-6 py-4 font-bold">Время входа</th>
                <th className="px-6 py-4 font-bold">Цель</th>
                <th className="px-6 py-4 font-bold">Время выхода</th>
                <th className="px-6 py-4 font-bold">Свечей до закрытия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                const risk = getSignalRisk(row);
                
                return (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedRow(row)}
                    className={`hover:bg-blue-500/[0.03] cursor-pointer transition-colors group ${
                      risk.total ? 'bg-amber-500/[0.02]' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-500">{row.symbol}</td>
                    
                    {/* СИГНАЛ: Подсвечиваем ячейку, если есть риск */}
                    <td className={`px-6 py-4 ${risk.total ? 'bg-amber-500/10' : ''}`}>
                      <div className="flex flex-col">
                        <span className={`flex items-center gap-2 font-black ${
                          row.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {row.type === 'BUY' ? <ArrowUpCircle size={16}/> : <ArrowDownCircle size={16}/>}
                          {row.type}
                        </span>
                        {risk.total && (
                          <span className="text-[9px] text-amber-600 font-bold uppercase mt-1 animate-pulse">
                            ⚠️ Высокий риск
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono">{row.entryPrice}</td>

                    {/* RSI: Подсветка если значение критическое для входа */}
                    <td className={`px-6 py-4 font-mono ${
                      risk.rsi ? 'text-amber-500 bg-amber-500/5 font-bold' : 'text-slate-500'
                    }`}>
                      {row.rsi}
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-mono">{row.ema}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{row.atr}</td>

                    {/* Bollinger Bands: Подсветка если цена входа вне диапазона */}
                    <td className={`px-6 py-4 font-mono text-xs ${
                      risk.bb ? 'text-amber-500 bg-amber-500/5 font-bold' : 'text-slate-500'
                    }`}>
                      <div className="flex flex-col">
                        <span>U: {row.bollingerBands?.upper.toFixed(5)}</span>
                        <span className="opacity-50">M: {row.bollingerBands?.middle.toFixed(5)}</span>
                        <span>L: {row.bollingerBands?.lower.toFixed(5)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs">{row.entryTime}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{row.targetPrice}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {row.resultTime || <span className="opacity-30">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {row.candlesPassed ? (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs font-medium">
                          {row.candlesPassed}h
                        </span>
                      ) : <span className="text-gray-700">—</span>}
                    </td>
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-600">
                    Нет данных для отображения. Нажмите "Анализировать", чтобы загрузить статистику.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ --- */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="h-2 w-full bg-blue-600"></div>
            <button 
              onClick={() => setSelectedRow(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs text-blue-500 font-bold uppercase tracking-widest">Детальный отчет</span>
                <h3 className="text-2xl font-bold text-gray-100">{selectedRow.symbol}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400 text-sm">Направление</span>
                  <span className={`font-bold ${selectedRow.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {selectedRow.type === 'BUY' ? 'ДЛИННАЯ (LONG)' : 'КОРОТКАЯ (SHORT)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2"><Target size={14}/> Точка входа</span>
                  <span className="font-mono text-gray-200">{selectedRow.entryPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2"><Target size={14}/> Целевой уровень</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedRow.targetPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2"><Clock size={14}/> Открытие сделки</span>
                  <span className="text-sm text-gray-300">{selectedRow.entryTime}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2"><Clock size={14}/> Закрытие сделки</span>
                  <span className="text-sm text-gray-300">{selectedRow.resultTime || 'В процессе / Не достигнуто'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 text-sm">Эффективность</span>
                  <span className="text-blue-400 font-bold">
                    {selectedRow.candlesPassed ? `${selectedRow.candlesPassed} баров` : 'Тайм-аут'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedRow(null)}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
      <LevelsModal 
        isOpen={isLevelsModalOpen}
        onClose={() => setIsLevelsModalOpen(false)}
        keyLevels={keyLevels}
        selectedPair={selectedPair}
      />
    </div>
  );
}