// src/app/api/bot/route.ts
import { Bot, webhookCallback } from "grammy";
import { ALL_SYMBOLS } from "@/lib/forexUtils";
import { fetchMarketCheeseComplexData } from "@/app/actions/forexActions";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

// Обработка команды /analyze
bot.command("analyze", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  
  // Проверка прав (чтобы только ты мог запускать анализ)
  if (chatId !== process.env.TELEGRAM_CHAT_ID) {
    return ctx.reply("У вас нет прав для запуска этой команды.");
  }

  await ctx.reply("🚀 Запускаю полный анализ мажоров... Это займет несколько минут из-за лимитов API.");

  
  // Запускаем цикл анализа
  for (const symbol of ALL_SYMBOLS) {
    await ctx.reply(`🔍 Анализирую ${symbol}...`);
    
    // fetchComplexSymbolData уже содержит логику отправки сообщения с результатом
    await fetchMarketCheeseComplexData(symbol, true);
    
  }

  await ctx.reply("✅ Анализ всех пар завершен.");
});

// Экспортируем функцию для обработки POST-запросов от Telegram
export const POST = webhookCallback(bot, "std/http");