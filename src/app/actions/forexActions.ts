'use server';

import { sendSignalNotification } from "@/lib/telegram";
import  twelvedata  from "twelvedata";
import { DateTime } from 'luxon';
import { SYMBOL_MAP } from "@/lib/forexUtils";

const config = {
  key: process.env.TWELVE_DATA_API_KEY,
};

const sdk = twelvedata(config);

interface MarketCheeseResponse {
  status: "Success" | "Error";
  data: {
    items: {
      date: number; // UNIX timestamp
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number; // Не всегда приходит
    }[];
    metaData: {
      pageCount: number;
      totalCount: number;
    }
  };
}

interface MarketCheeseCandle {
  dt: DateTime;
  dateStr: string;
  fullTimeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Candle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export type CombinedSymbolData = {
  symbol: string;
  daily: Candle | null;
  hourly: Candle[] | null;
  error?: string;
};

export async function fetchMarketCheeseComplexData(symbol: string, bot?: boolean): Promise<CombinedSymbolData> {
  if (!symbol) return { symbol, daily: null, hourly: null, error: 'Символ не указан' };

  try {
    const symbolId = SYMBOL_MAP[symbol.toUpperCase()] || 68;
    const nowTimestamp = DateTime.now().toFormat('yyyyMMddHHmm');

    // Формируем URL для дневных и часовых данных
    // Нам нужно 2 дневных (чтобы точно иметь одну закрытую) и 4 часовых
    const dailyUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=D1&direction=-1&count=2&date=${nowTimestamp}`;
    const hourlyUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=4&date=${nowTimestamp}`;

    // Запрашиваем данные параллельно
    const [dailyResJ, hourlyResJ] = await Promise.all([
      fetch(dailyUrl).then(res => res.json()) as Promise<MarketCheeseResponse>,
      fetch(hourlyUrl).then(res => res.json()) as Promise<MarketCheeseResponse> 
    ]);

    const dailyRes = dailyResJ.data.items;
    const hourlyRes = hourlyResJ.data.items;



    if (!Array.isArray(dailyRes) || !Array.isArray(hourlyRes)) {
      throw new Error('Некорректный ответ от MarketCheese API');
    }

    // Приводим данные к формату Twelve Data (строковые значения)
    const formatCandle = (c: any) => ({
      datetime: typeof c.date === 'number' 
        ? DateTime.fromSeconds(c.date).toFormat('yyyy-MM-dd HH:mm:ss')
        : c.date,
      open: c.open.toString(),
      high: c.high.toString(),
      low: c.low.toString(),
      close: c.close.toString(),
      volume: c.volume?.toString() ||  "0" // MarketCheese не всегда отдает объем в этом эндпоинте
    });

    // console.log(`MarketCheese сырые данные для ${symbol}:`, { daily: dailyRes, hourly: hourlyRes }); 

    
    const dailyCandle = formatCandle(dailyRes[1]); // Берем последнюю полностью закрытую дневную
    
    
    const hourlyCandles = [formatCandle(hourlyRes[1]), formatCandle(hourlyRes[0])];

    const result: CombinedSymbolData = {
      symbol: symbol.toUpperCase(),
      daily: dailyCandle,
      hourly: hourlyCandles,
    };

    // ВЫЗОВ БОТА
    if (result.daily && result.hourly && bot) {
      // Функция sendSignalNotification должна уметь работать с этим форматом
      sendSignalNotification(result).catch(console.error);
    }

    return result;
  } catch (error) {
    console.error(`Ошибка MarketCheese для ${symbol}:`, error);
    return { symbol, daily: null, hourly: null, error: "MarketCheese API Error" };
  }
}

export async function analyzeMarketCheeseSignals(
  symbolName: string, 
  startDate: string, // Формат 'yyyy-MM-dd'
  endDate: string,   // Формат 'yyyy-MM-dd'
  takeProfitPoints: number = 150
) {
  const symbolId = SYMBOL_MAP[symbolName] || 68;
  
  // 1. Рассчитываем параметры для API
  const startDt = DateTime.fromISO(startDate);
  const endDt = DateTime.fromISO(endDate).endOf('day'); // До конца дня
  
  // Считаем сколько часов между датами, чтобы понять, какой 'count' запросить (с запасом)
  const hoursDiff = Math.ceil(endDt.diff(startDt, 'hours').hours);
  const count = Math.max(hoursDiff + 100, 200); // Минимум 200, либо по разнице дат + запас для поиска ТП
  
  // Для API MarketCheese параметр date — это точка, ОТ которой он пойдет назад
  const dateParam = endDt.toFormat('yyyyMMddHHmm');
  
  const url = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;

  try {
    const response = await fetch(url);
    const rawDataJson: MarketCheeseResponse = await response.json();
    const rawData = rawDataJson.data.items;

    // 2. Обработка входящих свечей
    const candles: MarketCheeseCandle[] = rawData.map((c: any) => {
      const dt = DateTime.fromSeconds(c.date);
      return {
        dt,
        dateStr: dt.toFormat('yyyy-MM-dd'),
        fullTimeStr: dt.toFormat('yyyy-MM-dd HH:mm:ss'),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close)
      };
    }).reverse(); // Переворачиваем, чтобы идти от старых к новым

    if (candles.length < 2) return [];

    const signals = [];
    const POINT = symbolName.includes('JPY') || symbolName.includes('XAU') ? 0.01 : 0.00001;
    const TARGET_DIFF = takeProfitPoints * POINT;

    // 3. Получаем список уникальных рабочих дней в периоде
    const uniqueDays = Array.from(new Set(
      candles
        .filter(c => c.dt >= startDt && c.dt <= endDt && c.dt.weekday < 6)
        .map(c => c.dateStr)
    ));

    // 4. Основной цикл по дням
    for (const day of uniqueDays) {
      const dayCandles = candles.filter(c => c.dateStr === day);
      if (dayCandles.length === 0) continue;

      const dayOpen = dayCandles[0].open; // Цена открытия дня

      // Проходим по свечам внутри дня
      for (let i = 1; i < dayCandles.length; i++) {
        const c1 = dayCandles[i - 1];
        const c2 = dayCandles[i];

        // Фильтр по времени: 08:00 - 20:00
        if (c2.dt.hour < 8 || c2.dt.hour > 20) continue;

        // Логика направления (ваша стратегия)
        const isDayBullish = c2.close > dayOpen;
        const isDayBearish = c2.close < dayOpen;
        const areHourliesBullish = c1.close > c1.open && c2.close > c2.open;
        const areHourliesBearish = c1.close < c1.open && c2.close < c2.open;

        let signalType: 'BUY' | 'SELL' | null = null;
        if (isDayBullish && areHourliesBullish) signalType = 'BUY';
        if (isDayBearish && areHourliesBearish) signalType = 'SELL';

        if (signalType) {
          const entryPrice = c2.close;
          const targetPrice = signalType === 'BUY' ? entryPrice + TARGET_DIFF : entryPrice - TARGET_DIFF;
          
          let resultTime = null;
          let candlesPassed = null;

          // Ищем достижение цели во ВСЕХ последующих свечах массива
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
            candlesPassed
          });
        }
      }
    }

    return signals;
  } catch (error) {
    console.error("MarketCheese API Error:", error);
    return [];
  }
}