create table if not exists public.flat_expenses (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  description text not null,
  amount numeric not null check (amount > 0),
  paid_by uuid not null references public.profiles(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.flat_expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.flat_expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount numeric not null check (amount > 0),
  unique (expense_id, user_id)
);

create table if not exists public.flat_settlements (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  from_user uuid not null references public.profiles(id),
  to_user uuid not null references public.profiles(id),
  amount numeric not null check (amount > 0),
  settled_at timestamp with time zone
);

create index if not exists idx_flat_expenses_flat_id
  on public.flat_expenses(flat_id);

create index if not exists idx_flat_expenses_paid_by
  on public.flat_expenses(paid_by);

create index if not exists idx_flat_expense_splits_expense_id
  on public.flat_expense_splits(expense_id);

create index if not exists idx_flat_expense_splits_user_id
  on public.flat_expense_splits(user_id);

create index if not exists idx_flat_settlements_flat_id
  on public.flat_settlements(flat_id);

create index if not exists idx_flat_settlements_parties
  on public.flat_settlements(from_user, to_user);
