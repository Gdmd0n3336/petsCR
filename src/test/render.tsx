import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { I18nProvider } from '../i18n/I18nProvider';
import type { Lang } from '../i18n/locale';
import { CatalogContext } from '../lib/catalog/context';
import {
  REVIEWS_PAGE_SIZE,
  type CatalogSource,
  type Review,
  type Venue,
} from '../lib/catalog/types';
import { compareReviews } from '../lib/catalog/fixtureSource';

/** Источник в памяти для тестов экранов (без сети и без кеша). */
export function memorySource(
  venues: Venue[],
  reviews: Review[] = [],
): CatalogSource & {
  loadVenues: ReturnType<typeof vi.fn>;
  loadReviews: ReturnType<typeof vi.fn>;
} {
  return {
    mode: 'sample',
    loadVenues: vi.fn(async () => venues),
    loadReviews: vi.fn(async ({ venueId, sort, rating, page }) => {
      const all = reviews
        .filter((r) => r.venue_id === venueId && (rating === null || r.rating_overall === rating))
        .sort(compareReviews(sort));
      const from = page * REVIEWS_PAGE_SIZE;
      return {
        items: all.slice(from, from + REVIEWS_PAGE_SIZE),
        hasMore: all.length > from + REVIEWS_PAGE_SIZE,
      };
    }),
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { source, lang = 'ru', path = '/' }: { source: CatalogSource; lang?: Lang; path?: string },
) {
  const { hook } = memoryLocation({ path });
  return render(
    <I18nProvider lang={lang}>
      <CatalogContext.Provider value={source}>
        <Router hook={hook}>{ui}</Router>
      </CatalogContext.Provider>
    </I18nProvider>,
  );
}
