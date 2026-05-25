-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009 — group_events INSERT → webhook FCM fan-out
--
-- Crea un trigger su public.group_events che, ad ogni INSERT, chiama
-- POST https://fitmesh.fit/api/v1/family-events/webhook via pg_net.
--
-- Il secret è letto da Supabase Vault (non in git).
-- Crearlo UNA VOLTA nel SQL Editor:
--
--   SELECT vault.create_secret(
--     'gX9NgE+CTMzoua+4OCSS6f4XPb0aHoxWTflMpNLFoJs=',
--     'family_events_webhook_secret'
--   );
--
-- (stesso valore di FAMILY_EVENTS_WEBHOOK_SECRET in Vercel)
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_net;

-- ─── Funzione trigger ────────────────────────────────────────────────────────

create or replace function public.fn_group_events_webhook()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _secret  text;
  _headers jsonb;
begin
  -- Legge il secret da Supabase Vault (non esposto in git).
  select decrypted_secret
    into _secret
    from vault.decrypted_secrets
   where name = 'family_events_webhook_secret'
   limit 1;

  _headers := '{"Content-Type": "application/json"}'::jsonb;
  if _secret is not null and _secret <> '' then
    _headers := _headers || jsonb_build_object('X-Webhook-Secret', _secret);
  end if;

  -- Fire-and-forget: pg_net è asincrono, non blocca la transazione.
  perform net.http_post(
    url     := 'https://fitmesh.fit/api/v1/family-events/webhook',
    body    := jsonb_build_object(
                 'type',       TG_OP,
                 'table',      TG_TABLE_NAME,
                 'schema',     TG_TABLE_SCHEMA,
                 'record',     row_to_json(NEW)::jsonb,
                 'old_record', null
               ),
    headers := _headers
  );

  return NEW;
exception
  when others then
    raise warning 'group_events_webhook: %', sqlerrm;
    return NEW;
end;
$$;

-- ─── Trigger ─────────────────────────────────────────────────────────────────

drop trigger if exists group_events_insert_webhook on public.group_events;

create trigger group_events_insert_webhook
  after insert on public.group_events
  for each row
  execute function public.fn_group_events_webhook();

comment on function public.fn_group_events_webhook() is
  'Webhook FCM fan-out: POST /api/v1/family-events/webhook su ogni INSERT in group_events.';
