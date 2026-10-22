-- Lapa: user-facing area of a venue (what people actually say: Pattaya, Si Racha, Bang Saen ...).
-- Derived from the Thai address (district/amphoe) and sub-district; the old `district` column stays untouched.
alter table public.venues
  add column area_ru text,
  add column area_en text;

create index venues_area_ru_idx on public.venues (area_ru) where is_published;
