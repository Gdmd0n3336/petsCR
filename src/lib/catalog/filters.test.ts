import { makeVenue } from '../../test/catalogSample';
import { PATTAYA } from '../geo';
import { DEFAULT_FILTERS, applyFilters, areasOf, isFiltered } from './filters';

const venues = [
  makeVenue({
    id: 'a',
    name_en: 'Alpha Vet',
    google_rating: 4.2,
    google_reviews_count: 700,
    is_24_7: true,
    phone: '+66 1',
    area_ru: 'Паттайя',
    area_en: 'Pattaya',
    lat: 12.93,
    lng: 100.88,
  }),
  makeVenue({
    id: 'b',
    name_en: 'Beta Pet',
    google_rating: 4.9,
    google_reviews_count: 12,
    area_ru: 'Сирача',
    area_en: 'Si Racha',
    lat: 13.17,
    lng: 100.93,
  }),
  makeVenue({
    id: 'c',
    name_en: 'Gamma Care',
    google_rating: null,
    google_reviews_count: 3,
    phone: '+66 2',
    area_ru: 'Сирача',
    area_en: null,
    lat: null,
    lng: null,
  }),
  makeVenue({
    id: 'd',
    name_en: 'Delta Hospital',
    google_rating: 4.9,
    google_reviews_count: 200,
    area_ru: null,
    area_en: null,
    lat: 12.6,
    lng: 100.9,
  }),
];
const ids = (filters = {}, position = null as typeof PATTAYA | null) =>
  applyFilters(venues, { ...DEFAULT_FILTERS, ...filters }, position).map((v) => v.id);

describe('catalog filters', () => {
  it('filters 24/7', () => expect(ids({ only24: true })).toEqual(['a']));
  it('filters by area', () => expect(ids({ area: 'Сирача' })).toEqual(['b', 'c']));
  it('filters venues with a phone', () =>
    expect(ids({ withPhone: true }).sort()).toEqual(['a', 'c']));
  it('searches by name', () => expect(ids({ query: 'бета' })).toEqual(['b']));
  it('combines filters', () => expect(ids({ withPhone: true, area: 'Сирача' })).toEqual(['c']));

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

  it('lists areas once, sorted, with the English label from the database', () => {
    expect(areasOf(venues)).toEqual([
      { value: 'Паттайя', ru: 'Паттайя', en: 'Pattaya' },
      { value: 'Сирача', ru: 'Сирача', en: 'Si Racha' },
    ]);
  });

  it('finds venues by area aliases', () => {
    expect(ids({ query: 'Sriracha' })).toEqual(['b', 'c']);
    expect(ids({ query: 'Sri Racha' })).toEqual(['b', 'c']);
    expect(ids({ query: 'Сирача' })).toEqual(['b', 'c']);
  });

  it('knows when filters are active', () => {
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, query: ' x ' })).toBe(true);
  });
});
