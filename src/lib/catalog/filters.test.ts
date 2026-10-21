import { makeVenue } from '../../test/catalogSample';
import { PATTAYA } from '../geo';
import { DEFAULT_FILTERS, applyFilters, districtsOf, isFiltered } from './filters';

const venues = [
  makeVenue({
    id: 'a',
    name_en: 'Alpha Vet',
    google_rating: 4.2,
    google_reviews_count: 700,
    is_24_7: true,
    phone: '+66 1',
    district: 'Паттайя',
    lat: 12.93,
    lng: 100.88,
  }),
  makeVenue({
    id: 'b',
    name_en: 'Beta Pet',
    google_rating: 4.9,
    google_reviews_count: 12,
    district: 'Сирача',
    lat: 13.17,
    lng: 100.93,
  }),
  makeVenue({
    id: 'c',
    name_en: 'Gamma Care',
    google_rating: null,
    google_reviews_count: 3,
    phone: '+66 2',
    district: 'Сирача',
    lat: null,
    lng: null,
  }),
  makeVenue({
    id: 'd',
    name_en: 'Delta Hospital',
    google_rating: 4.9,
    google_reviews_count: 200,
    district: null,
    lat: 12.6,
    lng: 100.9,
  }),
];
const ids = (filters = {}, position = null as typeof PATTAYA | null) =>
  applyFilters(venues, { ...DEFAULT_FILTERS, ...filters }, position).map((v) => v.id);

describe('catalog filters', () => {
  it('filters 24/7', () => expect(ids({ only24: true })).toEqual(['a']));
  it('filters by district', () => expect(ids({ district: 'Сирача' })).toEqual(['b', 'c']));
  it('filters venues with a phone', () =>
    expect(ids({ withPhone: true }).sort()).toEqual(['a', 'c']));
  it('searches by name', () => expect(ids({ query: 'бета' })).toEqual(['b']));
  it('combines filters', () => expect(ids({ withPhone: true, district: 'Сирача' })).toEqual(['c']));

  it('sorts by Google rating, ties by review count, no rating last', () => {
    expect(ids()).toEqual(['d', 'b', 'a', 'c']);
  });

  it('sorts by number of Google reviews', () => {
    expect(ids({ sort: 'reviews_count' })).toEqual(['a', 'd', 'b', 'c']);
  });

  it('sorts by distance only with a position, no coordinates last', () => {
    expect(ids({ sort: 'distance' }, PATTAYA)).toEqual(['a', 'b', 'd', 'c']);
    expect(ids({ sort: 'distance' }, null)).toEqual(ids());
    expect(applyFilters(venues, DEFAULT_FILTERS, null)[0]?.distanceKm).toBeNull();
  });

  it('lists districts once, sorted', () => {
    expect(districtsOf(venues)).toEqual(['Паттайя', 'Сирача']);
  });

  it('knows when filters are active', () => {
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, query: ' x ' })).toBe(true);
  });
});
