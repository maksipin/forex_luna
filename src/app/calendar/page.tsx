'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  TrendingUp, 
} from 'lucide-react';
import dynamic  from 'next/dynamic';
// import EconomicCalendar from '@/components/EconomicCalendar';

const EconomicCalendar = dynamic(() => import('@/components/EconomicCalendar'), { 
  ssr: false,
  loading: () => <div className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
});

export default function ProfessionalForexDashboard() {
  // Состояния для UI

  const [isLoaded, setIsLoaded] = useState(false);

  
  // 1. Инициализация (Загрузка из памяти и API)
  useEffect(() => {
      setIsLoaded(true);
  }, []);

  // 2. Сохранение выбранных пар при изменении
  

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
            <p className="text-right text-slate-500 text-sm font-medium">"Экономический календарь"</p>
          </div>
          
        </header>
        <EconomicCalendar />
      </div>
    </main>
  );
}