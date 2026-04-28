alter table public.profiles
  add column if not exists swipe_visibility_active boolean not null default true;

update public.profiles
set swipe_visibility_active = true
where swipe_visibility_active is null;
