import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { ReviewSchema, ReviewStatsSchema, VenueSchema, parseRows } from './schema';
import {
  CatalogLoadError,
  REVIEWS_PAGE_SIZE,
  type CatalogSource,
  type CollectedStats,
  type ReviewQuery,
} from './types';

// Только нужные колонки (TASK-06, раздел «Данные»); is_demo — для пометки демо-записей (CLAUDE.md).
export const VENUE_COLUMNS =
  'id, category, name_ru, name_en, name_th, area_ru, area_en, lat, lng, phone, website, opening_hours, is_24_7, address, google_rating, google_reviews_count, google_place_id, is_demo';
export const REVIEW_COLUMNS =
  'id, venue_id, author_display, rating_overall, text, text_lang, review_date, price_paid, text_ru, text_en, needs_ru, needs_en, is_demo';
export const STATS_COLUMNS = 'venue_id, reviews_count, avg_rating';

function fail(error: unknown): never {
  if (import.meta.env.DEV) {
    // Только код ошибки PostgREST, без сообщения и адресов.
    const code = (error as { code?: unknown } | null)?.code;
    console.error(`[catalog] request failed${typeof code === 'string' ? ` (${code})` : ''}`);
  }
  throw new CatalogLoadError();
}

/** Источник на Supabase: только чтение (select), заведения одним запросом, отзывы страницами. */
export function createSupabaseSource(client: SupabaseClient<Database>): CatalogSource {
  return {
    mode: 'live',

    async loadVenues() {
      const [venues, stats] = await Promise.all([
        client.from('venues').select(VENUE_COLUMNS).eq('is_published', true),
        client.from('venue_review_stats').select(STATS_COLUMNS),
      ]);
      if (venues.error) fail(venues.error);
      // Статистика вторична: без неё каталог всё равно показываем.
      const collected = new Map<string, CollectedStats>();
      if (!stats.error) {
        for (const row of parseRows(ReviewStatsSchema, stats.data)) {
          collected.set(row.venue_id, {
            reviewsCount: row.reviews_count ?? 0,
            avgRating: row.avg_rating,
          });
        }
      }
      return parseRows(VenueSchema, venues.data).map((venue) => ({
        ...venue,
        collected: collected.get(venue.id) ?? null,
      }));
    },

    async loadReviews({ venueId, sort, rating, page }: ReviewQuery) {
      const from = page * REVIEWS_PAGE_SIZE;
      let query = client
        .from('reviews')
        .select(REVIEW_COLUMNS)
        .eq('venue_id', venueId)
        .eq('is_published', true);
      if (rating !== null) query = query.eq('rating_overall', rating);
      query =
        sort === 'lowest'
          ? query.order('rating_overall', { ascending: true })
          : query.order('review_date', { ascending: false, nullsFirst: false });
      if (sort === 'lowest')
        query = query.order('review_date', { ascending: false, nullsFirst: false });
      // Одна лишняя строка (range включает обе границы) показывает, есть ли следующая страница.
      const { data, error } = await query.order('id').range(from, from + REVIEWS_PAGE_SIZE);
      if (error) fail(error);
      const rows = parseRows(ReviewSchema, data);
      return { items: rows.slice(0, REVIEWS_PAGE_SIZE), hasMore: rows.length > REVIEWS_PAGE_SIZE };
    },
  };
}
