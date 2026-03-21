alter table public.recurring_incomes
  add column if not exists source text;

alter table public.recurring_incomes
  add column if not exists transaction_type public.transaction_type not null default 'income';

alter table public.recurring_incomes
  drop constraint if exists recurring_incomes_transaction_type_check;

alter table public.recurring_incomes
  add constraint recurring_incomes_transaction_type_check
  check (transaction_type in ('income', 'expense'));

update public.recurring_incomes
set source = coalesce(source, description)
where source is null;

alter table public.recurring_incomes
  alter column source set not null;

alter table public.recurring_incomes
  alter column source set default '';

alter table public.transactions
  add column if not exists recurring_income_id uuid references public.recurring_incomes (id) on delete set null;

alter table public.transactions
  add column if not exists recurring_income_instance_key text;

alter table public.transactions
  add column if not exists recurring_occurrence_date date;

create unique index if not exists idx_transactions_recurring_instance
  on public.transactions (recurring_income_instance_key)
  where recurring_income_instance_key is not null;

create index if not exists idx_transactions_recurring_income_date
  on public.transactions (recurring_income_id, recurring_occurrence_date desc)
  where recurring_income_id is not null;

create index if not exists idx_recurring_incomes_active_schedule
  on public.recurring_incomes (user_id, is_active, next_occurrence_on, frequency);
