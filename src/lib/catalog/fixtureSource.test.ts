import sample from '../../../fixtures/catalog.sample.json';
import { makeReview, makeVenueRow } from '../../test/catalogSample';
import { createFixtureSource } from './fixtureSource';

const venueRow = makeVenueRow();

describe('fixture catalog source', () => {
  it('reads the bundled sample: 11 venues with collected stats', async () => {
    const venues = await createFixtureSource(async () => sample).loadVenues();
    expect(venues).toHaveLength(11);
    const umRak = venues.find((v) => v.name_en === 'Um Rak Animal Hospital Ang Sila');
    expect(umRak?.google_rating).toBe(4.6);
    expect(umRak?.google_reviews_count).toBe(707);
    expect(umRak?.collected).toEqual({ reviewsCount: 17, avgRating: 5 });
    // районы и оригинальные названия в образце сняты с базы
    expect(umRak?.area_ru).toBe('Чонбури (город)');
    expect(umRak?.area_en).toBe('Chonburi (city)');
    expect(venues.every((v) => v.area_ru && v.name_original)).toBe(true);
  });

  it('hides unpublished rows and paginates, sorts and filters reviews like the database', async () => {
    const reviews = [
      ...Array.from({ length: 12 }, (_, i) =>
        makeReview({
          id: `r${String(i).padStart(2, '0')}`,
          review_date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        }),
      ),
      makeReview({ id: 'low', rating_overall: 1, review_date: null }),
      { ...makeReview({ id: 'hidden' }), is_published: false },
    ];
    const source = createFixtureSource(async () => ({ venues: [venueRow], reviews }));

    const first = await source.loadReviews({
      venueId: 'v1',
      sort: 'newest',
      rating: null,
      page: 0,
    });
    expect(first.items).toHaveLength(10);
    expect(first.items[0]?.id).toBe('r11');
    expect(first.hasMore).toBe(true);

    const second = await source.loadReviews({
      venueId: 'v1',
      sort: 'newest',
      rating: null,
      page: 1,
    });
    expect(second.items.map((r) => r.id)).toEqual(['r01', 'r00', 'low']);
    expect(second.hasMore).toBe(false);

    const lowest = await source.loadReviews({
      venueId: 'v1',
      sort: 'lowest',
      rating: null,
      page: 0,
    });
    expect(lowest.items[0]?.id).toBe('low');

    const ones = await source.loadReviews({ venueId: 'v1', sort: 'newest', rating: 1, page: 0 });
    expect(ones.items.map((r) => r.id)).toEqual(['low']);
  });

  it('retries loading after a failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(sample);
    const source = createFixtureSource(load);
    await expect(source.loadVenues()).rejects.toThrow('offline');
    await expect(source.loadVenues()).resolves.toHaveLength(11);
  });
});
