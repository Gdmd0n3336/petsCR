import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';
import { DEFAULT_FILTERS } from '../lib/catalog/filters';
import { makeVenue } from '../test/catalogSample';
import { memorySource, renderWithProviders } from '../test/render';
import { CatalogScreen } from './CatalogScreen';

const venues = [
  makeVenue({
    id: 'a',
    name_ru: 'Бэй Вет',
    name_en: 'Bay Vet',
    google_rating: 4.2,
    google_reviews_count: 707,
    is_24_7: true,
    phone: '+66 38 773 007',
    district: 'Паттайя',
  }),
  makeVenue({
    id: 'b',
    name_ru: 'Пет Френдс',
    name_en: 'Pet Friends',
    google_rating: 4.9,
    google_reviews_count: 12,
    district: 'Сирача',
    is_demo: true,
  }),
];
const geo = { status: 'idle' as const, position: null, request: vi.fn() };

function Harness() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  return <CatalogScreen filters={filters} onFiltersChange={setFilters} geo={geo} />;
}

const names = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('CatalogScreen', () => {
  it('lists venues sorted by Google rating with labelled Google numbers', async () => {
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    expect(await screen.findByText(ru.catalog.found(2))).toBeInTheDocument();
    expect(names()).toEqual(['Пет Френдс', 'Бэй Вет']);
    expect(screen.getByText('Google 4,2 · 707 отзывов')).toBeInTheDocument();
    expect(screen.getByText(ru.demoBadge)).toBeInTheDocument();
    const card = screen.getByText('Бэй Вет').closest('li')!;
    expect(within(card).getByRole('link', { name: ru.venue.call })).toHaveAttribute(
      'href',
      'tel:+6638773007',
    );
    expect(within(card).getByText(ru.venue.is247)).toBeInTheDocument();
  });

  it('searches with transliteration and filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    const search = await screen.findByRole('searchbox', { name: ru.catalog.searchLabel });

    await user.type(search, 'bay vet');
    expect(names()).toEqual(['Бэй Вет']);
    await user.clear(search);

    await user.click(screen.getByRole('button', { name: ru.catalog.only24 }));
    expect(names()).toEqual(['Бэй Вет']);
    await user.click(screen.getByRole('button', { name: ru.catalog.only24 }));

    await user.selectOptions(screen.getByRole('combobox', { name: ru.catalog.district }), 'Сирача');
    expect(names()).toEqual(['Пет Френдс']);

    await user.click(screen.getByRole('button', { name: ru.catalog.withPhone }));
    expect(screen.getByText(ru.catalog.noResults)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: ru.catalog.reset }));
    expect(names()).toHaveLength(2);

    await user.selectOptions(
      screen.getByRole('combobox', { name: ru.catalog.sortLabel }),
      'reviews_count',
    );
    expect(names()).toEqual(['Бэй Вет', 'Пет Френдс']);
  });

  it('offers distance sorting only after geolocation is granted', async () => {
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    const sort = await screen.findByRole('combobox', { name: ru.catalog.sortLabel });
    expect(within(sort).queryByRole('option', { name: ru.catalog.sort.distance })).toBeNull();
  });

  it('shows loading, then error with retry', async () => {
    const source = memorySource(venues);
    source.loadVenues.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { source });
    expect(screen.getByRole('status')).toHaveTextContent(ru.state.loading);
    expect(await screen.findByRole('alert')).toHaveTextContent(ru.state.error);
    await user.click(screen.getByRole('button', { name: ru.state.retry }));
    expect(await screen.findByText(ru.catalog.found(2))).toBeInTheDocument();
  });

  it('shows the empty state when there are no venues', async () => {
    renderWithProviders(<Harness />, { source: memorySource([]) });
    expect(await screen.findByText(ru.screens.catalog.empty)).toBeInTheDocument();
  });

  it('uses English names and labels in the English interface', async () => {
    renderWithProviders(<Harness />, { source: memorySource(venues), lang: 'en' });
    expect(await screen.findByText(en.catalog.found(2))).toBeInTheDocument();
    expect(names()).toEqual(['Pet Friends', 'Bay Vet']);
    expect(screen.getByText('Google 4.2 · 707 reviews')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Si Racha' })).toBeInTheDocument();
  });
});
