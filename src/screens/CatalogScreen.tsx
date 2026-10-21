import { useCallback, useMemo, useState } from 'react';
import { CatalogFilterBar } from '../components/CatalogFilterBar';
import { ScreenState } from '../components/ScreenState';
import { VenueCard } from '../components/VenueCard';
import { VenueMap } from '../components/VenueMap';
import { useI18n } from '../i18n/context';
import { useVenues } from '../lib/catalog/context';
import {
  DEFAULT_FILTERS,
  applyFilters,
  areasOf,
  isFiltered,
  type CatalogFilters,
  type CatalogView,
  type VenueListItem,
} from '../lib/catalog/filters';
import { readConfig } from '../lib/config';
import type { LatLng } from '../lib/geo';
import type { GeoStatus } from '../lib/useGeolocation';

type Props = {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  geo: { status: GeoStatus; position: LatLng | null; request: () => void };
};

const VIEWS: CatalogView[] = ['list', 'map'];

export function CatalogScreen({ filters, onFiltersChange, geo }: Props) {
  const { t } = useI18n();
  const { status, venues, retry } = useVenues();
  const [mapFailed, setMapFailed] = useState(false);
  const onMapUnavailable = useCallback(() => setMapFailed(true), []);
  // Без ключа карта не загружается вовсе: сразу заглушка и список.
  const mapIssue = !readConfig().mapsApiKey ? 'noKey' : mapFailed ? 'unavailable' : null;
  // Один и тот же массив, пока не изменились данные или фильтры: карта не пересоздаёт маркеры зря.
  const items = useMemo(
    () => applyFilters(venues, filters, geo.position),
    [venues, filters, geo.position],
  );

  if (status === 'loading') return <ScreenState status="loading" />;
  if (status === 'error') return <ScreenState status="error" onRetry={retry} />;
  if (venues.length === 0) return <ScreenState status="empty" message={t.screens.catalog.empty} />;

  const showMap = filters.view === 'map' && !mapIssue;
  return (
    <div className="stack">
      <div className="segmented segmented--wide" role="group" aria-label={t.catalog.view.label}>
        {VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            className="segmented__item"
            aria-pressed={filters.view === view}
            onClick={() => onFiltersChange({ ...filters, view })}
          >
            {t.catalog.view[view]}
          </button>
        ))}
      </div>
      <CatalogFilterBar
        filters={filters}
        onChange={onFiltersChange}
        areas={areasOf(venues)}
        geoStatus={geo.status}
        onRequestLocation={() => {
          geo.request();
          onFiltersChange({ ...filters, sort: 'distance' });
        }}
      />
      <p className="hint" role="status">
        {t.catalog.found(items.length)}
      </p>
      {filters.view === 'map' && mapIssue && (
        <p className="map-fallback" role="note">
          {mapIssue === 'noKey' ? t.map.noKey : t.map.unavailable}
        </p>
      )}
      {showMap ? (
        <VenueMap
          venues={items}
          position={geo.position}
          geoStatus={geo.status}
          onRequestLocation={geo.request}
          onUnavailable={onMapUnavailable}
        />
      ) : (
        <VenueList
          items={items}
          filtered={isFiltered(filters)}
          onReset={() => onFiltersChange({ ...DEFAULT_FILTERS, view: filters.view })}
        />
      )}
    </div>
  );
}

function VenueList({
  items,
  filtered,
  onReset,
}: {
  items: VenueListItem[];
  filtered: boolean;
  onReset: () => void;
}) {
  const { t } = useI18n();
  if (items.length === 0) {
    return (
      <div className="screen-state">
        <p>{t.catalog.noResults}</p>
        {filtered && (
          <button type="button" className="button" onClick={onReset}>
            {t.catalog.reset}
          </button>
        )}
      </div>
    );
  }
  return (
    <ul className="list">
      {items.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </ul>
  );
}
