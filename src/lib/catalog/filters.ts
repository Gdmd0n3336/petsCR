import { distanceKm, type LatLng } from '../geo';
import { matchesArea, matchesName } from '../search';
import type { Venue } from './types';

export type CatalogSort = 'google_rating' | 'reviews_count' | 'distance';
export type CatalogView = 'list' | 'map';

export type CatalogFilters = {
  query: string;
  only24: boolean;
  withPhone: boolean;
  /** area_ru выбранного района; null — все районы. */
  area: string | null;
  sort: CatalogSort;
  /** Вид каталога: список или карта (не фильтр, но живёт рядом, чтобы сохраняться при переходах). */
  view: CatalogView;
};

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  only24: false,
  withPhone: false,
  area: null,
  sort: 'google_rating',
  view: 'list',
};

export type VenueListItem = Venue & { distanceKm: number | null };

// Пустые значения всегда в конце списка, при равенстве — по числу отзывов Google, затем по id.
const desc = (a: number | null, b: number | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : b - a;
const asc = (a: number | null, b: number | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a - b;

function compare(sort: CatalogSort) {
  return (a: VenueListItem, b: VenueListItem) =>
    (sort === 'distance' ? asc(a.distanceKm, b.distanceKm) : 0) ||
    (sort === 'reviews_count' ? desc(a.google_reviews_count, b.google_reviews_count) : 0) ||
    (sort === 'google_rating' ? desc(a.google_rating, b.google_rating) : 0) ||
    desc(a.google_reviews_count, b.google_reviews_count) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** Поиск, фильтры и сортировка. Без координат пользователя сортировка «по расстоянию» не применяется. */
export function applyFilters(
  venues: readonly Venue[],
  filters: CatalogFilters,
  position: LatLng | null,
): VenueListItem[] {
  const sort = filters.sort === 'distance' && !position ? 'google_rating' : filters.sort;
  return venues
    .filter(
      (v) =>
        (!filters.only24 || v.is_24_7) &&
        (!filters.withPhone || Boolean(v.phone)) &&
        (filters.area === null || v.area_ru === filters.area) &&
        (matchesName([v.name_original, v.name_th, v.name_en, v.name_ru], filters.query) ||
          matchesArea([v.area_ru, v.area_en], filters.query)),
    )
    .map((v) => ({
      ...v,
      distanceKm:
        position && v.lat !== null && v.lng !== null
          ? distanceKm(position, { lat: v.lat, lng: v.lng })
          : null,
    }))
    .sort(compare(sort));
}

export type AreaOption = { value: string; ru: string; en: string | null };

/** Районы для фильтра: значение — area_ru, подписи — area_ru / area_en из базы. */
export function areasOf(venues: readonly Venue[]): AreaOption[] {
  const areas = new Map<string, AreaOption>();
  for (const v of venues) {
    if (!v.area_ru) continue;
    const known = areas.get(v.area_ru);
    if (!known || (!known.en && v.area_en))
      areas.set(v.area_ru, { value: v.area_ru, ru: v.area_ru, en: v.area_en });
  }
  return [...areas.values()].sort((a, b) => a.ru.localeCompare(b.ru, 'ru'));
}

export function isFiltered(filters: CatalogFilters): boolean {
  return (
    Boolean(filters.query.trim()) || filters.only24 || filters.withPhone || filters.area !== null
  );
}
