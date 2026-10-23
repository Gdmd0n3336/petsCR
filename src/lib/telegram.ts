import {
  init,
  isTMA,
  miniApp,
  openLink,
  openTelegramLink,
  retrieveLaunchParams,
} from '@telegram-apps/sdk';

export type TelegramEnv = {
  inTelegram: boolean;
  /** startapp из ссылки t.me/<бот>?startapp=… (tgWebAppStartParam). */
  startParam?: string;
  /** Язык клиента Telegram (initData.user.language_code) — только для выбора языка интерфейса. */
  languageCode?: string;
};

/**
 * Единственная точка входа в Telegram SDK. Никогда не бросает:
 * вне Telegram (или при сбое SDK) приложение работает как обычный сайт.
 */
export function initTelegram(): TelegramEnv {
  try {
    if (!isTMA()) return { inTelegram: false };
    init();
    miniApp.ready.ifAvailable();
    return { inTelegram: true, ...readLaunch() };
  } catch (error) {
    if (import.meta.env.DEV) {
      // Только тип ошибки: текст ошибки SDK может содержать launch params / initData.
      const kind = error instanceof Error ? error.name : typeof error;
      console.warn(`[telegram] SDK init failed (${kind}), running in browser mode`);
    }
    return { inTelegram: false };
  }
}

/** Параметры запуска читаем мягко: их отсутствие или ошибка разбора не мешают работе. */
function readLaunch(): Pick<TelegramEnv, 'startParam' | 'languageCode'> {
  try {
    const lp = retrieveLaunchParams();
    const startParam = lp.tgWebAppStartParam ?? lp.tgWebAppData?.start_param;
    const languageCode = lp.tgWebAppData?.user?.language_code;
    return {
      ...(startParam ? { startParam } : {}),
      ...(languageCode ? { languageCode } : {}),
    };
  } catch {
    return {};
  }
}

/** startapp=venue_<id> → id карточки; всё остальное игнорируем (данные из ссылки недоверенные). */
export function venueIdFromStartParam(startParam: string | undefined): string | null {
  const match = /^venue_([A-Za-z0-9-]{1,64})$/.exec(startParam ?? '');
  return match ? match[1]! : null;
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
