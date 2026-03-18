create type public.piggy_bank_movement_type as enum (
  'manual_add',
  'manual_release',
  'auto_monthly_allocation'
);

create table if not exists public.piggy_bank_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  auto_monthly_amount numeric(14, 2) not null default 0 check (auto_monthly_amount >= 0),
  is_auto_enabled boolean not null default false,
  starts_on_month date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint piggy_bank_settings_month_start_check
    check (starts_on_month = date_trunc('month', starts_on_month)::date),
  constraint piggy_bank_settings_user_unique unique (user_id)
);

create table if not exists public.piggy_bank_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  movement_type public.piggy_bank_movement_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  movement_date date not null default current_date,
  note text,
  auto_instance_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint piggy_bank_movements_user_auto_unique unique (user_id, auto_instance_key)
);

create index if not exists idx_piggy_bank_movements_user_date
  on public.piggy_bank_movements (user_id, movement_date desc);

create trigger set_piggy_bank_settings_updated_at
before update on public.piggy_bank_settings
for each row execute function public.set_updated_at();

create trigger set_piggy_bank_movements_updated_at
before update on public.piggy_bank_movements
for each row execute function public.set_updated_at();

alter table public.piggy_bank_settings enable row level security;
alter table public.piggy_bank_movements enable row level security;

create policy "users manage own piggy bank settings"
on public.piggy_bank_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own piggy bank movements"
on public.piggy_bank_movements
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
