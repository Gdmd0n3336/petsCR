-- Lapa: the venue name exactly as it appears at the source (Thai and/or English, never translated).
-- name_ru / name_en stay as optional transliterations shown on request.
alter table public.venues add column name_original text;
