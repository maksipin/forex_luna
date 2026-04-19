'use client';

import { useTheme, } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:ring-2 ring-blue-500 transition-all"
    >
      {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-slate-700" />}
    </button>
  );
}