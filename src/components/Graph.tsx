'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ForexLevel } from '@/lib/indicatorsUtils';

export default function Graph({symbol, levels, price, onClose}: {symbol: string, levels: ForexLevel[] | undefined, price: number, onClose?: () => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const scriptId = `mc-script-graph-${symbol}`;
  const [isClient, setIsClient] = useState(false);
  
    useEffect(() => {
      setIsClient(true);
    }, []);

  useEffect(() => {
    // 1. Очищаем контейнер перед вставкой (чтобы виджет не дублировался при HMR)
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    // 2. Создаем элемент скрипта вручную
    const script = document.createElement('script');
    script.src = 'https://api.marketcheese.com/widgets/chart/widget.js';
    script.async = true;
    script.id = scriptId;
    
    // 3. Передаем конфиг через атрибут
    const config = {
      terminalBtn:{
        color:"#D3D9E3",
        href: "https://webtrader.frtx.org"
      },
      timeframe:"H1",
      barStyle:"Candle",
      offset:30,
      colorScheme:theme,
      symbolsEnabled:true,
      showTools:true,
      symbol: symbol,
      language: "ru",
      timezone: "current",
      upload: "manual"
    };
    script.setAttribute('data-config', JSON.stringify(config));

        // 4. Добавляем скрипт именно внутрь нашего div
   const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.appendChild(script);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = '';
      
      // Удаляем скрипт из DOM
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) scriptToRemove.remove();

      // Очищаем глобальные переменные виджета, если они есть
      // Это предотвратит конфликты, когда новый виджет увидит "старые" настройки
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.MarketCheese; 
      }
    };
  }, [isClient]);

  return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-gray-700 p-4 w-full max-w-6xl rounded-2xl shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
              <Settings className="text-blue-500" /> График
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
        </div>
        <div className='flex justify-between'>
          <p>Уровни:</p>
          {levels?.sort((a, b) => a.price > b.price ? 1 : -1 ).map(i => (
            <p className={`${i.price < price ? 'text-amber-600 dark:text-amber-500/70' : 'text-green-600'}`} key={i.price}>{i.price}({i.touches})</p>
          ))}
        </div>
      
      {/* Основной контейнер виджета */}
      <div 
      datatype='chart'
        ref={containerRef} 
        className="marketcheese-widget-container p-4 w-full bg-white dark:bg-slate-900 min-h-[600px] overflow-hidden"
      >
        {/* Сюда скрипт вставит iframe календаря */}
      </div>
      </div>
     
    </div>
  );
}