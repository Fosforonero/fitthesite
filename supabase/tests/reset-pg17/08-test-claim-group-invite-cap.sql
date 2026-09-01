-- Controlli su public.claim_group_invite dopo la forward-only 20260825120007.
--
-- Il tetto non e' osservabile direttamente: la funzione lo restituisce solo
-- nel ramo `family_full`. La fixture riempie quindi il gruppo con OTTO membri,
-- cosi' che entrambi i casi finiscano in quel ramo ma con `cap` diverso:
--
--   proprietario con Pro attivo   -> cap 8, 8 >= 8 -> family_full con cap 8
--   proprietario con Pro scaduto  -> cap 3, 8 >= 3 -> family_full con cap 3
--
-- Un solo allestimento, due valori distinguibili, nessuna inferenza.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- PULIZIA E FIXTURE
-- ---------------------------------------------------------------------------
delete from public.group_invites where code in ('MESH-CAP8', 'MESH-CAP5');
delete from public.group_members where group_id in (
  'd0000000-0000-0000-0000-00000000000a','d0000000-0000-0000-0000-00000000000b');
delete from public.groups where id in (
  'd0000000-0000-0000-0000-00000000000a','d0000000-0000-0000-0000-00000000000b');
delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
delete from auth.users where id::text like 'd%-%';

insert into auth.users (id, email) values
  ('d1111111-1111-1111-1111-111111111111','proprietario@prova.invalid'),
  ('d2222222-2222-2222-2222-222222222222','richiedente@prova.invalid'),
  ('d3333333-3333-3333-3333-333333333333','richiedente2@prova.invalid');
-- otto membri per il gruppo pieno, cinque per quello sopra la soglia gratuita
insert into auth.users (id, email)
select ('d900000' || i || '-0000-0000-0000-00000000000' || i)::uuid,
       'membro' || i || '@prova.invalid'
from generate_series(1, 8) as i;

insert into public.groups (id, type, name, owner_id) values
  ('d0000000-0000-0000-0000-00000000000a','family','gruppo pieno',
   'd1111111-1111-1111-1111-111111111111'),
  ('d0000000-0000-0000-0000-00000000000b','family','gruppo sopra la soglia',
   'd1111111-1111-1111-1111-111111111111');

-- otto membri nel gruppo A
insert into public.group_members (group_id, user_id, role)
select 'd0000000-0000-0000-0000-00000000000a',
       ('d900000' || i || '-0000-0000-0000-00000000000' || i)::uuid, 'member'
from generate_series(1, 8) as i;

-- cinque membri nel gruppo B: sopra il tetto gratuito di 3, sotto quello Pro
insert into public.group_members (group_id, user_id, role)
select 'd0000000-0000-0000-0000-00000000000b',
       ('d900000' || i || '-0000-0000-0000-00000000000' || i)::uuid, 'member'
from generate_series(1, 5) as i;

-- I codici devono rispettare group_invites_code_check: ^MESH-[A-Z0-9]{4}$.
-- E max_uses sta fra 1 e 20 per group_invites_max_uses_check. Non sono nomi
-- scelti a caso: un codice piu' leggibile non entrerebbe.
insert into public.group_invites (group_id, code, created_by, expires_at, max_uses, uses_count)
values
  ('d0000000-0000-0000-0000-00000000000a','MESH-CAP8',
   'd1111111-1111-1111-1111-111111111111', now() + interval '7 days', 20, 0),
  ('d0000000-0000-0000-0000-00000000000b','MESH-CAP5',
   'd1111111-1111-1111-1111-111111111111', now() + interval '7 days', 20, 0);

do $t$
declare
  r         jsonb;
  v_membri  integer;
