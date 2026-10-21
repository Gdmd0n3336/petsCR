import type { Lang } from '../../i18n/locale';
import type { Venue } from './types';

/** Правило показа 1: имя на языке интерфейса, запасной вариант — тайское, затем любое. */
/** Район: английское название из area_en, если его нет — русское; null — район не указан. */
export function areaName(venue: Pick<Venue, 'area_ru' | 'area_en'>, lang: Lang): string | null {
  return (lang === 'en' ? venue.area_en : null) ?? venue.area_ru ?? null;
}

export function venueName(
  venue: Pick<Venue, 'name_ru' | 'name_en' | 'name_th'>,
  lang: Lang,
): string {
  const own = lang === 'ru' ? venue.name_ru : venue.name_en;
  const other = lang === 'ru' ? venue.name_en : venue.name_ru;
  return own ?? venue.name_th ?? other ?? '';
}
