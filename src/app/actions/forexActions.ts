'use server';

import { sendSignalNotification } from "@/lib/telegram";
import  twelvedata  from "twelvedata";
import { DateTime } from 'luxon';
import { SYMBOL_MAP } from "@/lib/forexUtils";
import { rsi, RSI } from "technicalindicators";
import { calculateRSI } from "@/lib/indicatorsUtils";

const config = {
  key: process.env.TWELVE_DATA_API_KEY,
};

const sdk = twelvedata(config);

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

type MarketCheeseItem = {
      date: number; // UNIX timestamp
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number; // Не всегда приходит
    }

interface MarketCheeseCandle {
  dt: DateTime;
  dateStr: string;
  fullTimeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  rsi: number
}

export type Candle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
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
    // const nowTimestamp = DateTime.now().toFormat('yyyyMMddHHmm');
    // console.log(`Запрос данных MarketCheese для ${symbol} (ID: ${symbolId}) на ${nowTimestamp}`);

    // // Формируем URL для дневных и часовых данных
    // // Нам нужно 2 дневных (чтобы точно иметь одну закрытую) и 4 часовых
    // const dailyUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=D1&direction=-1&count=2&date=${nowTimestamp}`;
    // const hourlyUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=4&date=${nowTimestamp}`;

    // // Запрашиваем данные параллельно
    // const [dailyResJ, hourlyResJ] = await Promise.all([
    //   fetch(dailyUrl).then(res => res.json()) as Promise<MarketCheeseResponse>,
    //   fetch(hourlyUrl).then(res => res.json()) as Promise<MarketCheeseResponse> 
    // ]);


    // 1. Берем текущий момент времени
const now = DateTime.now().setZone("Europe/Moscow");

// 2. Устанавливаем начало дня (00:00:00) для выбранной даты
const startDt = now.startOf('day');

// 3. Считаем разницу в часах между началом дня и "сейчас"
// Используем Math.abs на всякий случай и ceil для округления вверх
const hoursDiff = Math.ceil(now.diff(startDt, 'hours').hours);

// 4. Формируем count. 
// Добавляем +5 или +10 как "запас", чтобы точно захватить последнюю закрытую свечу
const count = Math.min(hoursDiff -1 , 24); 

// Параметр date для API (точка отсчета — сейчас)
const dateParam = now.toFormat('yyyyMMddHHmm');

    const hourlyUrl = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;
    const hourlyResJ = await fetch(hourlyUrl).then(res => res.json()) as MarketCheeseResponse;


    const hourlyRes = hourlyResJ.data.items;
    const dailyRes = hourlyRes.reduce((acc, curr, index) => {
      if (index === 0) {
        acc = {...curr};
      } else {
        acc = {
          high: Math.max(acc.high, curr.high),
          low: Math.min(acc.low, curr.low),
          open: curr.open,
          close: acc.close,
          date: curr.date, // Дата дневной свечи будет датой первой часовой свечи
          volume: acc.volume ? acc.volume + (curr.volume || 0) : curr.volume
        }
      }
      return acc;
    }, {} as MarketCheeseItem);

    if (!Array.isArray(hourlyRes)) {
      throw new Error('Некорректный ответ от MarketCheese API');
    }

  
    const formatCandle = (c: any) => ({
      datetime: typeof c.date === 'number' 
        ? DateTime.fromSeconds(c.date).setZone("Europe/Moscow").toFormat('yyyy-MM-dd HH:mm:ss')
        : c.date,
      open: c.open.toString(),
      high: c.high.toString(),
      low: c.low.toString(),
      close: c.close.toString(),
      volume: c.volume?.toString() ||  "0" // MarketCheese не всегда отдает объем в этом эндпоинте
    });

    // console.log(`MarketCheese сырые данные для ${symbol}:`, { now, startDt, hoursDiff, count, daily: dailyRes, hourly: hourlyRes }); 

    
    const dailyCandle = formatCandle(dailyRes);
    
    
    const hourlyCandles = [formatCandle(hourlyRes[1]), formatCandle(hourlyRes[0])];

    const result: CombinedSymbolData = {
      symbol: symbol.toUpperCase(),
      daily: dailyCandle,
      hourly: hourlyCandles,
    };
    // console.log(`MarketCheese сырые данные для ${symbol}:`, { result, hourly: result.hourly }); 
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
  startDate: string, 
  endDate: string,   
  takeProfitPoints: number = 150,
  rsiPeriod: number = 14 // Добавили период RSI
) {
  const symbolId = SYMBOL_MAP[symbolName] || 68;
  
  const startDt = DateTime.fromISO(startDate).setZone("Europe/Moscow").startOf('day');
  const endDt = DateTime.fromISO(endDate).setZone("Europe/Moscow").endOf('day');
  
  const hoursDiff = Math.ceil(endDt.diff(startDt, 'hours').hours);
  
  // ВАЖНО: Добавляем к count период RSI (например, 14) + запас (например, 50), 
  // чтобы индикатор успел стабилизироваться до начала анализируемого периода.
  const count = Math.max(hoursDiff + rsiPeriod, 200); 
  
  const dateParam = endDt.toFormat('yyyyMMddHHmm');
  const url = `https://api.marketcheese.com/widgets/charts/quotes?symbol=${symbolId}&timeframe=H1&direction=-1&count=${count}&date=${dateParam}`;

  try {
    const response = await fetch(url);
    const rawDataJson: MarketCheeseResponse = await response.json();
    const rawData = rawDataJson.data.items;

    // 1. Базовая обработка свечей
    const candles: any[] = rawData.map((c: any) => {
      const dt = DateTime.fromSeconds(c.date).setZone("Europe/Moscow");
      return {
        dt,
        dateStr: dt.toFormat('yyyy-MM-dd'),
        fullTimeStr: dt.toFormat('yyyy-MM-dd HH:mm:ss'),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
      };
    }).reverse();

    if (candles.length < rsiPeriod) return [];

    // 2. РАСЧЕТ RSI
    const closes = candles.map(c => c.close);
    const rsiValues = RSI.calculate({
      values: closes,
      period: rsiPeriod
    });

    const rsiValuesTest = calculateRSI(closes, rsiPeriod);
    console.log("RSI от technicalindicators:", rsiValues);
    console.log("RSI от кастомной функции:", rsiValuesTest);

    // Сопоставляем RSI со свечами. 
    // technicalindicators возвращает массив короче на rsiPeriod элементов.
    // rsiValues[0] соответствует свече с индексом rsiPeriod в массиве candles.
    candles.forEach((candle, index) => {
      if (index >= rsiPeriod) {
        // candle.rsi = parseFloat(rsiValues[index - rsiPeriod].toFixed(0));
        candle.rsi = rsiValuesTest[index-1];
      } else {
        candle.rsi = null; // Данных для расчета еще недостаточно
      }
    });

    const signals = [];
    const POINT = symbolName.includes('JPY') || symbolName.includes('XAU') ? 0.01 : 0.00001;
    const TARGET_DIFF = takeProfitPoints * POINT;

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
            rsi: c2.rsi // Теперь здесь актуальное значение RSI
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