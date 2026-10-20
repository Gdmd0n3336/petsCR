-- Lapa: Google place data on venues, translations on reviews, rating stats view, closed staging tables for CSV import

-- ===== venues: Google place identifier, address, Google rating =====
alter table public.venues
  add column google_place_id text,
  add column address text,
  add column category_raw text,
  add column google_rating numeric(2, 1) check (google_rating between 1 and 5),
  add column google_reviews_count integer check (google_reviews_count >= 0);

create unique index venues_google_place_id_uidx on public.venues (google_place_id) where google_place_id is not null;

-- ===== reviews: translations (null = not translated yet; the app falls back to the original) =====
alter table public.reviews
  add column text_ru text,
  add column text_en text;

-- Idempotent re-imports: one row per source review link
create unique index reviews_source_url_uidx on public.reviews (source_url) where source_url is not null;

-- ===== Review statistics for published reviews (RLS of public.reviews applies to the caller) =====
create view public.venue_review_stats with (security_invoker = true) as
select
  venue_id,
  count(*)::int as reviews_count,
  round(avg(rating_overall)::numeric, 2) as avg_rating
from public.reviews
where is_published
group by venue_id;

revoke all on public.venue_review_stats from anon, authenticated;
grant select on public.venue_review_stats to anon, authenticated;
grant all on public.venue_review_stats to service_role;

-- ===== Staging tables for CSV import via the Supabase dashboard (all text; closed to the public API) =====
create table public.venues_google_import (
  google_place_id text primary key,
  name text,
  lat text,
  lng text,
  address text,
  phone text,
  website text,
  opening_hours text,
  google_rating text,
  google_reviews_count text,
  category_raw text,
  district_th text,
  district text,
  category text,
  is_24_7 text
);

create table public.reviews_import (
  google_place_id text,
  author_display text,
  rating text,
  text_original text,
  text_lang text,
  review_date text,
  source_url text,
  price_paid text,
  text_ru text,
  text_en text
);

create table public.translations_import (
  source_url text primary key,
  text_ru text,
  text_en text
);

alter table public.venues_google_import enable row level security;
alter table public.reviews_import enable row level security;
alter table public.translations_import enable row level security;

revoke all on public.venues_google_import, public.reviews_import, public.translations_import from anon, authenticated;
grant all on public.venues_google_import, public.reviews_import, public.translations_import to service_role;
