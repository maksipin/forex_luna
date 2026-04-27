import { Candle, MarketCheeseItem } from "@/app/actions/forexActions";
import { TradeSignal } from "@/app/statistic/page";
import { DateTime } from "luxon";

const calculateSMA = (data: number[], period: number) => {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
};

const calculateRSI = (data: number[], period: number) => {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;

    if (i >= period) {
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(Math.round(100 - (100 / (1 + rs))));

      // Убираем влияние самой старой свечи
      const oldChange = data[i - period + 1] - data[i - period];
      if (oldChange > 0) gains -= oldChange;
      else losses += oldChange;
    } else {
      rsi.push(0);
    }
  }
  return rsi;
};

const calculateATR = (data: Candle[], period: number) => {
  const atr: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      atr.push(data[i].high - data[i].low);
    } else {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      if (i < period) {
        atr.push((atr[atr.length - 1] * i + tr) / (i + 1));
      } else {
        atr.push((atr[atr.length - 1] * (period - 1) + tr) / period);
      }
    }
  }
  return atr;
}

const calculateEMA = (data: number[], period: number) => {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  data.forEach((value, index) => {
    if (index === 0) {
      ema.push(value);
    } else {
      ema.push((value - ema[index - 1]) * multiplier + ema[index - 1]);
    }
  });
  return ema;
}

const calculateEntryPrice = (candle: any, atr: number, signal: string) => {
  if (signal === 'BUY') {
    return candle.close + atr;
  } else if (signal === 'SELL') {
    return candle.close - atr;
  }
  return candle.close;
};

const calculateStopLoss = (candle: any, atr: number, signal: string) => {
  if (signal === 'BUY') {
    return candle.close - atr;
  } else if (signal === 'SELL') {
    return candle.close + atr;
  }
  return candle.close;
};      

const calculateSignal = (data: any): 'BUY' | 'SELL' | 'NEUTRAL' => {
  if (!data.daily || !data.hourly || data.hourly.length < 2) return 'NEUTRAL';

  const dailyGreen = parseFloat(data.daily.close) > parseFloat(data.daily.open);
  const dailyRed = parseFloat(data.daily.close) < parseFloat(data.daily.open);
  
  const allHourlyGreen = data.hourly.every((h: any) => parseFloat(h.close) > parseFloat(h.open));
  const allHourlyRed = data.hourly.every((h: any) => parseFloat(h.close) < parseFloat(h.open));

  if (dailyGreen && allHourlyGreen) return 'BUY';
  if (dailyRed && allHourlyRed) return 'SELL';
  return 'NEUTRAL';
};

// const formatCandleHour = (datetime: string): string => {
//   const date = new Date(new Date(datetime).toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
//   return `${date.getHours()}H`;
// };

const calculateBollingerBands = (data: number[], period: number, stdDevMultiplier: number) => {
  const sma = calculateSMA(data, period);
  const bands = data.map((value, index) => {
    if (index < period - 1) {
      return { upper: 0, middle: sma[index], lower: 0 };
    }
    const slice = data.slice(index - period + 1, index + 1);
    const mean = sma[index];
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: mean + stdDevMultiplier * stdDev,
      middle: mean,
      lower: mean - stdDevMultiplier * stdDev
    };
  });
  return bands;
};

