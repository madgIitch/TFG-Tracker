alter table public.profiles
  add column if not exists lifestyle_tags text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_lifestyle_tags_max_5'
  ) then
    alter table public.profiles
      add constraint profiles_lifestyle_tags_max_5
      check (coalesce(array_length(lifestyle_tags, 1), 0) <= 5);
  end if;
end
$$;

update public.profiles p
set lifestyle_tags = coalesce(
  (
    select array_agg(tag)
    from (
      select distinct tag
      from unnest(
        array[
          case when (p.lifestyle_preferences ->> 'schedule') = 'Madrugador' then 'madrugador' end,
          case when (p.lifestyle_preferences ->> 'schedule') = 'Noctambulo' then 'noctambulo' end,
          case when (p.lifestyle_preferences ->> 'cleaning') = 'No fumador' then 'no_fumador' end,
          case when (p.lifestyle_preferences ->> 'cleaning') = 'Fumador' then 'fumador' end,
          case when (p.lifestyle_preferences ->> 'cleaning') = 'Deportista' then 'deportista' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Tiene mascota' then 'tiene_mascota' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Sin mascotas' then 'sin_mascotas' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Trabaja desde casa' then 'trabaja_desde_casa' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Fiestero' then 'fiestero' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Tranquilo' then 'tranquilo' end,
          case when (p.lifestyle_preferences ->> 'schedule') = 'Flexible' then 'tranquilo' end,
          case when (p.lifestyle_preferences ->> 'cleaning') = 'Muy limpio' then 'tranquilo' end,
          case when (p.lifestyle_preferences ->> 'guests') = 'Algunos invitados' then 'fiestero' end
        ]::text[]
      ) as tag
      where tag is not null
    ) mapped
  ),
  '{}'::text[]
)
where coalesce(array_length(p.lifestyle_tags, 1), 0) = 0
  and p.lifestyle_preferences is not null;

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'flat_expenses',
    'flat_expense_splits',
    'flat_settlements',
    'room_assignments',
    'rooms',
    'room_extras',
    'matches'
  ];
begin
  foreach table_name in array realtime_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    end if;
  end loop;
end
$$;

