import { CombinedSymbolData } from "@/app/actions/forexActions";
import { DateTime } from "luxon";

export type Signal = 'BUY' | 'SELL' | 'NEUTRAL';

export function calculateSignal(data: CombinedSymbolData): Signal {
  if (!data.daily || !data.hourly || data.hourly.length < 2) return 'NEUTRAL';

  const dailyGreen = parseFloat(data.daily.close) > parseFloat(data.daily.open);
  const dailyRed = parseFloat(data.daily.close) < parseFloat(data.daily.open);
  
  const allHourlyGreen = data.hourly.every(h => parseFloat(h.close) > parseFloat(h.open));
  const allHourlyRed = data.hourly.every(h => parseFloat(h.close) < parseFloat(h.open));

  if (dailyGreen && allHourlyGreen) return 'BUY';
  if (dailyRed && allHourlyRed) return 'SELL';
  return 'NEUTRAL';
}


export const MAJORS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

export const CROSSES = [
  'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 
  'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'AUD/JPY', 'NZD/JPY', "AUD/CHF", "AUD/CAD", "NZD/CHF", "NZD/CAD"
];

export const ALL_SYMBOLS = ['AUD/NZD', 'AUD/CHF', 'AUD/CAD', 'AUD/USD', 'AUD/JPY', 
    'EUR/AUD', 'EUR/CHF', 'EUR/CAD', 'EUR/GBP', 'EUR/USD', 'EUR/JPY', 'EUR/NZD',
    'USD/CHF', 'USD/CAD', 'USD/JPY', 'USD/CNY',
    'CHF/JPY', 'GBP/CHF',
    'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD'];

export const SYMBOL_MAP: Record<string, number> = {
  'AUD/NZD': 46,
  'AUD/CHF': 44,
  'AUD/CAD': 43,
  'AUD/USD': 48,
  'AUD/JPY': 4,
  'EUR/AUD': 55,
  'EUR/CHF': 57,
  'EUR/CAD': 56,
  'EUR/GBP': 59,
  'EUR/USD': 68,
  'EUR/JPY': 60,
  // 'EUR/NZD': 12,
  'USD/CHF': 83,
  'USD/CAD': 82,
  'USD/JPY': 87,
  'USD/CNY': 84,
  // 'CHF/JPY': 17,
  'GBP/CHF': 72,
  'NZD/CAD': 75,
  'NZD/CHF': 76,
  'NZD/JPY': 78,
  'NZD/USD': 80
};

export const DEFAULT_CONFIG = {
  apiInterval: 8, // в секундах
  cacheTTL: 20    // в минутах
};

export function getAppConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  const saved = localStorage.getItem('app_forex_config');
  return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

export function getCachedData(symbol: string): any | null {
  const cached = localStorage.getItem(`cache_${symbol}`);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const config = getAppConfig();
  const ttlMs = config.cacheTTL * 60 * 1000;

  if (Date.now() - timestamp < ttlMs) {
    return data;
  }
  return null;
}

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function formatCandleHour(datetime: string): string {
  const date = new Date(new Date(datetime).toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
  return `${date.getHours()}H`;
} 


export function setCachedData(symbol: string, data: any) {
  const cacheObject = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`cache_${symbol}`, JSON.stringify(cacheObject));
}

