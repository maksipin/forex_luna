import { macd } from "technicalindicators";

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

export const TRENDING_SYMBOLS = ['USD/JPY', 'CHF/JPY', 'EUR/JPY', 'NZD/JPY', 'AUD/JPY', 'GBP/CHF', 'EUR/USD'];
export const FLAT_SYMBOLS = ['EUR/GBP', 'AUD/NZD', 'AUD/CAD', 'AUD/CHF', 'EUR/CHF', 'EUR/CAD', 'EUR/AUD', 'EUR/NZD'];
export const COMMODITY_SYMBOLS = ['AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/CHF', 'NZD/CAD', 'NZD/CHF', 'USD/CNY'];

// export const TRENDING_INDICATORS = ['RSI', 'Bollinger Bands', 'MACD'];
// export const FLAT_INDICATORS = ['ATR', 'Forex Levels'];
// export const COMMODITY_INDICATORS = ['RSI', 'Bollinger Bands', 'MACD', 'ATR', 'Forex Levels'];

export const TRENDING_INDICATORS = {
    indicators: ['RSI', 'Bollinger Bands', 'MACD'],
    ema:{
        values: "close",
        period: 20,
    },
    macd: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: "close"
    },
    candels: ["D1", "H4", "H1"]

};
export const FLAT_INDICATORS = ['ATR', 'Forex Levels'];
export const COMMODITY_INDICATORS = ['RSI', 'Bollinger Bands', 'MACD', 'ATR', 'Forex Levels'];