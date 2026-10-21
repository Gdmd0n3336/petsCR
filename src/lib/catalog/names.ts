import type { Lang } from '../../i18n/locale';
import type { Venue } from './types';

/** Правило показа 1: имя на языке интерфейса, запасной вариант — тайское, затем любое. */
export function venueName(
  venue: Pick<Venue, 'name_ru' | 'name_en' | 'name_th'>,
  lang: Lang,
): string {
  const own = lang === 'ru' ? venue.name_ru : venue.name_en;
  const other = lang === 'ru' ? venue.name_en : venue.name_ru;
  return own ?? venue.name_th ?? other ?? '';
}
