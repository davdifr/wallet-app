create or replace function public.search_invitable_users(search_query text default null)
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    u.full_name,
    u.avatar_url
  from public.users u
  where auth.uid() is not null
    and (
      search_query is null
      or btrim(search_query) = ''
      or lower(u.email) like '%' || lower(btrim(search_query)) || '%'
      or coalesce(lower(u.full_name), '') like '%' || lower(btrim(search_query)) || '%'
    )
  order by
    case
      when search_query is not null and btrim(search_query) <> '' and lower(u.email) = lower(btrim(search_query))
        then 0
      else 1
    end,
    u.email asc
  limit 20;
$$;

grant execute on function public.search_invitable_users(text) to authenticated;

create or replace function public.get_user_directory_profiles(user_ids uuid[])
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    u.full_name,
    u.avatar_url
  from public.users u
  where auth.uid() is not null
    and user_ids is not null
    and u.id = any(user_ids)
  order by u.email asc;
$$;

grant execute on function public.get_user_directory_profiles(uuid[]) to authenticated;
