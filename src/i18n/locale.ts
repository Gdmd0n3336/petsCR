import { en } from './en';
import { ru, type Messages } from './ru';

export type Lang = 'ru' | 'en';
export const LANGS: readonly Lang[] = ['ru', 'en'];
export const MESSAGES: Record<Lang, Messages> = { ru, en };
const STORAGE_KEY = 'lapa.lang';

/** Первый выбор вне Telegram — язык браузера. */
export function detectLang(browserLangs: readonly string[]): Lang {
  return browserLangs[0]?.toLowerCase().startsWith('en') ? 'en' : 'ru';
}

/** Первый запуск в Telegram: русский, если язык клиента русский или не определён, иначе английский. */
export function detectTelegramLang(languageCode: string | undefined): Lang {
  return !languageCode || languageCode.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

/** Хранилище может быть недоступно (приватный режим, WebView): тогда язык просто не запоминается. */
export function readStoredLang(): Lang | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'ru' || value === 'en' ? value : null;
  } catch {
    return null;
  }
}

export function storeLang(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // без хранилища выбор живёт до перезагрузки
  }
}

export function initialLang(): Lang {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return readStoredLang() ?? detectLang(langs);
}

const LOCALES: Record<Lang, string> = { ru: 'ru-RU', en: 'en-GB' };

export function formatRating(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALES[lang], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, lang: Lang, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: fractionDigits }).format(
    value,
  );
}

/** Дата из базы (YYYY-MM-DD) без сдвига часового пояса. */
export function formatDate(isoDate: string, lang: Lang): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
