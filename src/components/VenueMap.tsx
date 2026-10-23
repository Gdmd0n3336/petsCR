import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '../i18n/context';
import { formatRating } from '../i18n/locale';
import type { VenueListItem } from '../lib/catalog/filters';
import { areaName, venueName } from '../lib/catalog/names';
import { readConfig } from '../lib/config';
import { PATTAYA, type LatLng } from '../lib/geo';
import { loadGoogleMaps, onMapsAuthFailure, type MapsLibs } from '../lib/maps';
import type { GeoStatus } from '../lib/useGeolocation';
import { useTheme } from '../theme/context';
import { tokenValue } from '../theme/theme';
import { Icon } from './Icon';

type Props = {
  venues: VenueListItem[];
  position: LatLng | null;
  geoStatus: GeoStatus;
  onRequestLocation: () => void;
  /** Сбой загрузки или ключа: экран показывает заглушку и список. */
  onUnavailable: () => void;
};

/** Метка в цветах текущей палитры (design/tokens.css): акцент с белой каймой. */
const pinColors = () => ({
  background: tokenValue('--tint'),
  borderColor: tokenValue('--surface'),
  glyphColor: tokenValue('--on-tint'),
});

/** Карта Google: маркеры из наших координат, кластеры, превью по нажатию. */
export function VenueMap({ venues, position, geoStatus, onRequestLocation, onUnavailable }: Props) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const [initialLang] = useState(lang); // язык карты задаётся один раз при загрузке API
  const { mapsApiKey, mapsMapId } = readConfig();
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<{ map: google.maps.Map; libs: MapsLibs } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Загрузка API и создание карты.
  useEffect(() => {
    const element = container.current;
    if (!mapsApiKey || !element) return;
    let alive = true;
    const stopAuthWatch = onMapsAuthFailure(() => alive && onUnavailable());
    loadGoogleMaps(mapsApiKey, initialLang).then(
      (libs) => {
        if (!alive) return;
        const map = new libs.Map(element, {
          center: PATTAYA,
          zoom: 11,
          mapId: mapsMapId,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        map.addListener('click', () => setSelectedId(null));
        setReady({ map, libs });
      },
      () => alive && onUnavailable(),
    );
    return () => {
      alive = false;
      stopAuthWatch();
    };
  }, [mapsApiKey, mapsMapId, initialLang, onUnavailable]);

  // Маркеры и кластеры; пересоздаются при смене списка (фильтры, поиск).
  useEffect(() => {
    if (!ready) return;
    const { map, libs } = ready;
    const colors = pinColors(); // палитра меняется — эффект пересоздаёт метки (theme в зависимостях)
    const markers = venues
      .filter((v) => v.lat !== null && v.lng !== null)
      .map((v) => {
        const marker = new libs.AdvancedMarkerElement({
          position: { lat: v.lat!, lng: v.lng! },
          title: venueName(v),
          content: new libs.PinElement(colors),
          gmpClickable: true,
        });
        marker.addEventListener('gmp-click', () => setSelectedId(v.id));
        return marker;
      });
    const clusterer = new MarkerClusterer({
      map,
      markers,
      // Кластер в цветах приложения: круг с числом заведений.
      renderer: {
        render: ({ count, position }) => {
          const badge = document.createElement('div');
          badge.className = 'map-cluster';
          badge.textContent = String(count);
          return new libs.AdvancedMarkerElement({
            position,
            content: badge,
            title: t.map.cluster(count),
            zIndex: 1000 + count,
          });
        },
      },
    });
    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
    };
  }, [ready, venues, t.map, theme]);

  // Позиция пользователя: точка «Вы здесь» (подпись меняется вместе с языком).
  useEffect(() => {
    if (!ready || !position) return;
    const dot = document.createElement('div');
    dot.className = 'map-you';
    const you = new ready.libs.AdvancedMarkerElement({
      map: ready.map,
      position,
      title: t.map.you,
      content: dot,
    });
    return () => {
      you.map = null;
    };
  }, [ready, position, t.map.you]);

  // Центр на пользователе — только когда появилась или сменилась позиция, не при смене языка.
  useEffect(() => {
    if (!ready || !position) return;
    ready.map.panTo(position);
    ready.map.setZoom(13);
  }, [ready, position]);

  const selected = venues.find((v) => v.id === selectedId) ?? null;
  const missing = venues.filter((v) => v.lat === null || v.lng === null).length;

  return (
    <div className="venue-map">
      <div ref={container} className="venue-map__canvas" role="region" aria-label={t.map.label} />
      {!ready && (
        <p className="venue-map__loading" role="status">
          {t.map.loading}
        </p>
      )}
      <button
        type="button"
        className="button button--secondary venue-map__near"
        onClick={() => (position && ready ? ready.map.panTo(position) : onRequestLocation())}
        disabled={geoStatus === 'pending'}
      >
        {t.map.nearMe}
      </button>
      {missing > 0 && <p className="hint venue-map__missing">{t.map.noCoords(missing)}</p>}
      {selected && <MapPreview venue={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function MapPreview({ venue, onClose }: { venue: VenueListItem; onClose: () => void }) {
  const { t, lang } = useI18n();
  const meta = [t.venue.category[venue.category], areaName(venue, lang)]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="map-preview" role="dialog" aria-label={venueName(venue)}>
      <span className="map-preview__grab" aria-hidden="true" />
      <button
        type="button"
        className="map-preview__close"
        aria-label={t.map.closePreview}
        onClick={onClose}
      >
        <Icon name="close" size={20} />
      </button>
      <h3 className="venue-card__name">{venueName(venue)}</h3>
      <p className="venue-card__meta">{meta}</p>
      <p className="venue-card__rating">
        {venue.google_rating !== null
          ? t.venue.google(formatRating(venue.google_rating, lang), venue.google_reviews_count ?? 0)
          : t.venue.googleNone}
      </p>
      <div className="venue-card__footer">
        {venue.is_24_7 && <span className="badge">{t.venue.is247}</span>}
        <Link href={`/venue/${venue.id}`} className="button venue-card__call">
          {t.map.open}
        </Link>
      </div>
    </div>
  );
}
