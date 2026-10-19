// @vitest-environment node
import { readFileSync } from 'node:fs';
import { categoryFor, ImportFormatError, parseOverpass, summarize } from './parse.ts';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('categoryFor', () => {
  it.each([
    [{ amenity: 'veterinary' }, 'vet_clinic'],
    [{ shop: 'pet_grooming' }, 'grooming'],
    [{ amenity: 'animal_boarding' }, 'boarding'],
    [{ shop: 'pet' }, 'pet_shop'],
    [{ amenity: 'cafe' }, null],
    [{}, null],
  ])('%j -> %s', (tags, expected) => {
    expect(categoryFor(tags)).toBe(expected);
  });

  it('uses priority vet_clinic > boarding > grooming > pet_shop', () => {
    expect(categoryFor({ amenity: 'veterinary', shop: 'pet' })).toBe('vet_clinic');
    expect(categoryFor({ amenity: 'animal_boarding', shop: 'pet_grooming' })).toBe('boarding');
    expect(categoryFor({ amenity: 'animal_boarding', shop: 'pet' })).toBe('boarding');
  });
});

describe('parseOverpass on the sample file', () => {
  const result = parseOverpass(fixture('overpass-sample.json'));

  it('keeps one row per matching element with coordinates', () => {
    expect(result.rows.map((r) => `${r.osm_type}/${r.osm_id}:${r.category}`)).toEqual([
      'node/101:vet_clinic',
      'way/201:grooming',
      'relation/301:boarding',
      'node/102:pet_shop',
      'node/103:vet_clinic',
      'node/104:boarding',
      'node/105:pet_shop',
      'way/202:grooming',
    ]);
  });

  it('takes node coordinates from lat/lon and way/relation from center', () => {
    const byId = new Map(result.rows.map((r) => [`${r.osm_type}/${r.osm_id}`, r]));
    expect(byId.get('node/101')).toMatchObject({ lat: 12.93, lng: 100.88 });
    expect(byId.get('way/201')).toMatchObject({ lat: 12.94, lng: 100.89 });
    expect(byId.get('relation/301')).toMatchObject({ lat: 12.95, lng: 100.9 });
  });

  it('keeps tags unchanged, including unsafe characters', () => {
    const row = result.rows.find((r) => r.osm_id === 105);
    expect(row?.tags.name).toBe(
      'O\'Brien "Pets" $$; delete from public.venues_import; -- \\ \n second line',
    );
  });

  it('counts element types, duplicates and skipped elements', () => {
    expect(result.osmTimestamp).toBe('2026-10-01T00:00:00Z');
    expect(result.stats).toEqual({
      elements: 11,
      byType: { node: 7, way: 2, relation: 2 },
      duplicates: 1,
      withoutCoordinates: 1,
      withoutMatchingTags: 1,
    });
  });

  it('summarizes categories: total, with phone, with opening hours, without name', () => {
    expect(summarize(result.rows)).toEqual({
      vet_clinic: { total: 2, withPhone: 1, withHours: 1, withoutName: 0 },
      grooming: { total: 2, withPhone: 1, withHours: 1, withoutName: 0 },
      boarding: { total: 2, withPhone: 0, withHours: 0, withoutName: 0 },
      pet_shop: { total: 2, withPhone: 1, withHours: 0, withoutName: 1 },
    });
  });
});

describe('parseOverpass format errors (Russian messages)', () => {
  const error = (text: string) => {
    try {
      parseOverpass(text);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportFormatError);
      return (e as Error).message;
    }
    throw new Error('expected ImportFormatError');
  };

  it('rejects GeoJSON', () => {
    expect(error(fixture('geojson-sample.json'))).toMatch(/GeoJSON/);
  });

  it('rejects XML', () => {
    expect(error('<?xml version="1.0"?><osm></osm>')).toMatch(/XML/);
  });

  it('rejects broken JSON', () => {
    expect(error('{"elements": [')).toMatch(/не является JSON/);
  });

  it('rejects JSON without elements', () => {
    expect(error('{"version": 0.6}')).toMatch(/elements/);
    expect(error('[1, 2]')).toMatch(/elements/);
  });

  it('rejects an element with a wrong type or id', () => {
    expect(error('{"elements": [{"type": "area", "id": 1}]}')).toMatch(/элемент №1/);
    expect(error('{"elements": [{"type": "node", "id": "x"}]}')).toMatch(/элемент №1/);
  });
});
