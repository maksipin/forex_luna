import { MarketCheeseItem } from "@/app/actions/forexActions";
import { TradeSignal } from "@/app/statistic/page";

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

const calculateATR = (data: MarketCheeseItem[], period: number) => {
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

interface Candle {
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ForexLevel {
  price: number;
  touches: number;
  strength: number;
  isPsychological: boolean;
}

const findForexLevels = (
  data: MarketCheeseItem[],
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

export { calculateSignal,  };

export { calculateSMA, calculateRSI, calculateATR, calculateEMA, calculateEntryPrice, calculateStopLoss, calculateBollingerBands, calculateMACD, findForexLevels };