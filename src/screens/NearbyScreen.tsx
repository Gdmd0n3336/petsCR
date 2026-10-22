import { useEffect } from 'react';
import { Link } from 'wouter';
import { ScreenState } from '../components/ScreenState';
import { VenueCard } from '../components/VenueCard';
import { useI18n } from '../i18n/context';
import { useVenues } from '../lib/catalog/context';
import { pickNearby } from '../lib/catalog/filters';
import type { LatLng } from '../lib/geo';
import type { GeoStatus } from '../lib/useGeolocation';

type Props = { geo: { status: GeoStatus; position: LatLng | null; request: () => void } };

/**
 * «Рядом»: ближайшие при разрешённой геолокации, иначе самые популярные.
 * Мягкий отказ: пока ждём ответа, при отказе или ошибке сразу показываем популярные, без сообщений.
 */
export function NearbyScreen({ geo }: Props) {
  const { t } = useI18n();
  const { status, venues, retry } = useVenues();
  const { status: geoStatus, request } = geo;

  useEffect(() => {
    if (geoStatus === 'idle') request();
  }, [geoStatus, request]);

  if (status === 'loading') return <ScreenState status="loading" />;
  if (status === 'error') return <ScreenState status="error" onRetry={retry} />;
  if (venues.length === 0) return <ScreenState status="empty" message={t.screens.nearby.empty} />;

  const { mode, items } = pickNearby(venues, geo.position);
  return (
    <section className="stack" aria-labelledby="nearby-title">
      <div>
        <h2 id="nearby-title" className="section-title">
          {mode === 'nearest' ? t.nearby.nearest : t.nearby.popular}
        </h2>
        {mode === 'popular' && <p className="hint">{t.nearby.popularHint}</p>}
      </div>
      <ul className="list">
        {items.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </ul>
      <Link href="/catalog" className="button button--secondary button--wide">
        {t.nearby.allCatalog}
      </Link>
    </section>
  );
}
