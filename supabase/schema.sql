create extension if not exists pgcrypto;

create type public.transaction_type as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('pending', 'cleared', 'cancelled');
create type public.recurrence_frequency as enum (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);
create type public.goal_status as enum ('active', 'completed', 'cancelled', 'paused');
create type public.piggy_bank_movement_type as enum (
  'manual_add',
  'manual_release',
  'auto_monthly_allocation'
);
create type public.group_role as enum ('owner', 'admin', 'member');
create type public.split_method as enum ('equal', 'custom', 'percentage', 'shares');
create type public.shared_expense_status as enum ('draft', 'posted', 'settled', 'cancelled');
create type public.settlement_status as enum ('pending', 'completed', 'cancelled');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, display_name, is_guest, role)
  values (new.id, new.owner_user_id, 'Owner', false, 'owner')
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  default_currency text not null default 'EUR',
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  currency text not null default 'EUR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  display_name text not null,
  guest_email text,
  is_guest boolean not null default false,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_members_group_user_unique unique (group_id, user_id)
);

create table public.group_member_views (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  last_viewed_shared_expenses_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_member_views_group_user_unique unique (group_id, user_id)
);

create or replace function public.is_group_member(check_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = check_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(check_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = check_group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
  );
$$;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  group_id uuid,
  transaction_type public.transaction_type not null,
  status public.transaction_status not null default 'cleared',
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  transaction_date date not null,
  description text not null,
  category text,
  merchant text,
  notes text,
  is_shared boolean not null default false,
  settlement_id uuid unique,
  shared_expense_id uuid unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  description text not null,
  category text,
  frequency public.recurrence_frequency not null,
  starts_on date not null,
  ends_on date,
  next_occurrence_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurring_incomes_dates_check
    check (ends_on is null or ends_on >= starts_on)
);

create table public.monthly_budget_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  budget_month date not null,
  currency text not null default 'EUR',
  total_budget numeric(14, 2) not null check (total_budget >= 0),
  target_savings numeric(14, 2) not null default 0 check (target_savings >= 0),
  category_limits jsonb not null default '{}'::jsonb,
  rollover_enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint monthly_budget_settings_month_start_check
    check (budget_month = date_trunc('month', budget_month)::date),
  constraint monthly_budget_settings_user_month_unique
    unique (user_id, budget_month)
);

create table public.piggy_bank_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  auto_monthly_amount numeric(14, 2) not null default 0 check (auto_monthly_amount >= 0),
  is_auto_enabled boolean not null default false,
  starts_on_month date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint piggy_bank_settings_month_start_check
    check (starts_on_month = date_trunc('month', starts_on_month)::date),
  constraint piggy_bank_settings_user_unique
    unique (user_id)
);

