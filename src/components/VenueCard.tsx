import { Link } from 'wouter';
import { useI18n } from '../i18n/context';
import { districtName, formatNumber, formatRating } from '../i18n/locale';
import type { VenueListItem } from '../lib/catalog/filters';
import { venueName } from '../lib/catalog/names';
import { telHref } from '../lib/links';

export function VenueCard({ venue }: { venue: VenueListItem }) {
  const { t, lang } = useI18n();
  const meta = [
    t.venue.category[venue.category],
    venue.district && districtName(venue.district, lang),
  ]
    .filter(Boolean)
    .join(' · ');
  const google =
    venue.google_rating !== null
      ? t.venue.google(formatRating(venue.google_rating, lang), venue.google_reviews_count ?? 0)
      : venue.google_reviews_count
        ? t.venue.googleCount(venue.google_reviews_count)
        : t.venue.googleNone;

  return (
    <li className="card venue-card">
      <Link href={`/venue/${venue.id}`} className="venue-card__link">
        <h3 className="venue-card__name">{venueName(venue, lang)}</h3>
        <p className="venue-card__meta">{meta}</p>
        <p className="venue-card__rating">{google}</p>
      </Link>
      <div className="venue-card__footer">
        {venue.is_24_7 && <span className="badge">{t.venue.is247}</span>}
        {venue.is_demo && <span className="badge badge--muted">{t.demoBadge}</span>}
        {venue.distanceKm !== null && (
          <span className="venue-card__distance">
            {t.venue.distance(formatNumber(venue.distanceKm, lang, 1))}
          </span>
        )}
        {venue.phone && (
          <a className="button button--secondary venue-card__call" href={telHref(venue.phone)}>
            {t.venue.call}
          </a>
        )}
      </div>
    </li>
  );
}
