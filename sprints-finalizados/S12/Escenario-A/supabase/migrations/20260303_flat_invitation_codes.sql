create table if not exists public.flat_invitation_codes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Entornos antiguos pueden tener flat_id en lugar de room_id.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'flat_invitation_codes'
      and column_name = 'flat_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'flat_invitation_codes'
      and column_name = 'room_id'
  ) then
    alter table public.flat_invitation_codes
      rename column flat_id to room_id;
  end if;
end $$;

-- Soltar FKs antiguas antes de transformar datos para evitar violaciones durante el UPDATE.
alter table public.flat_invitation_codes
  drop constraint if exists flat_invitation_codes_flat_id_fkey;

alter table public.flat_invitation_codes
  drop constraint if exists flat_invitation_codes_room_id_fkey;

-- Si room_id contiene IDs de flats antiguos, intentar mapear a una room real del flat.
with room_per_flat as (
  select
    r.flat_id,
    r.id as room_id,
    row_number() over (partition by r.flat_id order by r.created_at asc, r.id asc) as rn
  from public.rooms r
),
mapped as (
  select
    fic.id as invitation_id,
    rpf.room_id as target_room_id
  from public.flat_invitation_codes fic
  join room_per_flat rpf
    on rpf.flat_id = fic.room_id
   and rpf.rn = 1
  where not exists (
    select 1 from public.rooms r where r.id = fic.room_id
  )
)
update public.flat_invitation_codes fic
set room_id = mapped.target_room_id
from mapped
where fic.id = mapped.invitation_id;

-- Limpiar filas que no apuntan a una room valida y no se pudieron mapear.
delete from public.flat_invitation_codes fic
where not exists (
  select 1
  from public.rooms r
  where r.id = fic.room_id
);

alter table public.flat_invitation_codes
  add constraint flat_invitation_codes_room_id_fkey
  foreign key (room_id) references public.rooms(id) on delete cascade;

drop index if exists idx_flat_invitation_codes_flat_id;
drop index if exists idx_flat_invitation_codes_active_flat;

create index if not exists idx_flat_invitation_codes_room_id
  on public.flat_invitation_codes(room_id);

create index if not exists idx_flat_invitation_codes_code
  on public.flat_invitation_codes(code);

create unique index if not exists idx_flat_invitation_codes_active_room
  on public.flat_invitation_codes(room_id)
  where is_active = true;