const calculateMACD = (data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  const macdLine = emaFast.map((val, index) => val - emaSlow[index]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  return { macdLine, signalLine };
}


export interface ForexLevel {
  price: number;
  touches: number;
  strength: number;
  isPsychological: boolean;
}

const findForexLevels = (
  data: Candle[],
  digits: number = 5, // 5 для котировок типа 1.08542, 3 для USD/JPY типа 150.421
  minPipDistance: number = 20, // Минимальная дистанция между уровнями в пунктах
  strengthThreshold: number = 3 // Глубина поиска локального пика
): ForexLevel[] =>{
  // Определяем размер 1 пункта (pip)
  const pipSize = Math.pow(10, -(digits - 1)); 
  const proximityThreshold = minPipDistance * pipSize;

  const peaks: { price: number; volume: number }[] = [];

  // 1. Поиск ценовых изломов (Pivots)
  for (let i = strengthThreshold; i < data.length - strengthThreshold; i++) {
    const current = data[i];
    const range = data.slice(i - strengthThreshold, i + strengthThreshold + 1);

    if (range.every(c => c.high <= current.high)) peaks.push({ price: current.high, volume: current.volume });
    if (range.every(c => c.low >= current.low)) peaks.push({ price: current.low, volume: current.volume });
  }

  // 2. Кластеризация по пунктам
  const levels: ForexLevel[] = [];

  peaks.forEach(peak => {
    const existingLevel = levels.find(l => Math.abs(l.price - peak.price) < proximityThreshold);

    if (existingLevel) {
      existingLevel.price = (existingLevel.price * existingLevel.touches + peak.price) / (existingLevel.touches + 1);
      existingLevel.touches += 1;
      existingLevel.strength += Math.log10(peak.volume + 1);
    } else {
      levels.push({
        price: peak.price,
        touches: 1,
        strength: Math.log10(peak.volume + 1),
        isPsychological: false
      });
    }
  });

  // 3. Анализ психологических уровней и финальный скоринг
  return levels
    .map(l => {
      // Проверка на "круглое число" (заканчивается на 00 или 50 пунктов)
      const priceInPips = l.price / pipSize;
      const isRound = Math.abs(priceInPips % 50) < 5 || Math.abs(priceInPips % 100) < 5;
      
      let finalStrength = l.strength * (l.touches >= 2 ? 1.5 : 1);
      if (isRound) finalStrength *= 1.3; // Добавляем 30% веса круглым числам

      return {
        ...l,
        price: parseFloat(l.price.toFixed(digits)),
        strength: parseFloat(finalStrength.toFixed(2)),
        isPsychological: isRound
      };
    })
    .filter(l => l.touches >= 2 || l.isPsychological) // Оставляем либо подтвержденные, либо круглые
    .sort((a, b) => b.strength - a.strength);
}


interface ReversalSignal {
  pattern: string;
  type: 'BULLISH' | 'BEARISH';
  reliability: 'HIGH' | 'MEDIUM';
}

function detectReversalPatterns(candles: Candle[]): ReversalSignal | null {
  if (candles.length < 3) return null;

  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  
  // 1. ПОИСК ПИН-БАРА (Pin Bar)
  // Логика: длинная тень с одной стороны, маленькое тело с другой
  const bodySize = Math.abs(current.close - current.open);
  const candleRange = current.high - current.low;
  const upperShadow = current.high - Math.max(current.open, current.close);
  const lowerShadow = Math.min(current.open, current.close) - current.low;

  // Бычий пин-бар (длинный хвост снизу)
  if (lowerShadow > bodySize * 2 && upperShadow < lowerShadow / 2) {
    return { pattern: 'Pin Bar', type: 'BULLISH', reliability: 'MEDIUM' };
  }
  // Медвежий пин-бар (длинный хвост сверху)
  if (upperShadow > bodySize * 2 && lowerShadow < upperShadow / 2) {
    return { pattern: 'Pin Bar', type: 'BEARISH', reliability: 'MEDIUM' };
  }

  // 2. ПОГЛОЩЕНИЕ (Engulfing)
  // Логика: тело текущей свечи полностью перекрывает тело предыдущей
  const prevBodySize = Math.abs(previous.close - previous.open);
  
  if (current.close > current.open && previous.close < previous.open) {
    if (current.close > previous.open && current.open < previous.close) {
      return { pattern: 'Engulfing', type: 'BULLISH', reliability: 'HIGH' };
    }
  }
  if (current.close < current.open && previous.close > previous.open) {
    if (current.close < previous.open && current.open > previous.close) {
      return { pattern: 'Engulfing', type: 'BEARISH', reliability: 'HIGH' };
    }
  }

  // 3. ДИВЕРГЕНЦИЯ RSI (Простейшая логика)
  // Логика: Цена ставит новый экстремум, а RSI — нет
  if (current.rsi && previous.rsi) {
    const prePrevious = candles[candles.length - 3];
    if (current.low < previous.low && current.rsi > previous.rsi) {
      return { pattern: 'RSI Divergence', type: 'BULLISH', reliability: 'HIGH' };
    }
    if (current.high > previous.high && current.rsi < previous.rsi) {
      return { pattern: 'RSI Divergence', type: 'BEARISH', reliability: 'HIGH' };
    }
  }

  return null;
}

export const addIndicatorsToCandles = (candlesItems: MarketCheeseItem[]): Candle[] => {
  const candles: Candle[] = candlesItems.map((c: any) => {
        const dt = DateTime.fromSeconds(c.date).setZone("Europe/Moscow");
        return {
          dt,
          dateStr: dt.toFormat('yyyy-MM-dd'),
          fullTimeStr: dt.toFormat('yyyy-MM-dd HH:mm:ss'),
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: c.volume || 0,
          rsi: 0,
          ema20: 0,
          ema50: 0,
          ema200: 0,
          atr: 0,
          bollingerBands: { upper: 0, middle: 0, lower: 0 },
          macd: { macdLine: 0, signalLine: 0 }
        };
      }).reverse();
      
  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, 14);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const atrValues = calculateATR(candles, 14);
  const bollingerBands = calculateBollingerBands(closes, 14, 2);
  const macd = calculateMACD(closes, 12, 26, 9);

  candles.forEach((candle, index) => {
    candle.rsi = rsi[index-1] || 0; // RSI начинается с 1-й свечи, поэтому смещаем индекс
    candle.ema20 = ema20[index] || 0;
    candle.ema50 = ema50[index] || 0;
    candle.ema200 = ema200[index] || 0;
    candle.atr = atrValues[index] || 0;
    candle.bollingerBands = bollingerBands[index] || 0;
    candle.macd = {
      macdLine: macd.macdLine[index] || 0,
      signalLine: macd.signalLine[index] || 0
    };
  });
  return candles;
}


export { calculateSignal, detectReversalPatterns };

export { calculateSMA, calculateRSI, calculateATR, calculateEMA, calculateEntryPrice, calculateStopLoss, calculateBollingerBands, calculateMACD, findForexLevels };