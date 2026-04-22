'use client';

import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Filter, 
  Clock, 
  Target, 
  ArrowUpCircle, 
  ArrowDownCircle,
  X,
  Calendar as CalendarIcon
} from 'lucide-react';
import { DateTime } from 'luxon';
import { analyzeMajorForexSignals } from '../actions/forexActions';

// Типизация для сигналов
interface TradeSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: string;
  targetPrice: number;
  resultTime: string | null;
  candlesPassed: number | null;
}

const MAJOR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'XAU/USD'
];

export default function StatisticsPage() {
  // --- Состояния фильтров и параметров ---
  const [selectedPair, setSelectedPair] = useState(MAJOR_PAIRS[0]);

  const [takeProfit, setTakeProfit] = useState(150);
  
  // --- Состояния данных и интерфейса ---
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TradeSignal[]>([]);
  const [selectedRow, setSelectedRow] = useState<TradeSignal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setStartDate(DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd HH:mm:ss'));
    setEndDate(DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'));
  }, []);

  // 3. Чтобы избежать мерцания пустого интерфейса, можно вернуть null или скелетон
  if (!isMounted) return null;

  // Имитация запуска анализа (сюда нужно будет интегрировать вашу функцию fetch)
  const handleAnalyze = async () => {
    setIsLoading(true);

    const result = await analyzeMajorForexSignals(selectedPair, startDate, endDate, takeProfit) as unknown as TradeSignal[];
    console.log('Результат анализа:', result);
    setData(result); // Преобразуем результат в массив для отображения
    setIsLoading(false);
    
    // // Эмуляция задержки сети
    // setTimeout(() => {
    //   setIsLoading(false);
    //   // Тестовые данные для проверки верстки
    //   setData([
    //     { 
    //       symbol: 'EUR/USD', 
    //       type: 'BUY', 
    //       entryPrice: 1.08520, 
    //       entryTime: '2026-04-20 10:00:00', 
    //       targetPrice: 1.08670, 
    //       resultTime: '2026-04-20 14:00:00', 
    //       candlesPassed: 4 
    //     },
    //     { 
    //       symbol: 'GBP/USD', 
    //       type: 'SELL', 
    //       entryPrice: 1.24205, 
    //       entryTime: '2026-04-21 09:00:00', 
    //       targetPrice: 1.24055, 
    //       resultTime: null, 
    //       candlesPassed: null 
    //     },
    //   ]);
    // }, 800);
  };

  // Простая фильтрация по типу сигнала или паре
//   const filteredData = data.filter(item => 
//     item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     item.type.toLowerCase().includes(searchTerm.toLowerCase())
//   );

    const filteredData = data

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-8 bg-slate-50 dark:bg-[#0b0e14]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-500">Анализ статистики</h1>
        <div className="text-sm text-gray-500">
          Найдено сигналов: <span className="text-blue-400">{filteredData.length}</span>
        </div>
      </div>

      {/* --- ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl mb-6 shadow-lg shadow-blue-900/10">
        
        <div>
          <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-bold">Инструмент</label>
          <select 
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 shadow-sm rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 text-slate-500 transition-all"
          >
            {MAJOR_PAIRS.map(pair => <option key={pair} value={pair}>{pair}</option>)}
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

        <div className="hidden lg:block"></div> {/* Распорка */}

        <div className="flex items-end">
          <button 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
          >
            {isLoading ? <span className="animate-spin text-lg">◌</span> : <Play size={18} fill="currentColor" />}
            Анализировать
          </button>
        </div>
      </div>

      {/* --- ТАБЛИЦА РЕЗУЛЬТАТОВ --- */}
      <div className="bg-white dark:bg-slate-900 rounded-xl mb-6 shadow-lg shadow-blue-900/10 overflow-hidden shadow-xl">
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
                <th className="px-6 py-4 font-bold">Время входа</th>
                <th className="px-6 py-4 font-bold">Цель</th>
                <th className="px-6 py-4 font-bold">Время выхода</th>
                <th className="px-6 py-4 font-bold">Свечей до закрытия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-blue-500/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-500">{row.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 font-semibold ${row.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.type === 'BUY' ? <ArrowUpCircle size={16}/> : <ArrowDownCircle size={16}/>}
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500  font-mono">{row.entryPrice}</td>
                    <td className="px-6 py-4 text-slate-500  text-xs">{row.entryTime}</td>
                    <td className="px-6 py-4 text-slate-500  font-mono">{row.targetPrice}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{row.resultTime || <span className="opacity-30">—</span>}</td>
                    <td className="px-6 py-4">
                      {row.candlesPassed ? (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs font-medium">
                          {row.candlesPassed}h
                        </span>
                      ) : <span className="text-gray-700">—</span>}
                    </td>
                  </tr>
                ))
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
    </div>
  );
}