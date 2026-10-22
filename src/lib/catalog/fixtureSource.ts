import { ReviewSchema, ReviewStatsSchema, VenueSchema, parseRows, type ReviewRow } from './schema';
import {
  REVIEWS_PAGE_SIZE,
  type CatalogSource,
  type CollectedStats,
  type ReviewQuery,
  type ReviewSort,
  type Venue,
} from './types';

type Sample = { venues: Venue[]; reviews: ReviewRow[] };

/** Тот же порядок, что у запроса к базе: даты по убыванию (без даты в конце), затем id. */
export function compareReviews(sort: ReviewSort) {
  const byDate = (a: ReviewRow, b: ReviewRow) => {
    if (a.review_date === b.review_date) return 0;
    if (a.review_date === null) return 1;
    if (b.review_date === null) return -1;
    return a.review_date < b.review_date ? 1 : -1;
  };
  const byId = (a: ReviewRow, b: ReviewRow) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return (a: ReviewRow, b: ReviewRow) =>
    (sort === 'lowest' ? a.rating_overall - b.rating_overall : 0) || byDate(a, b) || byId(a, b);
}

function parseSample(raw: unknown): Sample {
  const data = (raw ?? {}) as Record<string, unknown>;
  const collected = new Map<string, CollectedStats>();
  for (const row of parseRows(ReviewStatsSchema, data.venue_review_stats)) {
    collected.set(row.venue_id, {
      reviewsCount: row.reviews_count ?? 0,
      avgRating: row.avg_rating,
    });
  }
  // В образце есть is_published; показываем только опубликованное, как RLS в базе.
  const published = (rows: unknown) =>
    Array.isArray(rows)
      ? rows.filter((row) => (row as { is_published?: unknown })?.is_published !== false)
      : [];
  return {
    venues: parseRows(VenueSchema, published(data.venues)).map((venue) => ({
      ...venue,
      collected: collected.get(venue.id) ?? null,
    })),
    reviews: parseRows(ReviewSchema, published(data.reviews)),
  };
}

/** Тестовый режим: образец данных из fixtures/catalog.sample.json, загружается отдельным чанком. */
export function createFixtureSource(load: () => Promise<unknown>): CatalogSource {
  let sample: Promise<Sample> | undefined;
  const getSample = () =>
    (sample ??= load()
      .then(parseSample)
      .catch((error: unknown) => {
        sample = undefined; // «Повторить» загружает заново
        throw error;
      }));

  return {
    mode: 'sample',

    async loadVenues() {
      return (await getSample()).venues;
    },

    async loadReviews({ venueId, sort, rating, page }: ReviewQuery) {
      const all = (await getSample()).reviews
        .filter((r) => r.venue_id === venueId && (rating === null || r.rating_overall === rating))
        .sort(compareReviews(sort));
      const from = page * REVIEWS_PAGE_SIZE;
      return {
        items: all.slice(from, from + REVIEWS_PAGE_SIZE),
        hasMore: all.length > from + REVIEWS_PAGE_SIZE,
      };
    },
  };
}
