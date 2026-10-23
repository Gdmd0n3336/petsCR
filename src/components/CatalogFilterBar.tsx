import { useCallback, useState } from 'react';
import { useI18n } from '../i18n/context';
import type { AreaOption, CatalogFilters, CatalogSort } from '../lib/catalog/filters';
import type { GeoStatus } from '../lib/useGeolocation';
import { BottomSheet, SheetOptions } from './BottomSheet';
import { Icon } from './Icon';

type Props = {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  areas: AreaOption[];
  geoStatus: GeoStatus;
  onRequestLocation: () => void;
};

type SheetId = 'area' | 'sort';

/** «Все районы» в шторке — пустое значение; в фильтре это null. */
const ALL_AREAS = '';

export function CatalogFilterBar({
  filters,
  onChange,
  areas,
  geoStatus,
  onRequestLocation,
}: Props) {
  const { t, lang } = useI18n();
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  const sorts: CatalogSort[] =
    geoStatus === 'granted'
      ? ['google_rating', 'reviews_count', 'distance']
      : ['google_rating', 'reviews_count'];
  const areaLabel = (a: AreaOption) => (lang === 'en' ? a.en : null) ?? a.ru;
  const selectedArea = areas.find((a) => a.value === filters.area);

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
      {/* Одна полоса чипов с горизонтальной прокруткой: список начинается выше середины экрана. */}
      <div className="filters__strip">
        <button
          type="button"
          className={filters.area ? 'chip chip--menu chip--on' : 'chip chip--menu'}
          aria-haspopup="dialog"
          aria-expanded={sheet === 'area'}
          onClick={() => setSheet('area')}
        >
          {t.catalog.areaChip(selectedArea ? areaLabel(selectedArea) : t.catalog.areaAll)}
          <Icon name="chevronDown" size={16} />
        </button>
        <button
          type="button"
          className="chip chip--menu"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'sort'}
          onClick={() => setSheet('sort')}
        >
          {t.catalog.sort[filters.sort]}
          <Icon name="chevronDown" size={16} />
        </button>
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

      {sheet === 'area' && (
        <BottomSheet title={t.catalog.district} onClose={closeSheet}>
          <SheetOptions
            options={[
              { value: ALL_AREAS, label: t.catalog.allDistricts },
              ...areas.map((a) => ({ value: a.value, label: areaLabel(a) })),
            ]}
            value={filters.area ?? ALL_AREAS}
            onSelect={(value) => {
              set({ area: value || null });
              closeSheet();
            }}
          />
        </BottomSheet>
      )}
      {sheet === 'sort' && (
        <BottomSheet title={t.catalog.sortLabel} onClose={closeSheet}>
          <SheetOptions
            options={sorts.map((s) => ({ value: s, label: t.catalog.sort[s] }))}
            value={filters.sort}
            onSelect={(sort) => {
              set({ sort });
              closeSheet();
            }}
          />
        </BottomSheet>
      )}
    </section>
  );
}
