import { CombinedSymbolData } from "@/app/actions/forexActions";
import { DateTime } from "luxon";

export type Signal = 'BUY' | 'SELL' | 'NEUTRAL';

// export function calculateSignal(data: CombinedSymbolData): Signal {
//   if (!data.daily || !data.hourly || data.hourly.length < 2) return 'NEUTRAL';

//   const dailyGreen = parseFloat(data.daily.close) > parseFloat(data.daily.open);
//   const dailyRed = parseFloat(data.daily.close) < parseFloat(data.daily.open);
  
//   const allHourlyGreen = data.hourly.every(h => parseFloat(h.close) > parseFloat(h.open));
//   const allHourlyRed = data.hourly.every(h => parseFloat(h.close) < parseFloat(h.open));

//   if (dailyGreen && allHourlyGreen) return 'BUY';
//   if (dailyRed && allHourlyRed) return 'SELL';
//   return 'NEUTRAL';
// }

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
  const date = DateTime.fromFormat(datetime, 'yyyy-MM-dd HH:mm:ss');
  return `${date.hour}H`;
} 


export function setCachedData(symbol: string, data: any) {
  const cacheObject = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`cache_${symbol}`, JSON.stringify(cacheObject));
}

