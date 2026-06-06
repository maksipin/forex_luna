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

const calculateStochastic = (data: Candle[], period: number, dI: number = 3) => {
  const k: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      k.push(0);
    } else {
      let lowestLow = Infinity;
      let highestHigh = -Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        lowestLow = Math.min(lowestLow, data[j].low);
        highestHigh = Math.max(highestHigh, data[j].high);
      }
      const currentClose = data[i].close;
      if (highestHigh === lowestLow) {
        k.push(50);
      } else {
        const kValue = 100 * (currentClose - lowestLow) / (highestHigh - lowestLow);
        k.push(kValue);
      }
    }
  }
  const d = calculateSMA(k, dI);
  return { k, d };
};


interface VolumeBin {
  priceStart: number;
  priceEnd: number;
  volume: number;
  isPOC: boolean; // Точка контроля (максимальный объем)
}

interface VRVPResult {
  bins: VolumeBin[];
  pocPrice: number;
  valueArea: {
    high: number;
    low: number;
  };
}

/**
 * Функция расчета видимого профиля объема
 * @param candles - массив свечей видимой области
 * @param rowCount - количество уровней (строк) профиля
 */
function calculateVRVP(candles: Candle[], rowCount: number = 24): VRVPResult {
  if (candles.length === 0) return { bins: [], pocPrice: 0, valueArea: { high: 0, low: 0 } };

  // 1. Находим экстремумы видимого диапазона
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const binWidth = priceRange / rowCount;

  // 2. Инициализируем корзины (bins)
  const bins: VolumeBin[] = Array.from({ length: rowCount }, (_, i) => ({
    priceStart: minPrice + i * binWidth,
    priceEnd: minPrice + (i + 1) * binWidth,
    volume: 0,
    isPOC: false,
  }));

  // 3. Распределяем объем каждой свечи по бинам
  candles.forEach(candle => {
    // Находим индексы бинов, которые пересекает свеча (от low до high)
    const startIdx = Math.floor((candle.low - minPrice) / binWidth);
    const endIdx = Math.floor((candle.high - minPrice) / binWidth);

    // Важно: ограничиваем индексы в пределах массива
    const safeStart = Math.max(0, startIdx);
    const safeEnd = Math.min(rowCount - 1, endIdx);

    // Считаем, сколько бинов охватывает свеча
    const coveredBins = safeEnd - safeStart + 1;
    
    // Распределяем объем свечи равномерно между всеми затронутыми бинами
    // (Это стандартный подход для простых профилей)
    const volumePerBin = candle.volume / coveredBins;

    for (let i = safeStart; i <= safeEnd; i++) {
      bins[i].volume += volumePerBin;
    }
  });

  // 4. Находим POC (Point of Control)
  let maxVol = 0;
  let pocIdx = 0;
  bins.forEach((bin, idx) => {
    if (bin.volume > maxVol) {
      maxVol = bin.volume;
      pocIdx = idx;
    }
  });
  bins[pocIdx].isPOC = true;

  // 5. Расчет Value Area (VA) - зона 70% объема (упрощенно)
  const totalVolume = bins.reduce((acc, b) => acc + b.volume, 0);
  const targetVA = totalVolume * 0.7;
  
  let currentVAVolume = bins[pocIdx].volume;
  let upIdx = pocIdx;
  let downIdx = pocIdx;

  // Расширяем зону от POC вверх и вниз, пока не наберем 70%
  while (currentVAVolume < targetVA && (upIdx < rowCount - 1 || downIdx > 0)) {
    const volUp = upIdx < rowCount - 1 ? bins[upIdx + 1].volume : 0;
    const volDown = downIdx > 0 ? bins[downIdx - 1].volume : 0;

    if (volUp >= volDown && upIdx < rowCount - 1) {
      upIdx++;
      currentVAVolume += volUp;
    } else if (downIdx > 0) {
      downIdx--;
      currentVAVolume += volDown;
    } else {
      break; 
    }
  }

  return {
    bins,
    pocPrice: bins[pocIdx].priceStart + binWidth / 2,
    valueArea: {
      high: bins[upIdx].priceEnd,
      low: bins[downIdx].priceStart,
    }
  };
}



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

      // Убираем влияние самой старо�� свечи
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


export interface ReversalSignal {
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

export interface PivotPoints {
  pp: number;    // Pivot Point
  r1: number;    // Resistance 1
  r2: number;    // Resistance 2
  r3: number;    // Resistance 3
  s1: number;    // Support 1
  s2: number;    // Support 2
  s3: number;    // Support 3
}

/**
 * Calculate pivot points and support/resistance levels based on previous period data
 * @param high Previous period high price
 * @param low Previous period low price
 * @param close Previous period close price
 * @returns Object containing pivot point, resistance and support levels
 */
const calculatePivotPoints = (candels: Candle[]): PivotPoints[] => {
  const stochastic = candels.map(c => {
    const { high, low, close } = c;
    // Calculate the main pivot point
    const pp = (high + low + close) / 3;
    
    // Calculate resistance levels
    const r1 = (2 * pp) - low;
    const r2 = pp + (high - low);
    const r3 = high + 2 * (pp - low);
    
    // Calculate support levels
    const s1 = (2 * pp) - high;
    const s2 = pp - (high - low);
    const s3 = low - 2 * (high - pp);
    
    return {
      pp,
      r1,
      r2,
      r3,
      s1,
      s2,
      s3
    };
  });
  return stochastic;
};

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
          stoch: { k: 0, d: 0 },
          ema20: 0,
          ema50: 0,
          ema200: 0,
          atr: 0,
          bollingerBands: { upper: 0, middle: 0, lower: 0 },
          macd: { macdLine: 0, signalLine: 0 },
          pivot:  { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 }
        };
      }).reverse();
      
  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, 14);
  const stoch = calculateStochastic(candles, 14);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const atrValues = calculateATR(candles, 14);
  const bollingerBands = calculateBollingerBands(closes, 14, 2);
  const macd = calculateMACD(closes, 12, 26, 9);
  const pivotPoints = calculatePivotPoints(candles);
  const vrvp = calculateVRVP(candles);

  // console.log('vrvp', vrvp);
 

  candles.forEach((candle, index) => {
    candle.rsi = rsi[index-1] || 0; // RSI начинается с 1-й свечи, поэтому смещаем индекс
    candle.stoch = { k: stoch.k[index] || 0, d: stoch.d[index] || 0 };
    candle.ema20 = ema20[index] || 0;
    candle.ema50 = ema50[index] || 0;
    candle.ema200 = ema200[index] || 0;
    candle.atr = atrValues[index] || 0;
    candle.bollingerBands = bollingerBands[index] || 0;
    candle.macd = {
      macdLine: macd.macdLine[index] || 0,
      signalLine: macd.signalLine[index] || 0
    };
    candle.pivot = pivotPoints[index] || { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  });

  const hasPattern = detectReversalPatterns(candles);
  console.log('hasPattern', hasPattern);
  candles[candles.length - 1].reversalSignal = hasPattern;
  
  return candles;
}




export { calculateSignal, detectReversalPatterns };

export { calculateSMA, calculateRSI, calculateATR, calculateEMA, calculateEntryPrice, calculateStopLoss, calculateBollingerBands, calculateMACD, findForexLevels, calculatePivotPoints };