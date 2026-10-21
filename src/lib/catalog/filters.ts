import { distanceKm, type LatLng } from '../geo';
import { matchesName } from '../search';
import type { Venue } from './types';

export type CatalogSort = 'google_rating' | 'reviews_count' | 'distance';

export type CatalogFilters = {
  query: string;
  only24: boolean;
  withPhone: boolean;
  /** null — все районы. */
  district: string | null;
  sort: CatalogSort;
};

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  only24: false,
  withPhone: false,
  district: null,
  sort: 'google_rating',
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
        (filters.district === null || v.district === filters.district) &&
        matchesName([v.name_ru, v.name_en, v.name_th], filters.query),
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

export function districtsOf(venues: readonly Venue[]): string[] {
  return [...new Set(venues.map((v) => v.district).filter((d): d is string => Boolean(d)))].sort(
    (a, b) => a.localeCompare(b, 'ru'),
  );
}

export function isFiltered(filters: CatalogFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.only24 ||
    filters.withPhone ||
    filters.district !== null
  );
}
