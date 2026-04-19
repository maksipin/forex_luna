// src/app/api/bot/route.ts
import { Bot, webhookCallback } from "grammy";
import { MAJORS, getAppConfig } from "@/lib/forexUtils";
import { fetchComplexSymbolData } from "@/app/actions/forexActions";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

// Обработка команды /analyze
bot.command("analyze", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  
  // Проверка прав (чтобы только ты мог запускать анализ)
  if (chatId !== process.env.TELEGRAM_CHAT_ID) {
    return ctx.reply("У вас нет прав для запуска этой команды.");
  }

  await ctx.reply("🚀 Запускаю полный анализ мажоров... Это займет несколько минут из-за лимитов API.");

  const config = getAppConfig();
  
  // Запускаем цикл анализа
  for (const symbol of MAJORS) {
    await ctx.reply(`🔍 Анализирую ${symbol}...`);
    
    // fetchComplexSymbolData уже содержит логику отправки сообщения с результатом
    await fetchComplexSymbolData(symbol);
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, config.apiInterval * 1000));
  }

  await ctx.reply("✅ Анализ всех пар завершен.");
});

// Экспортируем функцию для обработки POST-запросов от Telegram
export const POST = webhookCallback(bot, "std/http");