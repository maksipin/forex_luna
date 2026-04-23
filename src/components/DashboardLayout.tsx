'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  BarChart2, 
  Settings, 
  Menu, 
  ChevronLeft, 
  TrendingUp,
  X
} from 'lucide-react'; // Используем lucide-react для иконок
import { ThemeToggle } from './ThemeToggle';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем мобильное меню при смене страницы
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const menuItems = [
    { name: 'Поиск сигналов', href: '/', icon: Search },
    { name: 'Анализ статистики', href: '/stats', icon: BarChart2 },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* --- МОБИЛЬНЫЙ ОВЕРЛЕЙ --- */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- БОКОВАЯ ПАНЕЛЬ --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 lg:relative
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72 w-80'}
          transition-all duration-300 ease-in-out 
          bg-white dark:bg-slate-950 flex flex-col 
          border-r border-slate-200 dark:border-slate-800
        `}
      >
        {/* Хедер панели */}
        <div className={`p-4 h-20 flex items-center ${!isCollapsed ? 'justify-between' : 'justify-center'} transition-all duration-300 ease-in-out`}>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                <TrendingUp className="text-blue-500" /> FOREX LUNA
              </h1>
              <p className="text-slate-500 text-sm font-medium">Анализ японских свечей</p>
            </div>
          )}
          
          {/* Кнопка сворачивания (только десктоп) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Кнопка закрытия (только мобильный) */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-slate-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 mt-4 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const showText = !isCollapsed || isMobileOpen;

            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center p-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <Icon size={22} className="min-w-[22px]" />
                {showText && <span className="ml-4 font-semibold whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Футер панели */}
        <div className="flex justify-center p-4 border-t border-slate-200 dark:border-slate-800">
           <ThemeToggle />
        </div>
      </aside>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Верхняя мобильная шапка (только мобильный) */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <h1 className="font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> FOREX LUNA
          </h1>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Скролл-зона контента */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}