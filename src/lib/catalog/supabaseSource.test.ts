import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { makeReview, makeVenueRow } from '../../test/catalogSample';
import {
  REVIEW_COLUMNS,
  STATS_COLUMNS,
  VENUE_COLUMNS,
  createSupabaseSource,
} from './supabaseSource';
import { CatalogLoadError } from './types';

type Call = { table: string; chain: [string, ...unknown[]][] };
type Result = { data: unknown; error: unknown };

/** Подмена клиента: записывает цепочку вызовов и отдаёт заранее заданный ответ по таблице. */
function fakeClient(results: Record<string, Result>) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, chain: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'range']) {
        builder[method] = (...args: unknown[]) => {
          call.chain.push([method, ...args]);
          return builder;
        };
      }
      builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve, reject);
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient<Database>, calls };
}

const venueRow = makeVenueRow({ id: 'v1' });

describe('supabase catalog source', () => {
  it('loads venues and stats with read-only selects of the needed columns', async () => {
    const { client, calls } = fakeClient({
      venues: { data: [venueRow], error: null },
      venue_review_stats: {
        data: [{ venue_id: 'v1', reviews_count: 81, avg_rating: 4.7 }],
        error: null,
      },
    });
    const venues = await createSupabaseSource(client).loadVenues();

    expect(venues).toEqual([{ ...venueRow, collected: { reviewsCount: 81, avgRating: 4.7 } }]);
    expect(calls).toEqual([
      {
        table: 'venues',
        chain: [
          ['select', VENUE_COLUMNS],
          ['eq', 'is_published', true],
        ],
      },
      { table: 'venue_review_stats', chain: [['select', STATS_COLUMNS]] },
    ]);
  });

  it('never touches closed tables or write methods', async () => {
    const { client, calls } = fakeClient({});
    const source = createSupabaseSource(client);
    await source.loadVenues();
    await source.loadReviews({ venueId: 'v1', sort: 'newest', rating: null, page: 0 });

    const tables = calls.map((c) => c.table);
    expect(tables).not.toEqual(expect.arrayContaining(['venues_import']));
    for (const t of tables) expect(['venues', 'venue_review_stats', 'reviews']).toContain(t);
    const methods = new Set(calls.flatMap((c) => c.chain.map(([m]) => m)));
    expect([...methods].sort()).toEqual(['eq', 'order', 'range', 'select']);
    for (const column of [VENUE_COLUMNS, REVIEW_COLUMNS].join(',').split(',')) {
      expect(['line_user_id', 'source_url', 'osm_id']).not.toContain(column.trim());
    }
  });

  it('requests reviews 10 per page with one extra row to detect the next page', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => makeReview({ id: `r${i}` }));
    const { client, calls } = fakeClient({ reviews: { data: rows, error: null } });
    const source = createSupabaseSource(client);

    const first = await source.loadReviews({
      venueId: 'v1',
      sort: 'newest',
      rating: null,
      page: 0,
    });
    await source.loadReviews({ venueId: 'v1', sort: 'lowest', rating: 1, page: 1 });

    expect(first.items).toHaveLength(10);
    expect(first.hasMore).toBe(true);
    expect(calls[0]?.chain).toEqual([
      ['select', REVIEW_COLUMNS],
      ['eq', 'venue_id', 'v1'],
      ['eq', 'is_published', true],
      ['order', 'review_date', { ascending: false, nullsFirst: false }],
      ['order', 'id'],
      ['range', 0, 10],
    ]);
    expect(calls[1]?.chain).toEqual([
      ['select', REVIEW_COLUMNS],
      ['eq', 'venue_id', 'v1'],
      ['eq', 'is_published', true],
      ['eq', 'rating_overall', 1],
      ['order', 'rating_overall', { ascending: true }],
      ['order', 'review_date', { ascending: false, nullsFirst: false }],
      ['order', 'id'],
      ['range', 10, 20],
    ]);
  });

  it('keeps «show more» when the extra 11th row fails the schema', async () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => makeReview({ id: `r${i}` })),
      { broken: true },
    ];
    const { client } = fakeClient({ reviews: { data: rows, error: null } });
    const page = await createSupabaseSource(client).loadReviews({
      venueId: 'v1',
      sort: 'newest',
      rating: null,
      page: 0,
    });
    expect(page.items).toHaveLength(10);
    expect(page.hasMore).toBe(true);
  });

  it('throws a generic error without the server message', async () => {
    const { client } = fakeClient({
      venues: {
        data: null,
        error: { code: '42501', message: 'secret https://x.supabase.co key=abc' },
      },
    });
    const error = await createSupabaseSource(client)
      .loadVenues()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CatalogLoadError);
    expect(String((error as Error).message)).not.toMatch(/supabase\.co|key=/);
  });

  it('still shows venues when the stats view fails', async () => {
    const { client } = fakeClient({
      venues: { data: [venueRow], error: null },
      venue_review_stats: { data: null, error: { code: 'x' } },
    });
    const [venue] = await createSupabaseSource(client).loadVenues();
    expect(venue?.collected).toBeNull();
  });
});
