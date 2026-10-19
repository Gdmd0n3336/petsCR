-- Lapa Demo v0: initial schema (TASK-02)
-- Catalog tables are public-read (published rows only); user tables are owner-only; writes to the catalog go through service_role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ===== Catalog =====
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('vet_clinic', 'grooming', 'boarding', 'pet_shop')),
  name_ru text,
  name_th text,
  name_en text,
  district text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  phone text,
  website text,
  opening_hours text,
  is_24_7 boolean not null default false,
  languages text[] not null default '{}',
  osm_type text check (osm_type in ('node', 'way', 'relation')),
  osm_id bigint,
  coords_verified_at timestamptz,
  price_visit_from integer check (price_visit_from >= 0),
  price_visit_to integer check (price_visit_to >= 0),
  source text not null default 'manual',
  source_checked_at timestamptz,
  is_demo boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_has_name check (coalesce(name_ru, name_th, name_en) is not null),
  constraint venues_osm_pair check ((osm_type is null) = (osm_id is null))
);
create unique index venues_osm_uidx on public.venues (osm_type, osm_id) where osm_id is not null;
create index venues_category_published_idx on public.venues (category) where is_published;
create index venues_district_idx on public.venues (district);
create trigger venues_set_updated_at before update on public.venues
  for each row execute function public.set_updated_at();

-- LINE identifier of the clinic staff account: internal, never exposed to the public API
create table public.venue_line_links (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  line_user_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.venue_services (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  service text not null,
  price_from integer check (price_from >= 0),
  price_to integer check (price_to >= 0),
  price_source text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index venue_services_venue_idx on public.venue_services (venue_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  author_display text,
  rating_overall smallint not null check (rating_overall between 1 and 5),
  rating_doctors smallint check (rating_doctors between 1 and 5),
  rating_price smallint check (rating_price between 1 and 5),
  rating_communication smallint check (rating_communication between 1 and 5),
  text text,
  text_lang text,
  review_date date,
  price_paid integer check (price_paid >= 0),
  source text not null check (source in ('lapa_verified', 'imported', 'demo')),
  source_url text,
  visit_verified boolean not null default false,
  is_demo boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_venue_published_idx on public.reviews (venue_id) where is_published;

create table public.venue_metrics (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  requests_count integer not null default 0,
  avg_response_minutes numeric(10, 1),
  confirmed_rate numeric(5, 4),
  updated_at timestamptz not null default now()
);

-- ===== Users and requests =====
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  telegram_id bigint unique,
  language text not null default 'ru',
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  species text not null check (species in ('dog', 'cat', 'other')),
  name text not null,
  age_years numeric(4, 1) check (age_years >= 0),
  created_at timestamptz not null default now()
);
create index pets_owner_idx on public.pets (owner_id);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete restrict,
  pet_id uuid references public.pets(id) on delete set null,
  service text not null,
  requested_time timestamptz,
  comment text,
  status text not null default 'sent' check (status in ('sent', 'replied', 'booked', 'visited', 'rated', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_user_idx on public.requests (user_id);
create index requests_venue_idx on public.requests (venue_id);
create index requests_pet_idx on public.requests (pet_id);
create trigger requests_set_updated_at before update on public.requests
  for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  direction text not null check (direction in ('client_to_venue', 'venue_to_client')),
  text_ru text,
  text_th text,
  created_at timestamptz not null default now(),
  constraint messages_has_text check (coalesce(text_ru, text_th) is not null)
);
create index messages_request_idx on public.messages (request_id, created_at);

-- Metrics are computed from requests/messages by the server (service_role only)
create or replace function public.refresh_venue_metrics()
returns void
language sql
set search_path = ''
as $$
  insert into public.venue_metrics (venue_id, requests_count, avg_response_minutes, confirmed_rate, updated_at)
  select r.venue_id,
         count(*)::int,
         avg(extract(epoch from (fr.first_reply - r.created_at)) / 60)::numeric(10, 1),
         ((count(*) filter (where r.status in ('booked', 'visited', 'rated')))::numeric / count(*))::numeric(5, 4),
         now()
  from public.requests r
  left join lateral (
    select min(m.created_at) as first_reply
    from public.messages m
    where m.request_id = r.id and m.direction = 'venue_to_client'
  ) fr on true
  group by r.venue_id
  on conflict (venue_id) do update set
    requests_count = excluded.requests_count,
    avg_response_minutes = excluded.avg_response_minutes,
    confirmed_rate = excluded.confirmed_rate,
    updated_at = excluded.updated_at;
$$;
revoke all on function public.refresh_venue_metrics() from public, anon, authenticated;
grant execute on function public.refresh_venue_metrics() to service_role;

-- ===== Row level security =====
alter table public.venues enable row level security;
alter table public.venue_line_links enable row level security;
alter table public.venue_services enable row level security;
alter table public.reviews enable row level security;
alter table public.venue_metrics enable row level security;
alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.requests enable row level security;
alter table public.messages enable row level security;

-- Explicit privileges: nothing by default, then only what each role needs
revoke all on public.venues, public.venue_line_links, public.venue_services, public.reviews,
  public.venue_metrics, public.users, public.pets, public.requests, public.messages
  from anon, authenticated;

grant all on public.venues, public.venue_line_links, public.venue_services, public.reviews,
  public.venue_metrics, public.users, public.pets, public.requests, public.messages
  to service_role;

-- Catalog: public read, published rows only
grant select on public.venues, public.venue_services, public.reviews, public.venue_metrics to anon, authenticated;

create policy venues_public_read on public.venues
  for select to anon, authenticated
  using (is_published);

create policy venue_services_public_read on public.venue_services
  for select to anon, authenticated
  using (exists (select 1 from public.venues v where v.id = venue_services.venue_id and v.is_published));

create policy reviews_public_read on public.reviews
  for select to anon, authenticated
  using (is_published and exists (select 1 from public.venues v where v.id = reviews.venue_id and v.is_published));

create policy venue_metrics_public_read on public.venue_metrics
  for select to anon, authenticated
  using (exists (select 1 from public.venues v where v.id = venue_metrics.venue_id and v.is_published));

-- venue_line_links: no policies and no grants for anon/authenticated (service_role only)

-- Users: own row only; row is created by the server after validating the Telegram login
grant select on public.users to authenticated;
grant update (language) on public.users to authenticated;

create policy users_select_own on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy users_update_own on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Pets: owner only
grant select, insert, update, delete on public.pets to authenticated;

create policy pets_select_own on public.pets
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy pets_insert_own on public.pets
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy pets_update_own on public.pets
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy pets_delete_own on public.pets
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Requests: owner reads and creates (always status 'sent'); status changes only by the server
grant select, insert on public.requests to authenticated;

create policy requests_select_own on public.requests
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy requests_insert_own on public.requests
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'sent'
    and exists (select 1 from public.venues v where v.id = requests.venue_id and v.is_published)
  );

-- Messages: owner of the request reads; client can only add its own outgoing message
grant select, insert on public.messages to authenticated;

create policy messages_select_own on public.messages
  for select to authenticated
  using (request_id in (select r.id from public.requests r where r.user_id = (select auth.uid())));

create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (
    direction = 'client_to_venue'
    and request_id in (select r.id from public.requests r where r.user_id = (select auth.uid()))
  );
