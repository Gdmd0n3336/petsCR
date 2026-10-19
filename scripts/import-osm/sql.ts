import type { ImportRow } from './parse.ts';

export type SqlMeta = { inputName: string; osmTimestamp: string | null };

/** Одна строка без переводов строк и управляющих символов — для SQL-комментария. */
const oneLine = (value: string) => value.replace(/\p{Cc}+/gu, ' ');

/**
 * SQL для SQL Editor: upsert в public.venues_import.
 * Все данные передаются одной JSON-строкой (экранируется только «'»), разбор делает Postgres
 * через jsonb_to_recordset — значения тегов никогда не склеиваются в SQL.
 * Повторный запуск безопасен: status, category (её правит человек), imported_at и source
 * у существующих строк не меняются; дата данных OSM не затирается, если в новом файле её нет.
 */
export function buildUpsertSql(rows: readonly ImportRow[], meta: SqlMeta): string {
  const records = rows.map((r) => ({ ...r, osm_timestamp: meta.osmTimestamp }));
  const json = JSON.stringify(records).replaceAll("'", "''");

  return `-- Lapa: upsert into public.venues_import (TASK-03, scripts/import-osm)
-- Source file: ${oneLine(meta.inputName)}
-- OSM data as of: ${oneLine(meta.osmTimestamp ?? 'unknown')}
-- Rows: ${rows.length}
-- Data © OpenStreetMap contributors, ODbL.
-- Safe to run more than once: existing rows keep status, category, imported_at and source.
begin;

insert into public.venues_import (osm_type, osm_id, tags, lat, lng, category, osm_timestamp)
select r.osm_type, r.osm_id, r.tags, r.lat, r.lng, r.category, r.osm_timestamp
from jsonb_to_recordset('${json}'::jsonb) as r(
  osm_type text,
  osm_id bigint,
  tags jsonb,
  lat double precision,
  lng double precision,
  category text,
  osm_timestamp timestamptz
)
on conflict (osm_type, osm_id) do update set
  tags = excluded.tags,
  lat = excluded.lat,
  lng = excluded.lng,
  osm_timestamp = coalesce(excluded.osm_timestamp, public.venues_import.osm_timestamp),
  last_seen_at = now();

commit;

select category, count(*) as rows from public.venues_import group by category order by category;
`;
}
