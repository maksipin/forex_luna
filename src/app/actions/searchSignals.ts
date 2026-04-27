import { DateTime } from "luxon";
import { Candle, CombinedSymbolData, MarketCheeseItem } from "./forexActions";
import { findForexLevels } from "@/lib/indicatorsUtils";

export const searchLunaSignals =  (candles: Candle[], symbol: string) => {

    const signals = [];
    const POINT = 0.00001;
    const takeProfitPoints = 1; // Цель в ATR

    const candlesPerDay = candles.filter(c => c.dateStr === DateTime.now().setZone("Europe/Moscow").startOf('day').toFormat('yyyy-MM-dd'));
    const dailyCandle = candlesPerDay.reduce((acc, curr, index) => {
      if (index === 0) {
        acc = {...curr};
      } else {
          acc.high = Math.max(acc.high, curr.high),
          acc.low = Math.min(acc.low, curr.low),
        //   acc.open = curr.open,
          acc.close = curr.close,
          acc.volume = acc.volume ? acc.volume + (curr.volume || 0) : curr.volume
      }
      return acc;
    }, {} as Candle);

    const hourlyCandles = candlesPerDay.slice(candlesPerDay.length - 2);

    const dailyGreen = dailyCandle.close > dailyCandle.open;
    const dailyRed = dailyCandle.close < dailyCandle.open;
    
    const allHourlyGreen = hourlyCandles.every(h => h.close > h.open);
    const allHourlyRed = hourlyCandles.every(h => h.close < h.open);
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (dailyGreen && allHourlyGreen) signal = 'BUY';
    if (dailyRed && allHourlyRed) signal = 'SELL';

    const levels = findForexLevels(candles, 5, 30, 10)

    // const hasLevels = levels.find(l => hourlyCandles[1].close + hourlyCandles[1].atr > l.price && hourlyCandles[1].close - hourlyCandles[1].atr < l.price)

    const hasLevels = levels.find(l => hourlyCandles[1].close < hourlyCandles[1].atr + l.price && hourlyCandles[1].close > l.price - hourlyCandles[1].atr )
   

    return {
        symbol,
        signal,
        daily: dailyCandle,
        hourly: hourlyCandles,
        levels,
        hasLevels
    }
};      