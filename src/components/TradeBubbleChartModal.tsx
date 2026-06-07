'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Типизация для данных одной сделки
export interface BubbleTradeData {
    date: string;        // Дата сделки (можно использовать для сортировки или отображения)
    hourOpened: number;   // 0 - 23 (Ось X)
    hoursHeld: number;    // 1 - 300 (Ось Y)
    volume: number;       // Размер лота/сделки (задает размер пузырька)
    result: 'profit' | 'loss'; // Тип сделки для разделения по цветам
    pair: string;         // Название пары (для тултипа)
}

interface TradeBubbleChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BubbleTradeData[];
}

export const TradeBubbleChartModal: React.FC<TradeBubbleChartModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  // Разделяем данные, чтобы построить два разных слоя (Scatter) с разными цветами
  const profitData = data.filter((d) => d.result === 'profit');
  const lossData = data.filter((d) => d.result === 'loss');

  // Кастомный тултип для красивого отображения данных при наведении
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload as BubbleTradeData;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg text-sm text-white">
          <p className="font-bold border-b border-slate-700 pb-1 mb-1">{info.pair}</p>
          <p><span className="text-gray-400">Дата:</span> {info.date}</p>
          <p><span className="text-gray-400">Вход (час):</span> {info.hourOpened}:00</p>
          <p><span className="text-gray-400">Удержание:</span> {info.hoursHeld} ч.</p>
          <p><span className="text-gray-400">Объем:</span> {info.volume}</p>
          <p>
            <span className="text-gray-400">Результат:</span>{' '}
            <span className={info.result === 'profit' ? 'text-emerald-400' : 'text-rose-400'}>
              {info.result === 'profit' ? 'Profit' : 'Loss'}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl h-full w-full max-w-[90%] max-h-[90%] p-6 shadow-2xl relative flex flex-col m-4">
        
        {/* Хедер модалки */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Анализ плотности сигналов</h3>
            <p className="text-xs text-gray-400 mt-1">
              Размер пузырька зависит от объема сделки. Ось X — час входа, Ось Y — время удержания в часах.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl font-light p-1"
          >
            &times;
          </button>
        </div>

        {/* Контейнер для графика */}
        <div className="w-full h-full bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              
              {/* Ось X: Часы от 0 до 23 */}
              <XAxis
                type="number"
                dataKey="hourOpened"
                name="Час открытия"
                domain={[0, 23]}
                tickCount={24}
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(tick) => `${tick}h`}
              />
              
              {/* Ось Y: Время закрытия/жизни сделки от 1 до 300 часов */}
              <YAxis
                type="number"
                dataKey="hoursHeld"
                name="Время удержания"
                domain={[-10, 24]}
                tickCount={10}
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(tick) => `${tick}ч`}
              />
              
              {/* Ось Z: Отвечает за радиус пузырька (volume) */}
              <ZAxis 
                dataKey="volume" 
                range={[10, 200]} 
                name="Объем"
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#64748b' }} />
              <Legend verticalAlign="top" height={36} />

              {/* Удачные сигналы (Зеленые) */}
              <Scatter
                name="Профитные сигналы"
                data={profitData}
                fill="#10b981"
                fillOpacity={0.7}
                stroke="#047857"
              />

              {/* Неудачные сигналы (Красные) */}
              <Scatter
                name="Убыточные сигналы"
                data={lossData}
                fill="#f43f5e"
                fillOpacity={0.7}
                stroke="#be123c"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Футер модалки */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};