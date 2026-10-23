import { useState } from 'react';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { OpeningHours } from '../components/OpeningHours';
import { RatingBlock } from '../components/RatingBlock';
import { ReviewList } from '../components/ReviewList';
import { ScreenState } from '../components/ScreenState';
import { SoonDialog } from '../components/SoonDialog';
import { VenueNameToggle } from '../components/VenueName';
import { useI18n } from '../i18n/context';
import { useVenues } from '../lib/catalog/context';
import type { Venue } from '../lib/catalog/types';
import { areaName, venueName } from '../lib/catalog/names';
import { useVenueName } from '../lib/catalog/useVenueName';
import { directionsUrl, telHref, telegramShareUrl, venueShareTarget } from '../lib/links';

export function VenueScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, lang } = useI18n();
  const { status, venues, retry } = useVenues();
  const [soonOpen, setSoonOpen] = useState(false);

  const back = (
    <button type="button" className="link-button back-button" onClick={onBack}>
      <Icon name="chevronLeft" size={22} />
      {t.venue.back}
    </button>
  );
  if (status === 'loading') return <ScreenState status="loading" />;
  if (status === 'error') return <ScreenState status="error" onRetry={retry} />;
  const venue = venues.find((v) => v.id === id);
  if (!venue) {
    return (
      <div className="stack">
        {back}
        <ScreenState status="empty" message={t.venue.notFound} />
      </div>
    );
  }

  const meta = [t.venue.category[venue.category], areaName(venue, lang)]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="stack venue">
      {back}
      <header className="venue__header">
        <VenueHeading venue={venue} />
        <p className="venue__meta">{meta}</p>
        <div className="venue__badges">
          {venue.is_24_7 && <span className="badge">{t.venue.is247}</span>}
          {venue.is_demo && <span className="badge badge--muted">{t.demoBadge}</span>}
        </div>
      </header>

      <RatingBlock venue={venue} />

      <nav className="actions" aria-label={t.venue.actionsLabel}>
        {venue.phone && (
          <a className="button button--secondary" href={telHref(venue.phone)}>
            {t.venue.call}
          </a>
        )}
        {venue.lat !== null && venue.lng !== null && (
          <ExternalLink
            className="button button--secondary"
            href={directionsUrl(venue.lat, venue.lng, venue.google_place_id)}
          >
            {t.venue.route}
          </ExternalLink>
        )}
        {venue.website && (
          <ExternalLink className="button button--secondary" href={venue.website}>
            {t.venue.website}
          </ExternalLink>
        )}
        <ExternalLink
          className="button button--secondary"
          href={telegramShareUrl(venueShareTarget(venue.id), venueName(venue))}
        >
          {t.venue.share}
        </ExternalLink>
      </nav>

      {venue.address && (
        <section className="group group--padded">
          <h2 className="section-title">{t.venue.address}</h2>
          <p>{venue.address}</p>
        </section>
      )}
      {venue.opening_hours && (
        <section className="group group--padded">
          <h2 className="section-title">{t.venue.hours}</h2>
          <OpeningHours raw={venue.opening_hours} />
        </section>
      )}

      <ReviewList venueId={venue.id} />
      {/* Закреплённая внизу кнопка (DESIGN.md §4); нижняя панель на карточке скрыта. */}
      <div className="venue-cta">
        <button type="button" className="button button--wide" onClick={() => setSoonOpen(true)}>
          {t.venue.book}
        </button>
      </div>
      {soonOpen && <SoonDialog onClose={() => setSoonOpen(false)} />}
    </article>
  );
}

/** Хук названия живёт в отдельном компоненте: экран выше возвращается раньше при загрузке/ошибке. */
function VenueHeading({ venue }: { venue: Venue }) {
  const name = useVenueName(venue);
  return (
    <>
      <h2 className="venue__name">{name.shown}</h2>
      <VenueNameToggle name={name} />
    </>
  );
}
