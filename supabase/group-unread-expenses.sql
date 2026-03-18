create table if not exists public.group_member_views (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  last_viewed_shared_expenses_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_member_views_group_user_unique unique (group_id, user_id)
);

create index if not exists idx_group_member_views_user_group
  on public.group_member_views (user_id, group_id);

drop trigger if exists set_group_member_views_updated_at on public.group_member_views;
create trigger set_group_member_views_updated_at
before update on public.group_member_views
for each row execute function public.set_updated_at();

alter table public.group_member_views enable row level security;

drop policy if exists "group members manage own view state" on public.group_member_views;
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
