'use server';

// import { sendSignalNotification } from "@/lib/telegram";
// import  twelvedata  from "twelvedata";
import { DateTime } from 'luxon';
import { SYMBOL_MAP } from "@/consts/consts";
import { addIndicatorsToCandles, calculateATR, calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI, findForexLevels, ForexLevel } from "@/lib/indicatorsUtils";
import { searchLunaSignals } from "./searchSignals";

const config = {
  key: process.env.TWELVE_DATA_API_KEY,
};

// const sdk = twelvedata(config);

interface MarketCheeseResponse {
  status: "Success" | "Error";
  data: {
    items: MarketCheeseItem[];
    metaData: {
      pageCount: number;
      totalCount: number;
    }
  };
}

export type MarketCheeseItem = {
  date: number; // UNIX timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Не всегда приходит
}

export interface Candle {
  dt: DateTime;
  dateStr: string;
  fullTimeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number;
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  macd: { macdLine: number | null; signalLine: number | null };
}

export type CombinedSymbolData = {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  daily: Candle;
  hourly: Candle[];
  error?: string;
  levels?: ForexLevel[]
  hasLevels?: ForexLevel
};

export async function fetchMarketCheeseComplexData(symbol: string, bot?: boolean): Promise<CombinedSymbolData | {symbol: string, error: string}> {
  if (!symbol) return { symbol, error: 'Символ не указан' };

  try {
    const hourlyRes = await fetchMarketCheeseData(symbol);
   
    const candlesWithIndicators = addIndicatorsToCandles(hourlyRes);
    //  console.log ('Candels', candlesWithIndicators.slice(candlesWithIndicators.length-20))
    const result = searchLunaSignals(candlesWithIndicators, symbol)

    return result;
  } catch (error) {
    console.error(`Ошибка MarketCheese для ${symbol}:`, error);
    return { symbol,  error: "MarketCheese API Error" };
  }
}

export async function fetchMarketCheeseData(symbolName: string, startDate?: string, endDate?: string): Promise<MarketCheeseItem[]> {
  
  const symbolId = SYMBOL_MAP[symbolName] || 68;

  let url: string;

  if (startDate && endDate) { 
    const startDt = DateTime.fromISO(startDate).setZone("Europe/Moscow").startOf('day');
    const endDt =  DateTime.fromISO(endDate).setZone("Europe/Moscow").endOf('day');
    const hoursDiff = Math.ceil(endDt.diff(startDt, 'hours').hours);
    const count = Math.max(hoursDiff + 200, 200); 
    const dateParam = endDt.toFormat('yyyyMMddHHmm');

    url = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;
  } else {
    const now = DateTime.now().setZone("Europe/Moscow");
    const startDt = now.startOf('day').minus({ days: 30 });
    const count = Math.ceil(now.diff(startDt, 'hours').hours);
    const dateParam = now.toFormat('yyyyMMddHHmm');

    url = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;
  }

  const hourlyResJ = await fetch(url).then(res => res.json()) as MarketCheeseResponse;

  return hourlyResJ.data.items

}
  

