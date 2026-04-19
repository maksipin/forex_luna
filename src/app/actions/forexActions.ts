'use server';

import { sendSignalNotification } from "@/lib/telegram";
import  twelvedata  from "twelvedata";

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

export async function fetchComplexSymbolData(symbol: string): Promise<CombinedSymbolData> {
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
      }),
      // 2. Две последние часовые свечи (outputsize=2)
      sdk.timeSeries({
        symbol: uppercaseSymbol,
        interval: '1h',
        outputsize: 2,
      }),
    ]);

    // Простая проверка на корректность ответа (Twelve Data возвращает статус в теле)
    if (dailyRes.status === 'error' || hourlyRes.status === 'error') {
      throw new Error(dailyRes.message || hourlyRes.message || 'Ошибка API');
    }

    const result = {
        symbol: uppercaseSymbol,
        daily: dailyRes.values?.[0] || null, // Берем первую (и единственную)
        hourly: hourlyRes.values || null,   // Берем массив из двух
    };

    // ВЫЗОВ БОТА: Отправляем уведомление в фоне
    // Не используем await, чтобы не задерживать ответ фронтенду
    if (result.daily && result.hourly) {
       sendSignalNotification(result).catch(console.error);
    }

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