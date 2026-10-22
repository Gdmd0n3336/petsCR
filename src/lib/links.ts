import { readConfig } from './config';

/** tel: только с цифрами и плюсом; если номеров несколько («038…, 081…»), берём первый. */
export function telHref(phone: string): string {
  const first = phone.split(/[,;/]|\s{2,}/)[0] ?? phone;
  return `tel:${first.replace(/[^\d+]/g, '')}`;
}

/** Маршрут в Google Картах по нашим координатам (Maps URLs, ключ не нужен). */
export function directionsUrl(lat: number, lng: number, placeId?: string | null): string {
  const params = new URLSearchParams({ api: '1', destination: `${lat},${lng}` });
  if (placeId) params.set('destination_place_id', placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Веб-адрес карточки: VITE_PUBLIC_BASE_URL или текущая страница, маршрут в хэше. */
export function venueWebUrl(venueId: string, base = readConfig().publicBaseUrl): string {
  const root = base ?? `${window.location.origin}${window.location.pathname}`;
  return `${root.replace(/#.*$/, '')}#/venue/${encodeURIComponent(venueId)}`;
}

/**
 * Ссылка на карточку для «Поделиться». Точка расширения: когда у бота будет короткое имя Mini App,
 * здесь будет t.me/<bot>/<app>?startapp=venue_<id> (и разбор startapp при запуске).
 */
export function venueShareTarget(venueId: string): string {
  return venueWebUrl(venueId);
}

/** Окно «Поделиться» Telegram (работает и из браузера). */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?${new URLSearchParams({ url, text }).toString()}`;
}
