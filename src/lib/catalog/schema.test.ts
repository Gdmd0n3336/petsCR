import { ReviewSchema, VenueSchema, parseRows } from './schema';
import { makeReview, makeVenueRow } from '../../test/catalogSample';

const venueRow = makeVenueRow({ id: 'ok' });

describe('parseRows', () => {
  it('keeps valid rows and drops rows with unexpected values without throwing', () => {
    const rows = parseRows(VenueSchema, [
      venueRow,
      { ...venueRow, id: 'bad-lat', lat: 'abc' },
      { ...venueRow, id: 'bad-category', category: 'casino' },
      null,
      'not a row',
    ]);
    expect(rows.map((r) => r.id)).toEqual(['ok']);
  });

  it('returns an empty list when the payload is not an array', () => {
    expect(parseRows(VenueSchema, { error: 'x' })).toEqual([]);
    expect(parseRows(VenueSchema, null)).toEqual([]);
  });

  it('strips columns the app did not ask for', () => {
    const [row] = parseRows(VenueSchema, [{ ...venueRow, line_user_id: 'U123', osm_id: 5 }]);
    expect(row).not.toHaveProperty('line_user_id');
    expect(row).not.toHaveProperty('osm_id');
  });

  it('turns non-http websites into null', () => {
    const rows = parseRows(VenueSchema, [
      { ...venueRow, id: 'a', website: 'javascript:alert(1)' },
      { ...venueRow, id: 'b', website: 'https://example.com' },
    ]);
    expect(rows.map((r) => r.website)).toEqual([null, 'https://example.com']);
  });

  it('accepts numeric strings for ratings (PostgREST numeric)', () => {
    const [row] = parseRows(VenueSchema, [{ ...venueRow, google_rating: '4.60' }]);
    expect(row?.google_rating).toBe(4.6);
  });

  it('rejects review ratings outside 1–5', () => {
    const rows = parseRows(ReviewSchema, [
      makeReview({ id: 'ok' }),
      { ...makeReview({ id: 'nine' }), rating_overall: 9 },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['ok']);
  });
});
