'use server';

import { sendSignalNotification } from "@/lib/telegram";
import  twelvedata  from "twelvedata";
import Taapi from 'taapi';
import { DateTime } from 'luxon';

const config = {
  key: process.env.TWELVE_DATA_API_KEY,
};

const sdk = twelvedata(config);

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



// Инициализация клиента (лучше вынести в отдельный конфиг-файл)
const taapiClient = new Taapi(process.env.TAAPI_API_KEY || "");
taapiClient.setProvider("polygon", process.env.POLYGON_API_KEY || "");
console.log("TAAPI Client initialized with key:", process.env.TAAPI_API_KEY);

export async function fetchTaapiPivots(symbol: string, interval: string = '1day') {
  try {
    // Важно: TAAPI ожидает формат символа через косую черту для Forex (например, EUR/USD)
    const formattedSymbol = symbol.includes('/') ? symbol : symbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
 // Можно указать тип: 'classic', 'fibonacci', 'camarilla', 'woodie', 'demark'
    const result = await taapiClient.getIndicator("pivotpoints", symbol, interval, { type: 'forex' });

    return {
      p: result.valueP,
      r1: result.valueR1,
      s1: result.valueS1,
      r2: result.valueR2,
      s2: result.valueS2
    };
  } catch (error: any) {
    // Обработка ошибки лимита (Rate Limit 429)
    if (error.status === 429) {
      console.warn("TAAPI: Превышен лимит запросов (1 запрос в 15 секунд)");
    }
    console.error("TAAPI Error:", error.message);
    return null;
  }
}

export async function fetchComplexSymbolData(symbol: string, bot?: boolean): Promise<CombinedSymbolData> {
  if (!symbol) return { symbol, daily: null, hourly: null, error: 'Символ не указан' };

  try {
    const uppercaseSymbol = symbol.toUpperCase();

    // Запрашиваем данные параллельно для скорости
    const [dailyRes, hourlyRes] = await Promise.all([
      // 1. Дневная свеча (outputsize=1)
      sdk.timeSeries({
        symbol: uppercaseSymbol,
        interval: '1day',
        outputsize: 1,
        timezone: 'Europe/Moscow'

      }),
      // 2. Две последние часовые свечи (outputsize=2)
      sdk.timeSeries({
        symbol: uppercaseSymbol,
        interval: '1h',
        outputsize: 3,
        timezone: 'Europe/Moscow'
      }),
// 3. Используем technicalIndicators для получения Pivot Points

    ]);

    // Простая проверка на корректность ответа (Twelve Data возвращает статус в теле)
    if (dailyRes.status === 'error' || hourlyRes.status === 'error') {
      throw new Error(dailyRes.message || hourlyRes.message || 'Ошибка API');
    }


    hourlyRes.values = hourlyRes.values?.slice(1, 3).reverse() || null; // Оставляем только 2 последние свечи

    console.log(`Данные для ${uppercaseSymbol}:`, { daily: dailyRes, hourly: hourlyRes }, dailyRes.values, hourlyRes.values);

    const result = {
        symbol: uppercaseSymbol,
        daily: dailyRes.values?.[0] || null, // Берем первую (и единственную)
        hourly: hourlyRes.values || null,   // Берем массив из двух
    };

    // ВЫЗОВ БОТА: Отправляем уведомление в фоне
    // Не используем await, чтобы не задерживать ответ фронтенду
    if (result.daily && result.hourly && bot) {
       sendSignalNotification(result).catch(console.error);
    }

    return result;
  } catch (error) {
    return { symbol, daily: null, hourly: null, error: "API Error" };
  }
}

export async function fetchAllSymbolData(symbol: string[], bot?: boolean): Promise<unknown> {
  if (!symbol) return { symbol, daily: null, hourly: null, error: 'Символ не указан' };

  try {
    const uppercaseSymbol = symbol.map(s => s.toUpperCase());

    // Запрашиваем данные параллельно для скорости
    const [dailyRes] = await Promise.all([
      // 1. Дневная свеча (outputsize=1)
      sdk.timeSeries({
        symbol: uppercaseSymbol,
        interval: ['1day', '1h'],
        outputsize: uppercaseSymbol.length * 2,
        timezone: 'Europe/Moscow'

      })
    ]);

 

    console.log(`Данные для :`, { daily: dailyRes}, dailyRes.values);

    const result = {
        symbol: uppercaseSymbol,
        daily: dailyRes.values?.[0] || null, // Берем первую (и единственную)

    };



    return result;
  } catch (error) {
    return { symbol, daily: null, hourly: null, error: "API Error" };
  }
}

export async function fetchForexPairs() {
  try {
    const response = await sdk.forexPairs({});
    
    if (response.status === 'error') {
      throw new Error(response.message);
    }

    // Возвращаем только нужные данные (например, первые 100 популярных или все)
    // Данные приходят в поле .data
    return response.data || [];
  } catch (error: any) {
    console.error("Ошибка при получении списка пар:", error);
    return [];
  }
}



interface TradeSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: string;
  targetPrice: number;
  resultTime: string | null;
  candlesPassed: number | null;
}

