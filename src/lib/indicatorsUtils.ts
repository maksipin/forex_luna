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

const calculateATR = (highs: number[], lows: number[], closes: number[], period: number) => {
  const atr: number[] = [];
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      atr.push(highs[i] - lows[i]);
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
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

const formatCandleHour = (datetime: string): string => {
  const date = new Date(new Date(datetime).toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
  return `${date.getHours()}H`;
};

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

export { calculateSignal, formatCandleHour };

export { calculateSMA, calculateRSI, calculateATR, calculateEMA, calculateEntryPrice, calculateStopLoss };