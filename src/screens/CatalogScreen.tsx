import { CatalogFilterBar } from '../components/CatalogFilterBar';
import { ScreenState } from '../components/ScreenState';
import { VenueCard } from '../components/VenueCard';
import { useI18n } from '../i18n/context';
import { useVenues } from '../lib/catalog/context';
import {
  DEFAULT_FILTERS,
  applyFilters,
  districtsOf,
  isFiltered,
  type CatalogFilters,
} from '../lib/catalog/filters';
import type { LatLng } from '../lib/geo';
import type { GeoStatus } from '../lib/useGeolocation';

type Props = {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  geo: { status: GeoStatus; position: LatLng | null; request: () => void };
};

export function CatalogScreen({ filters, onFiltersChange, geo }: Props) {
  const { t } = useI18n();
  const { status, venues, retry } = useVenues();

  if (status === 'loading') return <ScreenState status="loading" />;
  if (status === 'error') return <ScreenState status="error" onRetry={retry} />;
  if (venues.length === 0) return <ScreenState status="empty" message={t.screens.catalog.empty} />;

  const items = applyFilters(venues, filters, geo.position);
  return (
    <div className="stack">
      <CatalogFilterBar
        filters={filters}
        onChange={onFiltersChange}
        districts={districtsOf(venues)}
        geoStatus={geo.status}
        onRequestLocation={() => {
          geo.request();
          onFiltersChange({ ...filters, sort: 'distance' });
        }}
      />
      <p className="hint" role="status">
        {t.catalog.found(items.length)}
      </p>
      {items.length > 0 ? (
        <ul className="list">
          {items.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </ul>
      ) : (
        <div className="screen-state">
          <p>{t.catalog.noResults}</p>
          {isFiltered(filters) && (
            <button
              type="button"
              className="button"
              onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            >
              {t.catalog.reset}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
