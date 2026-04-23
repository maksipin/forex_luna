'use client';

import React, { useEffect, useRef } from 'react';

export default function EconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full bg-white dark:bg-[#0b0e14] space-y-4 mt-4 p-4 rounded-3xl shadow-sm">
      <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        Экономический календарь
      </h2>
      
      {/* Основной контейнер виджета */}
      <div 
        ref={containerRef} 
        className="marketcheese-widget-container p-4 w-full bg-white dark:bg-[#0b0e14] min-h-[600px] overflow-hidden"
      >
        {/* Сюда скрипт вставит iframe календаря */}
      </div>
      
     
    </div>
  );
}