export async function analyzeMajorForexSignals(symbol: string, startDay: any, endDay: any, takeProfit: number): Promise<unknown> {
  const uppercaseSymbol = symbol.toUpperCase(); // Убираем слэш для Twelve Data
  
  // 1. Настройка временного диапазона (вчерашний торговый день)
  // const startDay = DateTime..now().setZone('Europe/Moscow').minus({ days: 9 });
  // const endDay = DateTime.now().setZone('Europe/Moscow').minus({ days: 5 });
  const start_date = startDay
  const end_date = endDay

  try {
    const response = await sdk.timeSeries({
     symbol: uppercaseSymbol,
      interval: '1h',
      start_date,
      end_date,
      timezone: 'Europe/Moscow',
      order: 'ASC' // От старых к новым
    });

    if (response.status === 'error') throw new Error(response.message);

    console.log(`Свечи для ${uppercaseSymbol} за вчерашний день:`, response.values.length);

    const candles = response.values;
    if (!candles || candles.length < 3) return [];

    const signals: TradeSignal[] = [];
    
    // Определяем стоимость пункта для мажоров
    // Для JPY пар пункт — это 0.001, для остальных — 0.00001
    const isJpyPair = uppercaseSymbol.includes('JPY');
    const POINT = isJpyPair ? 0.001 : 0.00001;
    const TARGET_DIFF = takeProfit * POINT;

    const dayOpen = parseFloat(candles[0].open);

    // 2. Перебор часовых свечей (начиная со второй, чтобы иметь пару C1 и C2)
    for (let i = 1; i < candles.length - 1; i++) {
        if(candles[i].datetime < start_date || candles[i].datetime > end_date) return; 
      const c1 = candles[i - 1];
      const c2 = candles[i];
      const c3 = candles[i + 1] || null; // На случай, если это последняя свеча дня

      console.log(`Анализ свечей для ${uppercaseSymbol} - C1: ${c1.datetime}, C2: ${c2.datetime}`);

          // 1. Парсим дату из строки (формат SQL: 2026-04-02 21:00:00)
      const dt = DateTime.fromFormat(c2.datetime, 'yyyy-MM-dd HH:mm:ss');

      // 2. Проверяем день недели (6 - суббота, 7 - воскресенье)
      const isWeekend = dt.weekday === 6 || dt.weekday === 7;

      // 3. Пропускаем итерацию, если это выходной
      if (isWeekend) continue;

      // --- НОВОЕ УСЛОВИЕ: ПРОВЕРКА ВРЕМЕНИ ---
      // Извлекаем час из строки datetime (формат "YYYY-MM-DD HH:mm:ss")
      const currentHour = parseInt(c2.datetime.split(' ')[1].split(':')[0]);

      // Проверяем, входит ли час закрытия сигнальной свечи в диапазон 08:00 - 20:00
      const isWithinTimeRange = currentHour >= 8 && currentHour <= 20;

      const c1_open = parseFloat(c1.open);
      const c1_close = parseFloat(c1.close);
      const c2_open = parseFloat(c2.open);
      const c2_close = parseFloat(c2.close);

      // Формируем направление "дневной свечи" на текущий момент
      const isDayBullish = c2_close > dayOpen;
      const isDayBearish = c2_close < dayOpen;

      // Проверяем направление двух часовых свечей
      const areHourliesBullish = c1_close > c1_open && c2_close > c2_open;
      const areHourliesBearish = c1_close < c1_open && c2_close < c2_open;

      let signalType: 'BUY' | 'SELL' | null = null;
      let targetPrice = 0;

      if (isDayBullish && areHourliesBullish && isWithinTimeRange) {
        signalType = 'BUY';
        targetPrice = c2_close + TARGET_DIFF;
      } else if (isDayBearish && areHourliesBearish && isWithinTimeRange) {
        signalType = 'SELL';
        targetPrice = c2_close - TARGET_DIFF;
      }

      if (signalType) {
        let resultTime: string | null = null;
        let candlesCount: number  = 0;

        // 3. Слежка за достижением цели в последующих свечах до конца дня
        for (let j = i + 1; j < candles.length; j++) {
          const futureCandle = candles[j];
          const high = parseFloat(futureCandle.high);
          const low = parseFloat(futureCandle.low);

          const dt = DateTime.fromFormat(candles[j].datetime, 'yyyy-MM-dd HH:mm:ss');

          // 2. Проверяем день недели (6 - суббота, 7 - воскресенье)
          const isWeekend = dt.weekday === 6 || dt.weekday === 7;

          // 3. Пропускаем итерацию, если это выходной
          if (isWeekend) continue;
          candlesCount++
          if (signalType === 'BUY' && high >= targetPrice) {
            resultTime = futureCandle.datetime;
            // candlesCount = j - i;
            break;
          }
          if (signalType === 'SELL' && low <= targetPrice) {
            resultTime = futureCandle.datetime;
            // candlesCount = j - i;
            break;
          }
        }

        if (resultTime !== null) {
          signals.push({
            symbol: uppercaseSymbol,
            type: signalType,
            entryPrice: c2_close,
            entryTime: c3?.datetime,
            targetPrice: parseFloat(targetPrice.toFixed(5)),
            resultTime,
            candlesPassed: candlesCount
          });
        }
      }
    }

    return signals;
  } catch (error) {
    console.error(`Ошибка анализа для ${symbol}:`, error);
    return [];
  }
}