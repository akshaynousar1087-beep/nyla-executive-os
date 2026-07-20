create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_user_name_key unique (user_id, name)
);

create index if not exists staff_user_idx on public.staff(user_id);

alter table public.staff enable row level security;

drop policy if exists "users_manage_own_staff" on public.staff;
create policy "users_manage_own_staff"
on public.staff
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.staff to authenticated;

insert into public.staff (user_id, name, role)
select users.id, defaults.name, defaults.role
from auth.users as users
cross join (
  values
    ('Akshay Noushar', 'Founder & Creative Director'),
    ('Bismi', 'Administration & Operations'),
    ('Alfiya Nazar', 'Assistant – HR & Operations'),
    ('Aromal', 'Graphic Designer'),
    ('Lalu', 'Production & Filmmaking'),
    ('Swathi', 'Creative Support')
) as defaults(name, role)
on conflict (user_id, name) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.staff (user_id, name, role)
  values
    (new.id, 'Akshay Noushar', 'Founder & Creative Director'),
    (new.id, 'Bismi', 'Administration & Operations'),
    (new.id, 'Alfiya Nazar', 'Assistant – HR & Operations'),
    (new.id, 'Aromal', 'Graphic Designer'),
    (new.id, 'Lalu', 'Production & Filmmaking'),
    (new.id, 'Swathi', 'Creative Support')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;
