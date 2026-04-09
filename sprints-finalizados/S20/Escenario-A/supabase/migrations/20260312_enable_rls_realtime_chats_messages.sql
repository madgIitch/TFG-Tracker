-- Enable secure Realtime access for chat participants only.
-- This migration is idempotent and safe to re-run.

-- 1) Helper functions used by RLS policies
create or replace function public.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
  );
$$;

create or replace function public.is_chat_participant(p_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = p_chat_id
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
  );
$$;

grant execute on function public.is_match_participant(uuid) to authenticated;
grant execute on function public.is_chat_participant(uuid) to authenticated;

-- 2) Enable RLS
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- 3) Policies for chats
drop policy if exists chats_select_participants on public.chats;
create policy chats_select_participants
on public.chats
for select
to authenticated
using (public.is_match_participant(match_id));

-- Optional direct insert support (safe, participant-only).
drop policy if exists chats_insert_participants on public.chats;
create policy chats_insert_participants
on public.chats
for insert
to authenticated
with check (public.is_match_participant(match_id));

-- 4) Policies for messages
drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
on public.messages
for select
to authenticated
using (public.is_chat_participant(chat_id));

-- Optional direct send support (safe, participant-only + own sender_id).
drop policy if exists messages_insert_participants on public.messages;
create policy messages_insert_participants
on public.messages
for insert
to authenticated
with check (
  public.is_chat_participant(chat_id)
  and sender_id = auth.uid()
);

-- Optional direct read-receipt update support:
-- authenticated users can mark messages from the other participant as read.
drop policy if exists messages_update_read_participants on public.messages;
create policy messages_update_read_participants
on public.messages
for update
to authenticated
using (
  public.is_chat_participant(chat_id)
  and sender_id <> auth.uid()
)
with check (
  public.is_chat_participant(chat_id)
  and sender_id <> auth.uid()
  and read_at is not null
);
