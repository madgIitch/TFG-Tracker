-- Fix upsert conflict target for room_extras(room_id)
-- 1) Remove duplicates keeping the most recent row per room_id
with ranked as (
  select
    id,
    row_number() over (
      partition by room_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from room_extras
)
delete from room_extras re
using ranked r
where re.id = r.id
  and r.rn > 1;

-- 2) Ensure unique index exists for ON CONFLICT (room_id)
create unique index if not exists room_extras_room_id_unique
  on room_extras(room_id);
