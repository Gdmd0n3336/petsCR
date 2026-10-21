import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { useReviews } from '../lib/catalog/context';
import type { ReviewSort } from '../lib/catalog/types';
import { ReviewItem } from './ReviewItem';
import { ScreenState } from './ScreenState';

const SORTS: ReviewSort[] = ['newest', 'lowest'];
const RATINGS = [5, 4, 3, 2, 1];

export function ReviewList({ venueId }: { venueId: string }) {
  const { t } = useI18n();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [rating, setRating] = useState<number | null>(null);
  const { status, items, hasMore, loadMore, retry } = useReviews({ venueId, sort, rating });

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="section-title">
        {t.reviews.title}
      </h2>
      <div className="filters__row">
        <div className="segmented" role="group" aria-label={t.reviews.sortLabel}>
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              className="segmented__item"
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
            >
              {t.reviews[s]}
            </button>
          ))}
        </div>
        <label className="select">
          <span className="visually-hidden">{t.reviews.ratingFilter}</span>
          <select
            value={rating ?? ''}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t.reviews.allRatings}</option>
            {RATINGS.map((n) => (
              <option key={n} value={n}>
                {t.reviews.stars(n)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {items.length > 0 && (
        <ul className="list">
          {items.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}
      {status === 'loading' && <ScreenState status="loading" />}
      {status === 'error' && <ScreenState status="error" onRetry={retry} />}
      {status === 'ready' && items.length === 0 && (
        <ScreenState
          status="empty"
          message={rating === null ? t.reviews.empty : t.reviews.emptyFiltered}
        />
      )}
      {status === 'ready' && hasMore && (
        <button type="button" className="button button--secondary button--wide" onClick={loadMore}>
          {t.reviews.more}
        </button>
      )}
    </section>
  );
}
