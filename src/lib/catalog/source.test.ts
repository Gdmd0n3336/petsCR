import { withCache } from './source';
import type { CatalogSource } from './types';

function counting(): CatalogSource & {
  venues: ReturnType<typeof vi.fn>;
  reviews: ReturnType<typeof vi.fn>;
} {
  const venues = vi.fn().mockResolvedValue([]);
  const reviews = vi.fn().mockResolvedValue({ items: [], hasMore: false });
  return { mode: 'live', venues, reviews, loadVenues: venues, loadReviews: reviews };
}

const query = { venueId: 'v1', sort: 'newest', rating: null, page: 0 } as const;

describe('withCache', () => {
  it('requests venues once per session', async () => {
    const source = counting();
    const cached = withCache(source);
    await cached.loadVenues();
    await cached.loadVenues();
    expect(source.venues).toHaveBeenCalledOnce();
  });

  it('caches each review page separately', async () => {
    const source = counting();
    const cached = withCache(source);
    await cached.loadReviews(query);
    await cached.loadReviews(query);
    await cached.loadReviews({ ...query, page: 1 });
    expect(source.reviews).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const source = counting();
    source.venues.mockRejectedValueOnce(new Error('offline'));
    const cached = withCache(source);
    await expect(cached.loadVenues()).rejects.toThrow();
    await expect(cached.loadVenues()).resolves.toEqual([]);
  });

  it('picks the sample source when Supabase env is empty', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    const { getCatalogSource } = await import('./source');
    expect(getCatalogSource().mode).toBe('sample');
    vi.unstubAllEnvs();
  });
});
