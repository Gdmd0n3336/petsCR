import { screen } from '@testing-library/react';
import { ru } from '../i18n/ru';
import { PATTAYA } from '../lib/geo';
import type { GeoStatus } from '../lib/useGeolocation';
import { makeVenue } from '../test/catalogSample';
import { memorySource, renderWithProviders } from '../test/render';
import { NearbyScreen } from './NearbyScreen';

const venues = [
  makeVenue({
    id: 'far',
    name_original: 'Far Popular',
    lat: 13.36,
    lng: 100.98,
    google_reviews_count: 900,
  }),
  makeVenue({
    id: 'near',
    name_original: 'Near Small',
    lat: 12.93,
    lng: 100.88,
    google_reviews_count: 5,
  }),
];
const names = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

function renderNearby(status: GeoStatus, position = status === 'granted' ? PATTAYA : null) {
  const request = vi.fn();
  renderWithProviders(<NearbyScreen geo={{ status, position, request }} />, {
    source: memorySource(venues),
  });
  return request;
}

describe('NearbyScreen', () => {
  it('asks for the location once when it is not known yet', async () => {
    const request = renderNearby('idle');
    await screen.findByRole('heading', { level: 2 });
    expect(request).toHaveBeenCalledOnce();
  });

  it('shows the closest venues when the location is allowed', async () => {
    renderNearby('granted');
    expect(
      await screen.findByRole('heading', { level: 2, name: ru.nearby.nearest }),
    ).toBeInTheDocument();
    expect(names()).toEqual(['Near Small', 'Far Popular']);
    expect(screen.getAllByText(/км$/)).toHaveLength(2);
  });

  it.each<GeoStatus>(['unavailable', 'pending'])(
    'shows popular venues without any error when %s',
    async (status) => {
      renderNearby(status);
      expect(
        await screen.findByRole('heading', { level: 2, name: ru.nearby.popular }),
      ).toBeInTheDocument();
      expect(names()).toEqual(['Far Popular', 'Near Small']);
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );

  it('links to the full catalog', async () => {
    renderNearby('unavailable');
    expect(await screen.findByRole('link', { name: ru.nearby.allCatalog })).toHaveAttribute(
      'href',
      '/catalog',
    );
  });
});