export async function analyzeMarketCheeseSignals(
  symbolName: string, 
  startDate: string, 
  endDate: string,   
  takeProfitPoints: number = 1,
  rsiPeriod: number = 14 // Добавили период RSI
) {
  const symbolId = SYMBOL_MAP[symbolName] || 68;
  
  const startDt = DateTime.fromISO(startDate).setZone("Europe/Moscow").startOf('day');
  const endDt = DateTime.fromISO(endDate).setZone("Europe/Moscow").endOf('day');

  
  const levelStartDt = endDt.minus({ days: 60}); // Анализируем уровни за последние 90 дней

  const hoursDiff = Math.ceil(endDt.diff(startDt, 'hours').hours);
  const levelHoursDiff = Math.ceil(endDt.diff(levelStartDt, 'hours').hours);

  console.log(`Часов в анализируемом периоде: ${hoursDiff}, часов для уровней: ${levelHoursDiff} ${levelStartDt}`);

  // ВАЖНО: Добавляем к count период RSI (например, 14) + запас (например, 50), 
  // чтобы индикатор успел стабилизироваться до начала анализируемого периода.
  const count = Math.max(hoursDiff + rsiPeriod, 200); 
  
  const dateParam = endDt.toFormat('yyyyMMddHHmm');
  const levelDateParam = endDt.toFormat('yyyyMMddHHmm');
  const url = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;
  const levelUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${levelHoursDiff}&date=${levelDateParam}`;

  try {

    const [response, levelDataResponse] = await Promise.all([
      fetch(url),
      fetch(levelUrl)
    ]);

    const rawDataJson: MarketCheeseResponse = await response.json();
    const levelDataJson: MarketCheeseResponse = await levelDataResponse.json(); 
    const rawData = rawDataJson.data.items;
    const levelData = levelDataJson.data.items;

    if (!Array.isArray(rawData) || !Array.isArray(levelData)) {
      throw new Error('Некорректный ответ от MarketCheese API');
    }

    const candles = addIndicatorsToCandles(rawData);
    const levels = findForexLevels(candles, 5, 30, 10);

    const findDayCandle = (dt: DateTime) => {
      console.log(`Ищем дневную свечу для ${dt}`);
      const dayStr = dt.toFormat('yyyy-MM-dd');
      return candles.find(c => c.dateStr === dayStr);
    };
    const findHourlyCandle = (dt: DateTime) => {
      const timeStr = dt.toFormat('yyyy-MM-dd HH:00:00');
      return candles.find(c => c.fullTimeStr === timeStr);
    };    

    const  lunaSignals = searchLunaSignals(candles, symbolName);
    console.log(`Найденные сигналы для ${symbolName}:`, lunaSignals);

    const dayCandel = findDayCandle(DateTime.now().setZone("Europe/Moscow").minus({ days: 3 }).startOf('day'));
    const hourlyCandel = findHourlyCandle(startDt);

    const signals = [];
    const POINT = symbolName.includes('JPY') || symbolName.includes('XAU') ? 0.01 : 0.00001;


    const uniqueDays = Array.from(new Set(
      candles
        .filter(c => c.dt >= startDt && c.dt <= endDt && c.dt.weekday < 6)
        .map(c => c.dateStr)
    ));

  

    for (const day of uniqueDays) {
      const dayCandles = candles.filter(c => c.dateStr === day);
      if (dayCandles.length === 0) continue;

      const dayOpen = dayCandles[0].open;

      for (let i = 1; i < dayCandles.length; i++) {
        const c1 = dayCandles[i - 1];
        const c2 = dayCandles[i];

        if (c2.dt.hour < 8 || c2.dt.hour > 20) continue;

        const isDayBullish = c2.close > dayOpen;
        const isDayBearish = c2.close < dayOpen;
        const areHourliesBullish = c1.close > c1.open && c2.close > c2.open;
        const areHourliesBearish = c1.close < c1.open && c2.close < c2.open;
    

        let signalType: 'BUY' | 'SELL' | null = null;
        if (isDayBullish && areHourliesBullish) signalType = 'BUY';
        if (isDayBearish && areHourliesBearish) signalType = 'SELL';

        if (signalType) {
          const entryPrice = c2.close;
          const TARGET_DIFF = c2?.atr &&  (takeProfitPoints * c2.atr + 30 * POINT) || 0 ; // Цель — 1 ATR + небольшой запас
          const targetPrice = signalType === 'BUY' ? entryPrice + TARGET_DIFF : entryPrice - TARGET_DIFF;
          
          
          let resultTime = null;
          let candlesPassed = null;

          const globalIdx = candles.findIndex(c => c.fullTimeStr === c2.fullTimeStr);
          for (let j = globalIdx + 1; j < candles.length; j++) {
            const future = candles[j];
            if (signalType === 'BUY' && future.high >= targetPrice) {
              resultTime = future.fullTimeStr;
              candlesPassed = j - globalIdx;
              break;
            }
            if (signalType === 'SELL' && future.low <= targetPrice) {
              resultTime = future.fullTimeStr;
              candlesPassed = j - globalIdx;
              break;
            }
          }

          signals.push({
            symbol: symbolName,
            type: signalType,
            entryPrice: parseFloat(entryPrice.toFixed(5)),
            entryTime: c2.fullTimeStr,
            targetPrice: parseFloat(targetPrice.toFixed(5)),
            resultTime,
            candlesPassed,
            rsi: c2.rsi, // Теперь здесь актуальное значение RSI
            ema20: c2.ema20, // Теперь здесь актуальное значение EMA
            ema50: c2.ema50, // Теперь здесь актуальное значение EMA
            ema200: c2.ema200, // Теперь здесь актуальное значение EMA
            atr: c2.atr,  // Теперь здесь актуальное значение ATR
            bollingerBands: c2.bollingerBands,  // Теперь здесь актуальное значение Bollinger Bands
            macd: c2.macd  // Теперь здесь актуальное значение MACD
          });
        }
      }
    }

    return {signals, levels};
  } catch (error) {
    console.error("MarketCheese API Error:", error);
    return [];
  }
}