import { macd } from "technicalindicators";

export const ALL_SYMBOLS = ['AUD/NZD', 'AUD/CHF', 'AUD/CAD', 'AUD/USD', 'AUD/JPY', 
    'EUR/AUD', 'EUR/CHF', 'EUR/CAD', 'EUR/GBP', 'EUR/USD', 'EUR/JPY', 
    // 'EUR/NZD',
    'USD/CHF', 'USD/CAD', 'USD/JPY', 'USD/CNY',
    // 'CHF/JPY',
    'GBP/CHF',
    'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD'];

export const SYMBOLS_WITH_INFO = [
    { 
        symbol: 'AUD/NZD',
        spread: 56,
        swap: { long: -5.7, short: -1.5 },
        commission: 15
    },
    { 
        symbol: 'AUD/CHF',
        spread: 31,
        swap: { long: 2.5, short: -8.4 },
        commission: 15
    },
    { 
        symbol: 'AUD/CAD',
        spread: 27,
        swap: { long: -4.3, short: -3.9 },
        commission: 15
    },
    { 
        symbol: 'AUD/USD',
        spread: 33,
        swap: { long: -5.2, short: -1.3 },
        commission: 5
    },
    { 
        symbol: 'AUD/JPY',
        spread: 49,
        swap: { long: 4.7, short: -10.3 },
        commission: 15
    },
    { 
        symbol: 'EUR/AUD',
        spread: 53,
        swap: { long: -6.7, short: -3.3 },
        commission: 15
    },
    { 
        symbol: 'EUR/CHF',
        spread: 29,
        swap: { long: 3.8, short: -10.7 },
        commission: 15
    },
       { 
        symbol: 'EUR/CAD',
        spread: 52,
        swap: { long: -8.1, short: -0.7 },
        commission: 15
    },
       { 
        symbol: 'EUR/GBP',
        spread: 37,
        swap: { long: -6.3, short: -3.5 },
        commission: 15
    },
       { 
        symbol: 'EUR/USD',
        spread: 24,
        swap: { long: -8.2, short: 0 },
        commission: 5
    },
       { 
        symbol: 'EUR/JPY',
        spread: 44,
        swap: { long: 7.6, short: -13.8 },
        commission: 15
    },
       { 
        symbol: 'USD/CHF',
        spread: 35,
        swap: { long: 7.6, short: -14.5 },
        commission: 10
    },
       { 
        symbol: 'USD/CAD',
        spread: 44,
        swap: { long: -2.4, short: -7.5 },
        commission: 10
    },
       { 
        symbol: 'USD/JPY',
        spread: 57,
        swap: { long: 0, short: -14.0 },
        commission: 10
    },
       { 
        symbol: 'USD/CNY',
        spread: 65,
        swap: { long: -24.0, short: -24.0 },
        commission: 10
    },
       { 
        symbol: 'GBP/CHF',
        spread: 37,
        swap: { long: 5.1, short: -15.2 },
        commission: 15
    },
       { 
        symbol: 'NZD/CAD',
        spread: 39,
        swap: { long: -2.1, short: -3.9 },
        commission: 15
    },
       { 
        symbol: 'NZD/CHF',
        spread: 39,
        swap: { long: 4.3, short: -9.4 },
        commission: 15
    },
       { 
        symbol: 'NZD/JPY',
        spread: 37,
        swap: { long: 2.2, short: -15.3 },
        commission: 15
    },
       { 
        symbol: 'NZD/USD',
        spread: 37,
        swap: { long: -2.9, short: -3.2 },
        commission: 5
    }
]

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