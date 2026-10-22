import { init, isTMA, miniApp, openLink, openTelegramLink } from '@telegram-apps/sdk';

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

/**
 * Внутри Telegram открывает ссылку средствами клиента (внешний браузер или чат) и возвращает true;
 * вне Telegram — false, и срабатывает обычная ссылка <a target="_blank">.
 */
export function openInTelegram(url: string): boolean {
  try {
    if (url.startsWith('https://t.me/')) {
      if (!openTelegramLink.isAvailable()) return false;
      openTelegramLink(url);
      return true;
    }
    if (!openLink.isAvailable()) return false;
    openLink(url);
    return true;
  } catch {
    return false;
  }
}
