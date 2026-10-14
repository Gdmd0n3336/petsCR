import { init, isTMA, miniApp } from '@telegram-apps/sdk';

export type TelegramEnv = { inTelegram: boolean };

/**
 * Единственная точка входа в Telegram SDK. Никогда не бросает:
 * вне Telegram (или при сбое SDK) приложение работает как обычный сайт.
 */
export function initTelegram(): TelegramEnv {
  try {
    if (!isTMA()) return { inTelegram: false };
    init();
    miniApp.ready.ifAvailable();
    return { inTelegram: true };
  } catch (error) {
    if (import.meta.env.DEV) {
      // Только тип ошибки: текст ошибки SDK может содержать launch params / initData.
      const kind = error instanceof Error ? error.name : typeof error;
      console.warn(`[telegram] SDK init failed (${kind}), running in browser mode`);
    }
    return { inTelegram: false };
  }
}
