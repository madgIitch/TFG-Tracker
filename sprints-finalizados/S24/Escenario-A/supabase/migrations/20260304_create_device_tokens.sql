create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists idx_device_tokens_user_id
  on public.device_tokens(user_id);

create index if not exists idx_device_tokens_token
  on public.device_tokens(token);

create or replace function public.set_device_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_device_tokens_updated_at on public.device_tokens;

create trigger trg_device_tokens_updated_at
before update on public.device_tokens
for each row
execute function public.set_device_tokens_updated_at();
