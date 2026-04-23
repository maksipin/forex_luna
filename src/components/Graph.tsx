'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Graph({symbol = 'EURUSD', onClose}: {symbol?: string, onClose?: () => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const scriptId = `mc-script-graph-${symbol}`;
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Очищаем контейнер
    containerRef.current.innerHTML = '';
    
    // Удаляем старый скрипт если есть
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    // Проверяем, не загружен ли уже скрипт для графика
    const existingScript = document.querySelector(`script[src="https://api.marketcheese.com/widgets/chart/widget.js"]`) as HTMLScriptElement;
    
    if (existingScript && existingScript.dataset.loaded === 'true') {
      // Скрипт уже загружен, просто инициализируем виджет
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.marketcheese.com/widgets/chart/widget.js';
    script.async = true;
    script.id = scriptId;
    
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

    script.onload = () => {
      script.dataset.loaded = 'true';
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load MarketCheese graph widget');
      setIsLoaded(false);
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) scriptToRemove.remove();

      // Очищаем глобальные переменные виджета
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.MarketCheese;
      }
      setIsLoaded(false);
    };
  }, [symbol, theme]);

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
      
      {/* Основной контейнер виджета */}
      <div 
      datatype='chart'
        ref={containerRef} 
        className="marketcheese-widget-container p-4 w-full bg-white dark:bg-slate-900 min-h-[600px] overflow-hidden"
      >
        {!isLoaded && <div className="text-center text-slate-500">Загрузка графика...</div>}
      </div>
      </div>
     
    </div>
  );
}
