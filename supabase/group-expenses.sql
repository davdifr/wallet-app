alter table public.group_members
  alter column user_id drop not null;

alter table public.shared_expenses
  alter column paid_by_user_id drop not null;

alter table public.shared_expense_splits
  alter column user_id drop not null;

alter table public.settlements
  alter column payer_user_id drop not null,
  alter column payee_user_id drop not null;

alter table public.transactions
  add column if not exists settlement_id uuid unique references public.settlements (id) on delete set null;

alter table public.group_members
  add column if not exists display_name text,
  add column if not exists guest_email text,
  add column if not exists is_guest boolean not null default false;

update public.group_members
set
  display_name = coalesce(display_name, 'Member'),
  is_guest = coalesce(is_guest, false)
where display_name is null;

alter table public.group_members
  alter column display_name set not null;

alter table public.shared_expenses
  add column if not exists paid_by_member_id uuid references public.group_members (id) on delete restrict;

alter table public.shared_expense_splits
  add column if not exists group_member_id uuid references public.group_members (id) on delete cascade,
  add column if not exists settled_amount numeric(14, 2) not null default 0 check (settled_amount >= 0 and settled_amount <= amount);

alter table public.settlements
  add column if not exists created_by_user_id uuid references public.users (id) on delete cascade,
  add column if not exists accepted_by_user_id uuid references public.users (id) on delete set null,
  add column if not exists payer_member_id uuid references public.group_members (id) on delete cascade,
  add column if not exists payee_member_id uuid references public.group_members (id) on delete cascade,
  add column if not exists shared_expense_split_id uuid references public.shared_expense_splits (id) on delete set null,
  add column if not exists accepted_at timestamptz;

update public.settlements s
set created_by_user_id = coalesce(
  s.created_by_user_id,
  s.payer_user_id,
  s.payee_user_id,
  g.owner_user_id
)
from public.groups g
where s.group_id = g.id
  and s.created_by_user_id is null;

alter table public.settlements
  alter column created_by_user_id set not null;

create unique index if not exists idx_group_members_group_guest_email
  on public.group_members (group_id, guest_email)
  where guest_email is not null;

create unique index if not exists idx_shared_expense_splits_member
  on public.shared_expense_splits (shared_expense_id, group_member_id)
  where group_member_id is not null;

create index if not exists idx_shared_expenses_group_paid_member
  on public.shared_expenses (group_id, paid_by_member_id, expense_date desc)
  where paid_by_member_id is not null;

create index if not exists idx_group_members_group_guest
  on public.group_members (group_id, is_guest);

create index if not exists idx_settlements_member_pair
  on public.settlements (group_id, payer_member_id, payee_member_id, settlement_date desc)
  where payer_member_id is not null and payee_member_id is not null;

create index if not exists idx_settlements_created_by
  on public.settlements (created_by_user_id, settlement_date desc);

create index if not exists idx_settlements_pending_acceptance
  on public.settlements (status, payer_user_id, payee_user_id, settlement_date desc)
  where status = 'pending';

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

drop policy if exists "group members can create shared expenses" on public.shared_expenses;
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

drop policy if exists "group members can create settlements" on public.settlements;
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

drop policy if exists "participants can update settlements" on public.settlements;
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
