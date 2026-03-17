create type public.goal_priority as enum ('low', 'medium', 'high');

alter table public.saving_goals
  rename column name to title;

alter table public.saving_goals
  rename column current_amount to saved_so_far;

alter table public.saving_goals
  add column if not exists priority public.goal_priority not null default 'medium';

create index if not exists idx_saving_goals_user_priority
  on public.saving_goals (user_id, priority, target_date);

create index if not exists idx_goal_contributions_goal_created
  on public.goal_contributions (goal_id, created_at desc);
