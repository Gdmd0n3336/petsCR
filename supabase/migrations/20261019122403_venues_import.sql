-- Lapa Demo v0: OSM import staging table (TASK-03)
-- Raw venues exported from OpenStreetMap (Overpass Turbo). Not public: rows are reviewed by a human
-- (TASK-04) before anything moves to public.venues. Reads and writes go through service_role only.
-- osm_type, osm_id and source are kept for ODbL attribution.

create table public.venues_import (
  osm_type text not null check (osm_type in ('node', 'way', 'relation')),
  osm_id bigint not null check (osm_id > 0),
  tags jsonb not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  category text not null check (category in ('vet_clinic', 'grooming', 'boarding', 'pet_shop')),
  status text not null default 'new' check (status in ('new', 'approved', 'rejected', 'duplicate')),
  source text not null default 'osm' check (source = 'osm'),
  osm_timestamp timestamptz,
  imported_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (osm_type, osm_id)
);

-- ===== Row level security =====
-- Same model as venue_line_links: no policies and no grants for anon/authenticated (service_role only)
alter table public.venues_import enable row level security;

revoke all on public.venues_import from anon, authenticated;
grant all on public.venues_import to service_role;
