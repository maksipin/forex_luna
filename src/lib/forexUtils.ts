import { CombinedSymbolData } from "@/app/actions/forexActions";

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

// Список популярных пар (в идеале тянуть через sdk.forexPairs(), но для начала захардкодим мажоров)
// src/lib/forexUtils.ts

export const MAJORS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

export const CROSSES = [
  'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 
  'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'AUD/JPY', 'NZD/JPY'
];

