alter table public.profiles
  add column if not exists preferred_city_id text null references public.cities(id),
  add column if not exists preferred_zone_ids text[] not null default '{}'::text[];

alter table public.flats
  add column if not exists city_id text null references public.cities(id),
  add column if not exists district_id text null references public.city_places(id),
  add column if not exists province_code text null;

with matched_city as (
  select f.id as flat_id, c.id as city_id
  from public.flats f
  join public.cities c on lower(c.name) = lower(f.city)
)
update public.flats f
set city_id = m.city_id
from matched_city m
where f.id = m.flat_id
  and f.city_id is null;

update public.flats f
set province_code = case
  when c.ine_municipio is not null and length(c.ine_municipio) >= 2 then left(c.ine_municipio, 2)
  when c.ref_ine is not null then left(regexp_replace(c.ref_ine, '\D', '', 'g'), 2)
  else null
end
from public.cities c
where f.city_id = c.id
  and f.province_code is null;

with matched_district as (
  select
    f.id as flat_id,
    cp.id as district_id
  from public.flats f
  join public.city_places cp
    on cp.city_id = f.city_id
   and lower(cp.name) = lower(f.district)
)
update public.flats f
set district_id = m.district_id
from matched_district m
where f.id = m.flat_id
  and f.district_id is null;

alter table public.flats
  alter column city_id set not null;
