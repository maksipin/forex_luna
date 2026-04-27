// src/app/api/cron/analyze-majors/route.ts
import { NextResponse } from 'next/server';
import { fetchMarketCheeseComplexData } from '@/app/actions/forexActions';
import { ALL_SYMBOLS } from '@/consts/consts';

// Это предотвратит кэширование самого запроса к API роуту
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Защита: проверяем секретный ключ в заголовках (чтобы никто не спамил API)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Запускаем процесс в фоне
  runBackgroundAnalysis();

  return NextResponse.json({ message: 'Анализ запущен' });
}

async function runBackgroundAnalysis() {
  for (let i = 0; i < ALL_SYMBOLS.length; i++) {
    const symbol = ALL_SYMBOLS[i];
    
    // Вызываем нашу существующую функцию (она сама отправит уведомление в ТГ при наличии сигнала)
    await fetchMarketCheeseComplexData(symbol, true);

  }
}