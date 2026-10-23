import { detectTelegramLang, readStoredLang, storeLang } from '../i18n/locale';
import { venueIdFromStartParam, type TelegramEnv } from './telegram';

/** Действия при запуске внутри Telegram, до первой отрисовки. */
export function applyTelegramLaunch(telegram: TelegramEnv): void {
  if (!telegram.inTelegram) return;
  // Язык по умолчанию при первом запуске; выбор человека (RU/EN) потом сохраняется и главнее.
  if (!readStoredLang()) storeLang(detectTelegramLang(telegram.languageCode));
  // Ссылка t.me/<бот>?startapp=venue_<id> сразу открывает карточку заведения.
  const venueId = venueIdFromStartParam(telegram.startParam);
  if (venueId) window.history.replaceState(null, '', `#/venue/${encodeURIComponent(venueId)}`);
}