create table public.piggy_bank_movements (
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

create table public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  currency text not null default 'EUR',
  target_date date,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.saving_goals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  contribution_date date not null default current_date,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.shared_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by_user_id uuid not null references public.users (id) on delete cascade,
  paid_by_user_id uuid references public.users (id) on delete restrict,
  paid_by_member_id uuid references public.group_members (id) on delete restrict,
  title text not null,
  description text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  expense_date date not null,
  split_method public.split_method not null default 'equal',
  status public.shared_expense_status not null default 'posted',
  transaction_id uuid unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.shared_expense_splits (
  id uuid primary key default gen_random_uuid(),
  shared_expense_id uuid not null references public.shared_expenses (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  group_member_id uuid references public.group_members (id) on delete cascade,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  percentage numeric(5, 2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  shares integer check (shares is null or shares > 0),
  is_paid boolean not null default false,
  settled_amount numeric(14, 2) not null default 0 check (settled_amount >= 0 and settled_amount <= amount),
  settled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shared_expense_splits_expense_user_unique unique (shared_expense_id, user_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  shared_expense_id uuid references public.shared_expenses (id) on delete set null,
  created_by_user_id uuid not null references public.users (id) on delete cascade,
  accepted_by_user_id uuid references public.users (id) on delete set null,
  payer_user_id uuid references public.users (id) on delete cascade,
  payee_user_id uuid references public.users (id) on delete cascade,
  payer_member_id uuid references public.group_members (id) on delete cascade,
  payee_member_id uuid references public.group_members (id) on delete cascade,
  shared_expense_split_id uuid references public.shared_expense_splits (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  settlement_date date not null,
  status public.settlement_status not null default 'pending',
  accepted_at timestamptz,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint settlements_users_check check (payer_user_id <> payee_user_id)
);

alter table public.transactions
  add constraint transactions_group_id_fkey
  foreign key (group_id) references public.groups (id) on delete set null;

alter table public.transactions
  add constraint transactions_shared_expense_id_fkey
  foreign key (shared_expense_id) references public.shared_expenses (id) on delete set null;

alter table public.transactions
  add constraint transactions_settlement_id_fkey
  foreign key (settlement_id) references public.settlements (id) on delete set null;

alter table public.shared_expenses
  add constraint shared_expenses_transaction_id_fkey
  foreign key (transaction_id) references public.transactions (id) on delete set null;

create index idx_users_email on public.users (email);

create index idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index idx_transactions_user_type_date on public.transactions (user_id, transaction_type, transaction_date desc);
create index idx_transactions_group_date on public.transactions (group_id, transaction_date desc) where group_id is not null;
create index idx_transactions_shared_expense on public.transactions (shared_expense_id) where shared_expense_id is not null;

create index idx_recurring_incomes_user_active_next
  on public.recurring_incomes (user_id, is_active, next_occurrence_on);

create index idx_monthly_budget_settings_user_month
  on public.monthly_budget_settings (user_id, budget_month desc);

create index idx_piggy_bank_movements_user_date
  on public.piggy_bank_movements (user_id, movement_date desc);

create index idx_saving_goals_user_status
  on public.saving_goals (user_id, status, target_date);

create index idx_goal_contributions_goal_date
  on public.goal_contributions (goal_id, contribution_date desc);
create index idx_goal_contributions_user_date
  on public.goal_contributions (user_id, contribution_date desc);

create index idx_groups_owner on public.groups (owner_user_id);

create index idx_group_members_user on public.group_members (user_id);
create index idx_group_members_group_role on public.group_members (group_id, role);
create index idx_group_members_group_guest on public.group_members (group_id, is_guest);
create unique index idx_group_members_group_guest_email
  on public.group_members (group_id, guest_email)
  where guest_email is not null;
create index idx_group_member_views_user_group
  on public.group_member_views (user_id, group_id);

create index idx_shared_expenses_group_date
  on public.shared_expenses (group_id, expense_date desc);
create index idx_shared_expenses_paid_by
  on public.shared_expenses (paid_by_user_id, expense_date desc);
create index idx_shared_expenses_status
  on public.shared_expenses (group_id, status);
create index idx_shared_expenses_group_paid_member
  on public.shared_expenses (group_id, paid_by_member_id, expense_date desc)
  where paid_by_member_id is not null;

create index idx_shared_expense_splits_user_paid
  on public.shared_expense_splits (user_id, is_paid);
create index idx_shared_expense_splits_expense
  on public.shared_expense_splits (shared_expense_id);
create unique index idx_shared_expense_splits_member
  on public.shared_expense_splits (shared_expense_id, group_member_id)
  where group_member_id is not null;

create index idx_settlements_group_status
  on public.settlements (group_id, status, settlement_date desc);
create index idx_settlements_payer
  on public.settlements (payer_user_id, settlement_date desc);
create index idx_settlements_payee
  on public.settlements (payee_user_id, settlement_date desc);
create index idx_settlements_created_by
  on public.settlements (created_by_user_id, settlement_date desc);
create index idx_settlements_pending_acceptance
  on public.settlements (status, payer_user_id, payee_user_id, settlement_date desc)
  where status = 'pending';
create index idx_settlements_member_pair
  on public.settlements (group_id, payer_member_id, payee_member_id, settlement_date desc)
  where payer_member_id is not null and payee_member_id is not null;

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger set_recurring_incomes_updated_at
before update on public.recurring_incomes
for each row execute function public.set_updated_at();

create trigger set_monthly_budget_settings_updated_at
before update on public.monthly_budget_settings
for each row execute function public.set_updated_at();

create trigger set_piggy_bank_settings_updated_at
before update on public.piggy_bank_settings
for each row execute function public.set_updated_at();

create trigger set_piggy_bank_movements_updated_at
before update on public.piggy_bank_movements
for each row execute function public.set_updated_at();

create trigger set_saving_goals_updated_at
before update on public.saving_goals
for each row execute function public.set_updated_at();

create trigger set_goal_contributions_updated_at
before update on public.goal_contributions
for each row execute function public.set_updated_at();

create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create trigger handle_new_group_trigger
after insert on public.groups
for each row execute function public.handle_new_group();

create trigger set_group_members_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

create trigger set_group_member_views_updated_at
before update on public.group_member_views
for each row execute function public.set_updated_at();

create trigger set_shared_expenses_updated_at
before update on public.shared_expenses
for each row execute function public.set_updated_at();

create trigger set_shared_expense_splits_updated_at
before update on public.shared_expense_splits
for each row execute function public.set_updated_at();

create trigger set_settlements_updated_at
before update on public.settlements
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_incomes enable row level security;
alter table public.monthly_budget_settings enable row level security;
alter table public.piggy_bank_settings enable row level security;
alter table public.piggy_bank_movements enable row level security;
alter table public.saving_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_member_views enable row level security;
alter table public.shared_expenses enable row level security;
alter table public.shared_expense_splits enable row level security;
alter table public.settlements enable row level security;

create policy "users can read own profile"
on public.users
for select
using (auth.uid() = id);

create policy "users can insert own profile"
on public.users
for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can delete own profile"
on public.users
for delete
using (auth.uid() = id);

create policy "users manage own transactions"
on public.transactions
for all
using (
  auth.uid() = user_id
  or (
    group_id is not null
    and public.is_group_member(group_id)
  )
)
with check (
  auth.uid() = user_id
  or (
    group_id is not null
    and public.is_group_member(group_id)
  )
);

create policy "users manage own recurring incomes"
on public.recurring_incomes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own monthly budgets"
on public.monthly_budget_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

create policy "users manage own saving goals"
on public.saving_goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users read and write contributions for own goals"
on public.goal_contributions
for all
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.saving_goals sg
    where sg.id = goal_id
      and sg.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.saving_goals sg
    where sg.id = goal_id
      and sg.user_id = auth.uid()
  )
);

create policy "group members can read groups"
on public.groups
for select
using (public.is_group_member(id));

create policy "authenticated users can create groups"
on public.groups
for insert
with check (auth.uid() = owner_user_id);

create policy "group admins can update groups"
on public.groups
for update
using (public.is_group_admin(id))
with check (public.is_group_admin(id));

create policy "group owners can delete groups"
on public.groups
for delete
using (auth.uid() = owner_user_id);

create policy "group members can read memberships"
on public.group_members
for select
using (public.is_group_member(group_id));

create policy "group admins can manage memberships"
on public.group_members
for all
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));

create policy "group members manage own view state"
on public.group_member_views
for all
using (
  auth.uid() = user_id
  and public.is_group_member(group_id)
)
with check (
  auth.uid() = user_id
  and public.is_group_member(group_id)
);

create policy "group members can read shared expenses"
on public.shared_expenses
for select
using (public.is_group_member(group_id));

create policy "group members can create shared expenses"
on public.shared_expenses
for insert
with check (
  public.is_group_member(group_id)
  and auth.uid() = created_by_user_id
  and exists (
    select 1
    from public.group_members gm
    where gm.group_id = shared_expenses.group_id
      and gm.id = shared_expenses.paid_by_member_id
  )
);

create policy "group members can update shared expenses"
on public.shared_expenses
for update
using (public.is_group_member(group_id))
with check (public.is_group_member(group_id));

create policy "group admins can delete shared expenses"
on public.shared_expenses
for delete
using (public.is_group_admin(group_id));

create policy "group members can read shared expense splits"
on public.shared_expense_splits
for select
using (
  exists (
    select 1
    from public.shared_expenses se
    where se.id = shared_expense_id
      and public.is_group_member(se.group_id)
  )
);

create policy "group members can manage shared expense splits"
on public.shared_expense_splits
for all
using (
  exists (
    select 1
    from public.shared_expenses se
    where se.id = shared_expense_id
      and public.is_group_member(se.group_id)
  )
)
with check (
  exists (
    select 1
    from public.shared_expenses se
    where se.id = shared_expense_id
      and public.is_group_member(se.group_id)
  )
);

create policy "participants can read settlements"
on public.settlements
for select
using (
  auth.uid() in (payer_user_id, payee_user_id)
  or public.is_group_member(group_id)
);

create policy "group members can create settlements"
on public.settlements
for insert
with check (
  public.is_group_member(group_id)
  and auth.uid() = created_by_user_id
  and exists (
    select 1
    from public.group_members payer_member
    where payer_member.id = settlements.payer_member_id
      and payer_member.group_id = settlements.group_id
  )
  and exists (
    select 1
    from public.group_members payee_member
    where payee_member.id = settlements.payee_member_id
      and payee_member.group_id = settlements.group_id
  )
);

create policy "participants can update settlements"
on public.settlements
for update
using (
  auth.uid() in (payer_user_id, payee_user_id, created_by_user_id)
  or public.is_group_admin(group_id)
)
with check (
  auth.uid() in (payer_user_id, payee_user_id, created_by_user_id)
  or public.is_group_admin(group_id)
);

create policy "group admins can delete settlements"
on public.settlements
for delete
using (public.is_group_admin(group_id));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shared_expenses'
  ) then
    alter publication supabase_realtime add table public.shared_expenses;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'settlements'
  ) then
    alter publication supabase_realtime add table public.settlements;
  end if;
end;
$$;
