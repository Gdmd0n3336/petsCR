import { useI18n } from '../i18n/context';
import { formatRating } from '../i18n/locale';
import type { Venue } from '../lib/catalog/types';
import { Stars } from './Stars';

/** Правило 5: рейтинг Google и оценка по собранным отзывам — раздельно, у каждого подпись источника. */
export function RatingBlock({ venue }: { venue: Venue }) {
  const { t, lang } = useI18n();
  const { google_rating: rating, google_reviews_count: count, collected } = venue;

  return (
    <section className="ratings" aria-label={t.venue.ratingsTitle}>
      <div className="card rating" data-testid="rating-google">
        {rating !== null && <Stars value={rating} showNumber={false} />}
        <p className="rating__value">
          {rating !== null
            ? t.venue.google(formatRating(rating, lang), count ?? 0)
            : count
              ? t.venue.googleCount(count)
              : t.venue.googleNone}
        </p>
        <p className="rating__source">{t.venue.googleSource}</p>
      </div>
      <div className="card rating" data-testid="rating-collected">
        {collected?.avgRating != null && <Stars value={collected.avgRating} showNumber={false} />}
        <p className="rating__value">
          {collected && collected.reviewsCount > 0 && collected.avgRating !== null
            ? t.venue.collected(collected.reviewsCount, formatRating(collected.avgRating, lang))
            : t.venue.collectedNone}
        </p>
        <p className="rating__source">{t.venue.collectedSource}</p>
      </div>
    </section>
  );
}
