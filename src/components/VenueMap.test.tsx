import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ru } from '../i18n/ru';
import { DEFAULT_FILTERS, type CatalogFilters } from '../lib/catalog/filters';
import { PATTAYA } from '../lib/geo';
import { resetMapsAuthFailureForTests } from '../lib/maps';
import { useTheme } from '../theme/context';
import { ThemeProvider } from '../theme/ThemeProvider';
import { CatalogScreen } from '../screens/CatalogScreen';
import { makeVenue } from '../test/catalogSample';
import { memorySource, renderWithProviders } from '../test/render';

// Подмена Maps JS API: настоящих запросов к Google в тестах нет.
const fake = vi.hoisted(() => ({
  maps: [] as {
    element: HTMLElement;
    options: Record<string, unknown>;
    listeners: Record<string, () => void>;
  }[],
  markers: [] as (EventTarget & { options: Record<string, unknown> })[],
  clusters: [] as { markers: unknown[] }[],
}));
const loader = vi.hoisted(() => ({ setOptions: vi.fn(), importLibrary: vi.fn() }));
vi.mock('@googlemaps/js-api-loader', () => loader);
vi.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: class {
    constructor(options: { markers: unknown[] }) {
      fake.clusters.push(options);
    }
    clearMarkers() {}
    setMap() {}
  },
}));

class FakeMap {
  listeners: Record<string, () => void> = {};
  panTo = vi.fn();
  setZoom = vi.fn();
  constructor(
    public element: HTMLElement,
    public options: Record<string, unknown>,
  ) {
    fake.maps.push(this);
  }
  addListener(name: string, callback: () => void) {
    this.listeners[name] = callback;
  }
}
class FakeMarker extends EventTarget {
  map: unknown = null;
  constructor(public options: Record<string, unknown>) {
    super();
    fake.markers.push(this);
  }
}
class FakePin {
  constructor(public options: unknown) {}
}

const venues = [
  makeVenue({
    id: 'a',
    name_original: 'Alpha Vet',
    lat: 12.93,
    lng: 100.88,
    google_rating: 4.6,
    google_reviews_count: 707,
  }),
  makeVenue({ id: 'b', name_original: 'Beta Pet', lat: 13.17, lng: 100.93 }),
  makeVenue({ id: 'c', name_original: 'No Coords Clinic', lat: null, lng: null }),
];

function ThemedHarness() {
  return (
    <ThemeProvider>
      <PaletteSwitch />
      <Harness />
    </ThemeProvider>
  );
}

function PaletteSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(theme === 'teplo' ? 'tishina' : 'teplo')}>
      switch-palette
    </button>
  );
}

function Harness() {
  const [filters, setFilters] = useState<CatalogFilters>({ ...DEFAULT_FILTERS, view: 'map' });
  return (
    <CatalogScreen
      filters={filters}
      onFiltersChange={setFilters}
      geo={{ status: 'idle', position: null, request: vi.fn() }}
    />
  );
}

