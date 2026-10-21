import type { ReviewRow, VenueRow } from './schema';

/** Статистика по собранным отзывам (venue_review_stats). Это НЕ рейтинг Google. */
export type CollectedStats = { reviewsCount: number; avgRating: number | null };

export type Venue = VenueRow & { collected: CollectedStats | null };
export type Review = ReviewRow;

export type ReviewSort = 'newest' | 'lowest';
export type ReviewQuery = {
  venueId: string;
  sort: ReviewSort;
  /** Фильтр по оценке 1–5; null — все оценки. */
  rating: number | null;
  /** Номер страницы с нуля. */
  page: number;
};
export type ReviewPage = { items: Review[]; hasMore: boolean };

/** live — Supabase; sample — образец данных из fixtures (тестовый режим). */
export type CatalogMode = 'live' | 'sample';

export interface CatalogSource {
  readonly mode: CatalogMode;
  loadVenues(): Promise<Venue[]>;
  loadReviews(query: ReviewQuery): Promise<ReviewPage>;
}

export const REVIEWS_PAGE_SIZE = 10;

/** Ошибка загрузки без подробностей: текст не раскрывает адреса и ключи. */
export class CatalogLoadError extends Error {
  constructor() {
    super('Catalog data could not be loaded');
    this.name = 'CatalogLoadError';
  }
}
