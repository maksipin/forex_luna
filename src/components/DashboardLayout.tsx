// components/DashboardLayout.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  BarChart2, 
  Settings, 
  Menu, 
  ChevronLeft, 
  TrendingUp
} from 'lucide-react'; // Используем lucide-react для иконок
import { ThemeToggle } from './ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Поиск сигналов', href: '/', icon: Search },
    { name: 'Анализ статистики', href: '/stats', icon: BarChart2 },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* Боковая панель */}
      <aside 
        className={`${
          isCollapsed ? 'w-18' : 'w-68'
        } transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 flex flex-col shadow-md rounded-lg border border-slate-200 dark:border-slate-800`}
      >
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && 
            <div className='pr-2'>
                <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                <TrendingUp className="text-blue-500" /> FOREX LUNA
                </h1>
                <p className="text-slate-500 text-sm font-medium text-center">Анализ японских свечей и сигналов</p>
            </div>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hover:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-800 p-2`}
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-4 ">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center p-4 transition-colors ${
                  isActive ? 'dark:bg-slate-800 text-blue-600 dark:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={20} className="min-w-[20px]" />
                {!isCollapsed && <span className="ml-4 font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
         <ThemeToggle />
      </aside>

      {/* Основной контент */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}