beforeEach(() => {
  resetMapsAuthFailureForTests();
  fake.maps.length = 0;
  fake.markers.length = 0;
  fake.clusters.length = 0;
  loader.importLibrary.mockImplementation(async (name: string) =>
    name === 'maps' ? { Map: FakeMap } : { AdvancedMarkerElement: FakeMarker, PinElement: FakePin },
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('catalog map', () => {
  it('shows a placeholder and the working list without a key, and never loads Google', async () => {
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    expect(await screen.findByText(ru.map.noKey)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Alpha Vet' })).toBeInTheDocument();
    expect(loader.importLibrary).not.toHaveBeenCalled();
  });

  it('creates markers from coordinates, clusters them and opens a preview on tap', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'test-map-id');
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { source: memorySource(venues) });

    await vi.waitFor(() => expect(fake.clusters).toHaveLength(1));
    expect(loader.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'test-key', v: 'weekly' }),
    );
    expect(fake.maps[0]?.options).toMatchObject({ center: PATTAYA, mapId: 'test-map-id' });
    expect(fake.markers.map((m) => m.options.position)).toEqual([
      { lat: 12.93, lng: 100.88 },
      { lat: 13.17, lng: 100.93 },
    ]);
    expect(fake.clusters[0]?.markers).toHaveLength(2);
    // свой renderer кластера: зелёный круг с числом и подписью
    const cluster = (
      fake.clusters[0] as unknown as {
        renderer: {
          render: (c: { count: number; position: unknown }) => { options: Record<string, unknown> };
        };
      }
    ).renderer.render({ count: 7, position: PATTAYA });
    expect(cluster.options.title).toBe(ru.map.cluster(7));
    expect((cluster.options.content as HTMLElement).textContent).toBe('7');
    expect(screen.getByText(ru.map.noCoords(1))).toBeInTheDocument();

    act(() => {
      fake.markers[0]!.dispatchEvent(new Event('gmp-click'));
    });
    const preview = screen.getByRole('dialog', { name: 'Alpha Vet' });
    expect(within(preview).getByText('Google 4,6 · 707 отзывов')).toBeInTheDocument();
    expect(within(preview).getByRole('link', { name: ru.map.open })).toHaveAttribute(
      'href',
      '/venue/a',
    );

    await user.click(within(preview).getByRole('button', { name: ru.map.closePreview }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('colours pins from the current palette tokens and recreates them on palette change', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    const root = document.documentElement.style;
    root.setProperty('--tint', 'tint-a');
    root.setProperty('--surface', 'surface-a');
    root.setProperty('--on-tint', 'on-tint-a');
    renderWithProviders(<ThemedHarness />, { source: memorySource(venues) });
    await vi.waitFor(() => expect(fake.clusters).toHaveLength(1));
    const pin = (fake.markers[0]!.options.content as unknown as FakePin).options;
    expect(pin).toEqual({
      background: 'tint-a',
      borderColor: 'surface-a',
      glyphColor: 'on-tint-a',
    });

    root.setProperty('--tint', 'tint-b');
    await userEvent.setup().click(screen.getByRole('button', { name: 'switch-palette' }));
    await vi.waitFor(() => expect(fake.clusters).toHaveLength(2));
    const newPin = (fake.markers.at(-1)!.options.content as unknown as FakePin).options as {
      background: string;
    };
    expect(newPin.background).toBe('tint-b');
    root.removeProperty('--tint');
    root.removeProperty('--surface');
    root.removeProperty('--on-tint');
  });

  it('falls back to the list when the Maps API fails to load', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    loader.importLibrary.mockRejectedValue(new Error('network'));
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    expect(await screen.findByText(ru.map.unavailable)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Beta Pet' })).toBeInTheDocument();
  });

  it('falls back to the list when Google rejects the key', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    await vi.waitFor(() => expect(fake.maps).toHaveLength(1));
    act(() => (window as Window & { gm_authFailure?: () => void }).gm_authFailure?.());
    expect(await screen.findByText(ru.map.unavailable)).toBeInTheDocument();
  });

  it('keeps the placeholder after returning to the catalog (Google reports a bad key only once)', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    const first = renderWithProviders(<Harness />, { source: memorySource(venues) });
    await vi.waitFor(() => expect(fake.maps).toHaveLength(1));
    act(() => (window as Window & { gm_authFailure?: () => void }).gm_authFailure?.());
    first.unmount();

    renderWithProviders(<Harness />, { source: memorySource(venues) });
    expect(await screen.findByText(ru.map.unavailable)).toBeInTheDocument();
    expect(fake.maps).toHaveLength(1);
  });

  it('switches between list and map', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { source: memorySource(venues) });
    await user.click(await screen.findByRole('button', { name: ru.catalog.view.list }));
    expect(screen.queryByText(ru.map.noKey)).toBeNull();
    expect(screen.getByRole('button', { name: ru.catalog.view.list })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
