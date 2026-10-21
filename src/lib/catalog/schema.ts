import * as v from 'valibot';

// Проверка данных на границе: каждая строка из базы или фикстур проходит схему.
// v.object отбрасывает лишние поля, поэтому дальше по приложению идут только известные колонки.

const nullableText = v.nullable(v.string());
const coordinate = (limit: number) =>
  v.nullable(v.pipe(v.number(), v.finite(), v.minValue(-limit), v.maxValue(limit)));
const count = v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)));
// PostgREST может отдать numeric строкой; принимаем число или строку с числом.
const decimal = v.pipe(
  v.union([v.number(), v.pipe(v.string(), v.regex(/^\d+(\.\d+)?$/))]),
  v.transform(Number),
);
const rating = v.nullable(v.pipe(decimal, v.minValue(0), v.maxValue(5)));
// Ссылка на сайт только http(s): javascript: и прочие схемы превращаются в «нет сайта».
const website = v.pipe(
  nullableText,
  v.transform((url) => (url && /^https?:\/\//i.test(url) ? url : null)),
);

export const CATEGORIES = ['vet_clinic', 'grooming', 'boarding', 'pet_shop'] as const;

export const VenueSchema = v.object({
  id: v.string(),
  category: v.picklist(CATEGORIES),
  name_ru: nullableText,
  name_en: nullableText,
  name_th: nullableText,
  area_ru: nullableText,
  area_en: nullableText,
  lat: coordinate(90),
  lng: coordinate(180),
  phone: nullableText,
  website,
  opening_hours: nullableText,
  is_24_7: v.boolean(),
  address: nullableText,
  google_rating: rating,
  google_reviews_count: count,
  google_place_id: nullableText,
  is_demo: v.boolean(),
});

export const ReviewSchema = v.object({
  id: v.string(),
  venue_id: v.string(),
  author_display: nullableText,
  rating_overall: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
  text: nullableText,
  text_lang: nullableText,
  review_date: v.nullable(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}/))),
  price_paid: v.nullable(v.pipe(decimal, v.minValue(0))),
  text_ru: nullableText,
  text_en: nullableText,
  needs_ru: v.nullable(v.boolean()),
  needs_en: v.nullable(v.boolean()),
  is_demo: v.boolean(),
});

export const ReviewStatsSchema = v.object({
  venue_id: v.string(),
  reviews_count: count,
  avg_rating: rating,
});

export type VenueRow = v.InferOutput<typeof VenueSchema>;
export type ReviewRow = v.InferOutput<typeof ReviewSchema>;
export type ReviewStatsRow = v.InferOutput<typeof ReviewStatsSchema>;

/** Оставляет только строки, прошедшие схему; не массив — пустой список. Экран не падает из-за одной плохой строки. */
export function parseRows<S extends v.GenericSchema>(schema: S, data: unknown): v.InferOutput<S>[] {
  if (!Array.isArray(data)) return [];
  const rows: v.InferOutput<S>[] = [];
  let dropped = 0;
  for (const item of data) {
    const result = v.safeParse(schema, item);
    if (result.success) rows.push(result.output);
    else dropped += 1;
  }
  if (dropped > 0 && import.meta.env.DEV) {
    // Только число: содержимое строк — внешние данные, в лог не пишем.
    console.warn(`[catalog] dropped ${dropped} invalid row(s)`);
  }
  return rows;
}
