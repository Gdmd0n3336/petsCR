import { Link } from 'wouter';
import { useI18n } from '../i18n/context';
import { formatNumber, formatRating } from '../i18n/locale';
import type { VenueListItem } from '../lib/catalog/filters';
import { areaName } from '../lib/catalog/names';
import { useVenueName } from '../lib/catalog/useVenueName';
import { telHref } from '../lib/links';
import { VenueNameToggle } from './VenueName';

export function VenueCard({ venue }: { venue: VenueListItem }) {
  const { t, lang } = useI18n();
  const name = useVenueName(venue);
  const meta = [t.venue.category[venue.category], areaName(venue, lang)]
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
        <h3 className="venue-card__name">{name.shown}</h3>
        <p className="venue-card__meta">{meta}</p>
        <p className="venue-card__rating">{google}</p>
      </Link>
      <VenueNameToggle name={name} />
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
