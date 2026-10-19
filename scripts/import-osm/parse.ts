// Разбор JSON-экспорта Overpass (Overpass Turbo → «Экспорт» → raw OSM data, запрос с `out center tags`).
// Все значения тегов — недоверенные внешние данные: здесь они только читаются и не исполняются.

export type Category = 'vet_clinic' | 'grooming' | 'boarding' | 'pet_shop';
export type OsmType = 'node' | 'way' | 'relation';
export type Tags = Record<string, string>;

export type ImportRow = {
  osm_type: OsmType;
  osm_id: number;
  tags: Tags;
  lat: number;
  lng: number;
  category: Category;
};

export type ParseStats = {
  elements: number;
  byType: Record<OsmType, number>;
  duplicates: number;
  withoutCoordinates: number;
  withoutMatchingTags: number;
};

export type ParseResult = { rows: ImportRow[]; osmTimestamp: string | null; stats: ParseStats };

export type CategorySummary = {
  total: number;
  withPhone: number;
  withHours: number;
  withoutName: number;
};

export const CATEGORIES: readonly Category[] = ['vet_clinic', 'grooming', 'boarding', 'pet_shop'];

export class ImportFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportFormatError';
  }
}

const OSM_TYPES: readonly string[] = ['node', 'way', 'relation'];
const EXPECTED =
  'Нужен JSON-экспорт Overpass: в Overpass Turbo запрос с `out center tags`, затем «Экспорт» → «необработанные данные OSM» (raw OSM data).';

/** Приоритет: медицинская помощь важнее всего, магазин — в последнюю очередь. */
export function categoryFor(tags: Tags): Category | null {
  if (tags.amenity === 'veterinary') return 'vet_clinic';
  if (tags.amenity === 'animal_boarding') return 'boarding';
  if (tags.shop === 'pet_grooming') return 'grooming';
  if (tags.shop === 'pet') return 'pet_shop';
  return null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function coordinates(element: Record<string, unknown>): { lat: number; lng: number } | null {
  const source = element.type === 'node' ? element : element.center;
  if (!isObject(source)) return null;
  const { lat, lon } = source;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  return { lat, lng: lon };
}

function readTags(value: unknown): Tags {
  if (!isObject(value)) return {};
  const tags: Tags = {};
  // NUL и непарные суррогаты нельзя сохранить в jsonb Postgres: один такой символ уронил бы весь SQL.
  const clean = (s: string) => s.replaceAll('\u0000', '').toWellFormed();
  for (const [key, tag] of Object.entries(value)) {
    if (typeof tag === 'string') tags[clean(key)] = clean(tag);
  }
  return tags;
}

function readJson(text: string): unknown {
  if (text.trimStart().startsWith('<')) {
    throw new ImportFormatError(`Файл в формате XML (OSM XML), а не JSON. ${EXPECTED}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ImportFormatError(`Файл не является JSON или повреждён. ${EXPECTED}`);
  }
}

export function parseOverpass(text: string): ParseResult {
  const data = readJson(text);

  if (isObject(data) && (data.type === 'FeatureCollection' || Array.isArray(data.features))) {
    throw new ImportFormatError(`Файл в формате GeoJSON, а он не подходит. ${EXPECTED}`);
  }
  if (!isObject(data) || !Array.isArray(data.elements)) {
    throw new ImportFormatError(`В файле нет массива «elements». ${EXPECTED}`);
  }
  // При таймауте или нехватке памяти Overpass отдаёт неполный список элементов и поле remark.
  if (typeof data.remark === 'string' && data.remark.trim() !== '') {
    throw new ImportFormatError(
      `Overpass вернул неполный ответ: «${data.remark.trim()}». Повторите запрос в Overpass Turbo позже и сохраните экспорт заново.`,
    );
  }

  const stats: ParseStats = {
    elements: data.elements.length,
    byType: { node: 0, way: 0, relation: 0 },
    duplicates: 0,
    withoutCoordinates: 0,
    withoutMatchingTags: 0,
  };
  const rows: ImportRow[] = [];
  const seen = new Set<string>();

  data.elements.forEach((element: unknown, index: number) => {
    const position = `элемент №${index + 1}`;
    if (
      !isObject(element) ||
      typeof element.type !== 'string' ||
      !OSM_TYPES.includes(element.type)
    ) {
      throw new ImportFormatError(
        `${position}: тип должен быть node, way или relation. ${EXPECTED}`,
      );
    }
    if (!Number.isSafeInteger(element.id) || (element.id as number) <= 0) {
      throw new ImportFormatError(`${position}: нет корректного числового id. ${EXPECTED}`);
    }
    const osmType = element.type as OsmType;
    const osmId = element.id as number;
    stats.byType[osmType] += 1;

    const key = `${osmType}/${osmId}`;
    if (seen.has(key)) {
      stats.duplicates += 1;
      return;
    }
    seen.add(key);

    const tags = readTags(element.tags);
    const category = categoryFor(tags);
    if (!category) {
      stats.withoutMatchingTags += 1;
      return;
    }
    const point = coordinates(element);
    if (!point) {
      stats.withoutCoordinates += 1;
      return;
    }
    rows.push({ osm_type: osmType, osm_id: osmId, tags, ...point, category });
  });

  const osm3s = isObject(data.osm3s) ? data.osm3s : {};
  const osmTimestamp =
    typeof osm3s.timestamp_osm_base === 'string' ? osm3s.timestamp_osm_base : null;
  if (osmTimestamp !== null && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(osmTimestamp)) {
    throw new ImportFormatError(
      `Поле osm3s.timestamp_osm_base «${osmTimestamp}» не похоже на дату Overpass (ожидается 2026-10-19T09:37:02Z). ${EXPECTED}`,
    );
  }

  return { rows, osmTimestamp, stats };
}

export function summarize(rows: readonly ImportRow[]): Record<Category, CategorySummary> {
  const summary = Object.fromEntries(
    CATEGORIES.map((c) => [c, { total: 0, withPhone: 0, withHours: 0, withoutName: 0 }]),
  ) as Record<Category, CategorySummary>;
  for (const { category, tags } of rows) {
    const s = summary[category];
    s.total += 1;
    if (tags.phone || tags['contact:phone']) s.withPhone += 1;
    if (tags.opening_hours) s.withHours += 1;
    if (!tags.name) s.withoutName += 1;
  }
  return summary;
}
