'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function EconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = `mc-script-economic-calendar`;
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Очищаем контейнер
    containerRef.current.innerHTML = '';
    
    // Удаляем старый скрипт если есть
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    // Проверяем, не загружен ли уже скрипт
    const existingScript = document.querySelector(`script[src="https://api.marketcheese.com/widgets/calendar/widget.js"]`) as HTMLScriptElement;
    
    if (existingScript && existingScript.dataset.loaded === 'true') {
      // Скрипт уже загружен, просто инициализируем виджет
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.marketcheese.com/widgets/calendar/widget.js';
    script.async = true;
    script.id = scriptId;
    
    const config = {
      filters: {
        countries: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,81,186,211",
        segments: "4",
        volatilities: "4"
      },
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
      console.error('Failed to load MarketCheese calendar widget');
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
  }, []);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 mt-8 p-4 rounded-3xl shadow-sm">
      <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        Экономический календарь
      </h2>
      
      {/* Основной контейнер виджета */}
      <div 
        ref={containerRef} 
        className="marketcheese-widget-container p-4 w-full bg-white dark:bg-slate-900 min-h-[600px] overflow-hidden"
      >
        {!isLoaded && <div className="text-center text-slate-500">Загрузка календаря...</div>}
      </div>
    </div>
  );
}
