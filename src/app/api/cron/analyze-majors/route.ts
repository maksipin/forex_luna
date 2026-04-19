// src/app/api/cron/analyze-majors/route.ts
import { NextResponse } from 'next/server';
import { fetchComplexSymbolData } from '@/app/actions/forexActions';
import { MAJORS, delay, getAppConfig } from '@/lib/forexUtils';

// Это предотвратит кэширование самого запроса к API роуту
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Защита: проверяем секретный ключ в заголовках (чтобы никто не спамил API)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const config = getAppConfig();
  
  // Запускаем процесс в фоне
  runBackgroundAnalysis(config.apiInterval);

  return NextResponse.json({ message: 'Анализ запущен' });
}

async function runBackgroundAnalysis(interval: number) {
  for (let i = 0; i < MAJORS.length; i++) {
    const symbol = MAJORS[i];
    
    // Вызываем нашу существующую функцию (она сама отправит уведомление в ТГ при наличии сигнала)
    await fetchComplexSymbolData(symbol);

    // Пауза между мажорами, чтобы не забанили API
    if (i < MAJORS.length - 1) {
      await delay(interval * 1000);
    }
  }
}