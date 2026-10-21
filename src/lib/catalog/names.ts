import type { Lang } from '../../i18n/locale';
import type { Venue } from './types';

type Names = Pick<Venue, 'name_original' | 'name_th' | 'name_en' | 'name_ru'>;

/** Правило показа 1: название как у источника, без перевода; запасная цепочка name_th → name_en → name_ru. */
export function venueName(venue: Names): string {
  return venue.name_original ?? venue.name_th ?? venue.name_en ?? venue.name_ru ?? '';
}

/**
 * Транслитерация по кнопке «По-русски» / «In English»: name_ru или name_en.
 * null — показывать нечего (нет поля или оно совпадает с оригиналом), кнопку не рисуем.
 */
export function venueTransliteration(venue: Names, lang: Lang): string | null {
  const value = lang === 'ru' ? venue.name_ru : venue.name_en;
  return value?.trim() && value !== venueName(venue) ? value : null;
}

/** Район: английское название из area_en, если его нет — русское; null — район не указан. */
export function areaName(venue: Pick<Venue, 'area_ru' | 'area_en'>, lang: Lang): string | null {
  return (lang === 'en' ? venue.area_en : null) ?? venue.area_ru ?? null;
}
