import type { VenueRow } from '../lib/catalog/schema';
import type { Review, Venue } from '../lib/catalog/types';

/** Небольшие построители строк для тестов: только нужные поля, остальное по умолчанию. */
export function makeVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 'v1',
    category: 'vet_clinic',
    name_original: 'Vet Clinic',
    name_ru: 'Ветклиника',
    name_en: 'Vet Clinic',
    name_th: null,
    area_ru: 'Паттайя',
    area_en: 'Pattaya',
    lat: 12.93,
    lng: 100.88,
    phone: null,
    website: null,
    opening_hours: null,
    is_24_7: false,
    address: null,
    google_rating: null,
    google_reviews_count: null,
    google_place_id: null,
    is_demo: false,
    collected: null,
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    venue_id: 'v1',
    author_display: 'Anna K.',
    rating_overall: 5,
    text: 'Great clinic',
    text_lang: 'en',
    review_date: '2026-10-01',
    price_paid: null,
    text_ru: null,
    text_en: 'Great clinic',
    needs_ru: true,
    needs_en: false,
    is_demo: false,
    ...overrides,
  };
}

/** Строка venues в том виде, как её отдаёт база (без вычисленного поля collected). */
export function makeVenueRow(overrides: Partial<VenueRow> = {}): VenueRow {
  const { collected: _collected, ...row } = makeVenue(overrides);
  void _collected;
  return row;
}
