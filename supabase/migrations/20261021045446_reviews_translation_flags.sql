-- Lapa: translation markers on reviews (computed automatically) and an internal queue view

-- needs_ru / needs_en: true while a review still has no translation into that language.
-- They update by themselves when text_ru / text_en are filled in (no manual maintenance).
alter table public.reviews
  add column needs_ru boolean generated always as (
    text is not null and length(text) > 2 and text_ru is null and coalesce(text_lang, '') <> 'ru'
  ) stored,
  add column needs_en boolean generated always as (
    text is not null and length(text) > 2 and text_en is null and coalesce(text_lang, '') <> 'en'
  ) stored;

create index reviews_needs_translation_idx on public.reviews (venue_id) where needs_ru or needs_en;

-- Internal list of reviews that still need a translation (service_role only)
create view public.reviews_translation_queue with (security_invoker = true) as
select
  r.id,
  r.source_url,
  v.name_ru as venue_name_ru,
  r.rating_overall,
  r.text_lang,
  r.text,
  r.needs_ru,
  r.needs_en
from public.reviews r
join public.venues v on v.id = r.venue_id
where r.needs_ru or r.needs_en;

revoke all on public.reviews_translation_queue from anon, authenticated;
grant select on public.reviews_translation_queue to service_role;
