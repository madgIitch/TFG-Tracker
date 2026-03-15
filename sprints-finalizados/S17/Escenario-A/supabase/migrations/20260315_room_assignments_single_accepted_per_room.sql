-- Ensure at most one accepted assignment per room.
-- If legacy duplicates exist, keep the most recently updated accepted row.

with ranked as (
  select
    id,
    row_number() over (
      partition by room_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.room_assignments
  where status = 'accepted'
)
update public.room_assignments ra
set status = 'rejected',
    updated_at = now()
from ranked r
where ra.id = r.id
  and r.rn > 1;

create unique index if not exists idx_room_assignments_single_accepted_per_room
  on public.room_assignments(room_id)
  where status = 'accepted';
