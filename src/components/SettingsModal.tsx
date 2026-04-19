
'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Clock, Zap } from 'lucide-react';
import { getAppConfig } from '@/lib/forexUtils';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [config, setConfig] = useState({ apiInterval: 30, cacheTTL: 20 });

  useEffect(() => {
    if (isOpen) setConfig(getAppConfig());
  }, [isOpen]);

  const saveConfig = () => {
    localStorage.setItem('app_forex_config', JSON.stringify(config));
    onClose();
    window.location.reload(); // Перезагрузим, чтобы применить новые интервалы
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
            <Settings className="text-blue-500" /> Настройки API
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Интервал API */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              <Zap size={14} className="text-amber-500" /> Интервал между запросами (сек)
            </label>
            <input 
              type="range" min="5" max="120" step="5"
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              value={config.apiInterval}
              onChange={(e) => setConfig({...config, apiInterval: parseInt(e.target.value)})}
            />
            <div className="flex justify-between mt-2 font-mono text-sm font-bold text-blue-500">
              <span>5s</span>
              <span className="bg-blue-500 text-white px-3 py-0.5 rounded-full text-xs">{config.apiInterval} секунд</span>
              <span>120s</span>
            </div>
          </div>

          {/* Время кэша */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              <Clock size={14} className="text-blue-500" /> Время жизни кэша (мин)
            </label>
            <input 
              type="range" min="1" max="60" step="1"
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              value={config.cacheTTL}
              onChange={(e) => setConfig({...config, cacheTTL: parseInt(e.target.value)})}
            />
            <div className="flex justify-between mt-2 font-mono text-sm font-bold text-emerald-500">
              <span>1m</span>
              <span className="bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs">{config.cacheTTL} минут</span>
              <span>60m</span>
            </div>
          </div>
        </div>

        <button 
          onClick={saveConfig}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
        >
          Сохранить конфигурацию
        </button>
      </div>
    </div>
  );
}