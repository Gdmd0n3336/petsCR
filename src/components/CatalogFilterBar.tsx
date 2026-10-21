import { useI18n } from '../i18n/context';
import { districtName } from '../i18n/locale';
import type { CatalogFilters, CatalogSort } from '../lib/catalog/filters';
import type { GeoStatus } from '../lib/useGeolocation';

type Props = {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  districts: string[];
  geoStatus: GeoStatus;
  onRequestLocation: () => void;
};

export function CatalogFilterBar({
  filters,
  onChange,
  districts,
  geoStatus,
  onRequestLocation,
}: Props) {
  const { t, lang } = useI18n();
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  const sorts: CatalogSort[] =
    geoStatus === 'granted'
      ? ['google_rating', 'reviews_count', 'distance']
      : ['google_rating', 'reviews_count'];

  return (
    <section className="filters" aria-label={t.catalog.filtersLabel}>
      <input
        type="search"
        className="input"
        aria-label={t.catalog.searchLabel}
        placeholder={t.catalog.searchPlaceholder}
        value={filters.query}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => set({ query: e.target.value })}
      />
      <div className="filters__row">
        <button
          type="button"
          className="chip"
          aria-pressed={filters.only24}
          onClick={() => set({ only24: !filters.only24 })}
        >
          {t.catalog.only24}
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filters.withPhone}
          onClick={() => set({ withPhone: !filters.withPhone })}
        >
          {t.catalog.withPhone}
        </button>
      </div>
      <div className="filters__row">
        <label className="select">
          <span className="visually-hidden">{t.catalog.district}</span>
          <select
            value={filters.district ?? ''}
            onChange={(e) => set({ district: e.target.value || null })}
          >
            <option value="">{t.catalog.allDistricts}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {districtName(d, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="select">
          <span className="visually-hidden">{t.catalog.sortLabel}</span>
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as CatalogSort })}
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                {t.catalog.sort[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {geoStatus === 'idle' && (
        <button type="button" className="link-button" onClick={onRequestLocation}>
          {t.catalog.useLocation}
        </button>
      )}
      {geoStatus === 'pending' && (
        <p className="hint" role="status">
          {t.catalog.locating}
        </p>
      )}
    </section>
  );
}
