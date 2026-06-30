-- Contatori pubblici di visualizzazioni e condivisioni per i post del blog.
-- Nessun dato personale (solo aggregati). Lettura pubblica; scrittura solo via
-- RPC security-definer invocate dal server (service_role), mai da anon.

create table if not exists public.post_stats (
  slug       text primary key,
  views      bigint not null default 0,
  shares     bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.post_stats enable row level security;

drop policy if exists "post_stats_public_read" on public.post_stats;
create policy "post_stats_public_read" on public.post_stats
  for select using (true);
-- Nessuna policy di write: la tabella non e' scrivibile direttamente.

create or replace function public.increment_post_view(p_slug text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  insert into public.post_stats (slug, views) values (p_slug, 1)
  on conflict (slug) do update set views = post_stats.views + 1, updated_at = now()
  returning views into v;
  return v;
end; $$;

create or replace function public.increment_post_share(p_slug text)
returns bigint language plpgsql security definer set search_path = public as $$
declare s bigint;
begin
  insert into public.post_stats (slug, shares) values (p_slug, 1)
  on conflict (slug) do update set shares = post_stats.shares + 1, updated_at = now()
  returning shares into s;
  return s;
end; $$;

revoke execute on function public.increment_post_view(text) from public;
revoke execute on function public.increment_post_share(text) from public;
grant  execute on function public.increment_post_view(text) to service_role;
grant  execute on function public.increment_post_share(text) to service_role;
