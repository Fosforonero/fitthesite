do $$ begin
  if not exists (select 1 from pg_type where typname = 'beta_signup_status') then
    create type public.beta_signup_status as enum (
      'pending', 'approved', 'activated', 'rejected', 'expired'
    );
  end if;
end $$;

create table if not exists public.beta_signups (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  google_email  text,
  reason        text,
  referral      text,
  device_brand  text,
  status        public.beta_signup_status not null default 'pending',
  founder_number int,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  approved_by   uuid references auth.users(id) on delete set null,
  signup_ip     inet,
  signup_ua     text,
  constraint beta_signups_email_unique unique (email),
  constraint beta_signups_founder_number_unique unique (founder_number),
  constraint beta_signups_founder_number_range check (
    founder_number is null or (founder_number between 1 and 100)
  )
);

create index if not exists beta_signups_status_created_idx
  on public.beta_signups (status, created_at desc);

alter table public.beta_signups enable row level security;

drop policy if exists "anon can insert signup" on public.beta_signups;
create policy "anon can insert signup"
  on public.beta_signups
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin can read signups" on public.beta_signups;
create policy "admin can read signups"
  on public.beta_signups
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "admin can update signups" on public.beta_signups;
create policy "admin can update signups"
  on public.beta_signups
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

create or replace function public.get_beta_spots_taken()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.beta_signups
  where status in ('pending', 'approved', 'activated');
$$;

grant execute on function public.get_beta_spots_taken() to anon, authenticated;