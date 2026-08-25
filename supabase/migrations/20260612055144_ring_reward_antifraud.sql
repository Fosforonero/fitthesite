-- ─── Reward anello smart: 7 giorni di dati live → 6 mesi Pro, anti-frode ───
--
-- Obiettivo: chi collega un anello e lo usa davvero per 7 giorni distinti
-- riceve 6 mesi di Pro. Una volta sbloccato, QUEL preciso anello non può più
-- riscattare il reward su nessun account — anche se viene venduto, regalato o
-- spostato su un altro telefono. L'anello può migrare (legittimo), il codice no.
--
-- Architettura: SERVER-AUTHORITATIVE. Il client non si auto-concede il Pro
-- (un'app modificata mentirebbe). L'app chiama solo la RPC ring_reward_heartbeat
-- con l'hash dell'anello quando l'enricher ottiene dati LIVE reali via BLE;
-- il server conta i giorni distinti e concede il ruolo. La catena entitlement
-- è quella esistente (user_roles.role='pro' → hasFullAccess).
--
-- Privacy: salviamo lo SHA-256 del remoteId BLE, non il valore grezzo.
-- Nota piattaforma: su Android il remoteId è il MAC (stabile per anello →
-- anti-frode solida). Su iOS il remoteId è un UUID per-device (non stabile tra
-- telefoni): il supporto BLE anello su iOS è futuro, l'anti-frode iOS andrà
-- ancorata diversamente quando ci arriveremo.

-- has_ring: flag denormalizzato per segmentazione marketing ("quanti utenti
-- hanno un anello"). Derivabile da ring_claims ma comodo come booleano.
alter table public.profiles
  add column if not exists has_ring boolean not null default false;

comment on column public.profiles.has_ring is
  'True quando l''utente ha inviato almeno un heartbeat di dati live da un '
  'anello smart. Per segmentazione; la verità anti-frode vive in ring_claims.';

-- Un claim per anello fisico (ring_hash univoco = primary key). La riga
-- sopravvive alla cancellazione account (user_id → null) così l'hash resta
-- bruciato: anti-frode duraturo.
create table if not exists public.ring_claims (
  ring_hash       text primary key,
  user_id         uuid references auth.users(id) on delete set null,
  first_live_date date not null,
  last_live_date  date not null,
  live_days       int  not null default 1,
  unlocked_at     timestamptz,            -- NULL = reward non ancora concesso
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.ring_claims is
  'Anti-frode reward anello: un claim per anello fisico (SHA-256 del remoteId). '
  'unlocked_at valorizzato = 6 mesi già concessi, hash bruciato per sempre.';

alter table public.ring_claims enable row level security;

-- L'utente può leggere SOLO il proprio claim (progresso 7 giorni in UI).
-- Scrittura esclusivamente via RPC SECURITY DEFINER: nessun INSERT/UPDATE
-- diretto dal client.
drop policy if exists ring_claims_select_own on public.ring_claims;
create policy ring_claims_select_own on public.ring_claims
  for select using (user_id = auth.uid());

-- Heartbeat: chiamata dall'app a ogni lettura LIVE reale dell'anello.
-- Idempotente nel giorno (un solo incremento per data distinta). Allo scatto
-- del 7° giorno distinto concede i 6 mesi UNA volta sola e marca unlocked_at.
-- Ritorna (live_days, unlocked, just_unlocked) → l'app mostra il progresso e,
-- su just_unlocked, fa partire l'invito (non obbligatorio) alla recensione.
create or replace function public.ring_reward_heartbeat(p_ring_hash text)
returns table(live_days int, unlocked boolean, just_unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'UTC')::date;
  v_row   public.ring_claims;
  v_just  boolean := false;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  -- SHA-256 hex = 64 char: rifiuta input palesemente non valido.
  if p_ring_hash is null or length(p_ring_hash) < 32 then
    raise exception 'invalid ring hash';
  end if;

  insert into public.ring_claims as rc
    (ring_hash, user_id, first_live_date, last_live_date, live_days)
  values (p_ring_hash, v_uid, v_today, v_today, 1)
  on conflict (ring_hash) do update set
    user_id        = v_uid,                       -- proprietario corrente
    last_live_date = v_today,
    live_days      = case when rc.last_live_date < v_today
                          then rc.live_days + 1
                          else rc.live_days end,
    updated_at     = now()
  returning * into v_row;

  update public.profiles set has_ring = true
  where id = v_uid and has_ring = false;

  -- Sblocco: 7 giorni distinti e non ancora premiato.
  if v_row.live_days >= 7 and v_row.unlocked_at is null then
    update public.ring_claims set unlocked_at = now()
    where ring_hash = p_ring_hash and unlocked_at is null
    returning * into v_row;

    if found then
      v_just := true;
      -- Concede 6 mesi SENZA mai accorciare un Pro esistente: lifetime resta
      -- lifetime; una scadenza più lontana viene estesa di 6 mesi a partire
      -- dalla data più avanzata tra ora e quella corrente (stacking equo).
      insert into public.user_roles (user_id, role, expires_at, note)
      values (v_uid, 'pro', now() + interval '6 months', 'ring-reward')
      on conflict (user_id, role) do update set
        expires_at = case
          when public.user_roles.expires_at is null then null
          else greatest(public.user_roles.expires_at, now()) + interval '6 months'
        end,
        note = case
          when public.user_roles.note is null or public.user_roles.note = ''
          then 'ring-reward' else public.user_roles.note end;
    end if;
  end if;

  return query select v_row.live_days, (v_row.unlocked_at is not null), v_just;
end;
$$;

revoke execute on function public.ring_reward_heartbeat(text) from anon;
grant execute on function public.ring_reward_heartbeat(text) to authenticated;
