// src/lib/telegram.ts
import { Bot } from "grammy";
import { CombinedSymbolData } from "@/app/actions/forexActions";
import { calculateSignal } from "./forexUtils";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

export async function sendSignalNotification(data: CombinedSymbolData) {
  const signal = calculateSignal(data);
  
  // Отправляем уведомление только при наличии четкого сигнала
  if (signal === 'NEUTRAL') return;

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  // Хелпер для определения цвета свечи (Emoji)
  const getCandleEmoji = (open: string, close: string) => 
    parseFloat(close) >= parseFloat(open) ? "🟢 Зеленая" : "🔴 Красная";

  const getSimpleEmoji = (open: string, close: string) => 
    parseFloat(close) >= parseFloat(open) ? "🟢" : "🔴";

  // Форматирование времени по МСК
  const nowMSK = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Moscow'
  }).format(new Date());

  const getHourOnly = (datetime: string): string =>{
    const date = new Date(datetime);
    return `${date.getHours()}H`;
};

  // Подготовка данных для сообщения
  const signalText = signal === 'BUY' ? "🟢 ПОКУПКА" : "🔴 ПРОДАЖА";
  const dailyEmoji = getCandleEmoji(data.daily!.open, data.daily!.close);
  
  const hourlyInfo = data.hourly?.map(h => 
    `${getSimpleEmoji(h.open, h.close)} (${getHourOnly(h.datetime)} час)`
  ).join(' и ');

  const message = `${signalText} ${data.symbol}

📊 Анализ свечей:
• Дневная свеча: ${dailyEmoji}
• Часовые свечи: ${hourlyInfo}

⏰ Время сигнала: ${nowMSK}`;

  try {
    await bot.api.sendMessage(chatId, message);
  } catch (error) {
    console.error("Ошибка при отправке в Telegram:", error);
  }
}