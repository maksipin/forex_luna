'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function EconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {

    // Ждем, пока компонент появится в браузере и контейнер будет доступен
    if (!isClient || !containerRef.current) return;

    // 1. Очищаем контейнер перед вставкой (чтобы виджет не дублировался при HMR)
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // 2. Создаем элемент скрипта вручную
    const script = document.createElement('script');
    script.src = 'https://api.marketcheese.com/widgets/calendar/widget.js';
    script.async = true;
    
    // 3. Передаем конфиг через атрибут
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

    // 4. Добавляем скрипт именно внутрь нашего div
   const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.appendChild(script);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };

  }, [isClient]);

  if (!isClient) return null;

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
        {/* Сюда скрипт вставит iframe календаря */}
      </div>
      
     
    </div>
  );
}