begin
  -- =========================================================================
  -- I CINQUE RED SUL TETTO
  -- =========================================================================
  perform set_config('request.jwt.claim.sub', 'd2222222-2222-2222-2222-222222222222', true);

  -- 1. Pro PERMANENTE -> cap 8
  delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('d1111111-1111-1111-1111-111111111111','pro', null, 'pro permanente');
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'error') = 'family_full' and (r->>'cap')::int = 8 and (r->>'is_owner_pro')::boolean then
    raise notice '1 PASSA  Pro permanente -> cap 8';
  else
    raise exception '1 FALLISCE  Pro permanente: atteso cap 8, ottenuto %', r::text;
  end if;

  -- 2. Pro con scadenza FUTURA -> cap 8
  update public.user_roles set expires_at = now() + interval '30 days'
   where user_id = 'd1111111-1111-1111-1111-111111111111' and role = 'pro';
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int = 8 and (r->>'is_owner_pro')::boolean then
    raise notice '2 PASSA  Pro con scadenza futura -> cap 8';
  else
    raise exception '2 FALLISCE  Pro futuro: atteso cap 8, ottenuto %', r::text;
  end if;

  -- 3. Pro SCADUTO -> cap 3. E' il difetto che questa migration corregge.
  update public.user_roles set expires_at = now() - interval '1 day'
   where user_id = 'd1111111-1111-1111-1111-111111111111' and role = 'pro';
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int = 3 and not (r->>'is_owner_pro')::boolean then
    raise notice '3 PASSA  Pro SCADUTO -> cap 3';
  else
    raise exception
      '3 FALLISCE  Pro scaduto: atteso cap 3 e is_owner_pro false, ottenuto %. '
      'Il tetto di 8 sta sopravvivendo al diritto che lo giustificava.', r::text;
  end if;

  -- 4. admin SCADUTO -> cap 3
  delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('d1111111-1111-1111-1111-111111111111','admin', now() - interval '1 day', 'admin scaduto');
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int = 3 then
    raise notice '4 PASSA  admin SCADUTO -> cap 3';
  else
    raise exception '4 FALLISCE  admin scaduto: atteso cap 3, ottenuto %', r::text;
  end if;

  -- 5. nessun ruolo -> cap 3
  delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int = 3 and not (r->>'is_owner_pro')::boolean then
    raise notice '5 PASSA  nessun ruolo -> cap 3';
  else
    raise exception '5 FALLISCE  nessun ruolo: atteso cap 3, ottenuto %', r::text;
  end if;

  -- =========================================================================
  -- 6. GRUPPO GIA' SOPRA 3 DOPO LA SCADENZA
  --    Il diritto che scade chiude la porta, non svuota la stanza.
  -- =========================================================================
  delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('d1111111-1111-1111-1111-111111111111','pro', now() - interval '1 day', 'pro scaduto');

  select count(*) into v_membri from public.group_members
   where group_id = 'd0000000-0000-0000-0000-00000000000b' and left_at is null;
  if v_membri <> 5 then
    raise exception '6 FALLISCE  la fixture non ha 5 membri ma %', v_membri;
  end if;

  perform set_config('request.jwt.claim.sub', 'd3333333-3333-3333-3333-333333333333', true);
  r := public.claim_group_invite('MESH-CAP5');

  if (r->>'error') <> 'family_full' or (r->>'cap')::int <> 3 then
    raise exception
      '6 FALLISCE  nuovo ingresso: atteso family_full con cap 3, ottenuto %', r::text;
  end if;

  select count(*) into v_membri from public.group_members
   where group_id = 'd0000000-0000-0000-0000-00000000000b' and left_at is null;
  if v_membri <> 5 then
    raise exception
      '6 FALLISCE  ESPULSIONE: i membri erano 5 e ora sono %. La scadenza non '
      'deve rimuovere nessuno.', v_membri;
  end if;

  raise notice
    '6 PASSA  gruppo a 5 con Pro scaduto: nessun nuovo ingresso (family_full, '
    'cap 3) e nessuna espulsione (i 5 membri restano)';

  raise notice '--- claim_group_invite: sei controlli, tutti verdi ---';
end
$t$;

-- ---------------------------------------------------------------------------
-- 7. CONTROLLO POSITIVO: rimettendo il semplice overlap, il caso 3 va rosso
-- ---------------------------------------------------------------------------
do $t$
declare
  v_def   text;
  v_rotto text;
  r       jsonb;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_group_invite';

  -- toglie il filtro di scadenza, cioe' ricostruisce il difetto
  v_rotto := replace(v_def,
    E'\n          AND (expires_at IS NULL OR expires_at > now())', '');
  if v_rotto = v_def then
    raise exception
      '7 CONTROLLO POSITIVO FALLISCE: non ho trovato il filtro di scadenza da '
      'togliere. O la migration non e'' applicata, o il testo e'' cambiato: in '
      'entrambi i casi i verdi sopra non provano quello che dichiarano.';
  end if;
  execute v_rotto;

  perform set_config('request.jwt.claim.sub', 'd2222222-2222-2222-2222-222222222222', true);
  delete from public.user_roles where user_id = 'd1111111-1111-1111-1111-111111111111';
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('d1111111-1111-1111-1111-111111111111','pro', now() - interval '1 day', 'pro scaduto');

  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int <> 8 then
    execute v_def;  -- ripristina comunque
    raise exception
      '7 CONTROLLO POSITIVO FALLISCE: senza il filtro di scadenza il Pro scaduto '
      'avrebbe dovuto riottenere il cap 8, invece ha dato %. Il verde del '
      'controllo 3 non dipende dal filtro.', r->>'cap';
  end if;

  execute v_def;  -- ripristina la versione corretta
  r := public.claim_group_invite('MESH-CAP8');
  if (r->>'cap')::int <> 3 then
    raise exception '7b FALLISCE  ripristino: la funzione corretta non da'' piu'' cap 3: %', r::text;
  end if;

  raise notice
    '7 PASSA  controllo positivo: senza il filtro il Pro scaduto torna a cap 8, '
    'con il filtro resta a cap 3. Il caso 3 dipende davvero dal filtro.';
end
$t$;

\echo 'claim_group_invite: sette controlli, tutti verdi.'
