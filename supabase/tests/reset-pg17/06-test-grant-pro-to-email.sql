-- Controlli su public.grant_pro_to_email(text) dopo la forward-only
-- 20260825120005.
--
-- I quattro casi di riga richiesti: assente, permanente, futura, scaduta.
-- Piu' l'utente inesistente, piu' il controllo che nessun chiamante non
-- privilegiato possa eseguirla.
--
-- Il caso che conta e' la riga SCADUTA: prima faceva DO NOTHING e rispondeva
-- granted=false lasciando l'utente senza Pro, mentre la nota che la funzione
-- stessa scrive promette «accesso Pro gratuito a vita».

\set ON_ERROR_STOP on

delete from public.user_roles where user_id in (
  'b1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333','b4444444-4444-4444-4444-444444444444');
delete from auth.users where id in (
  'b1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333','b4444444-4444-4444-4444-444444444444');

insert into auth.users (id, email) values
  ('b1111111-1111-1111-1111-111111111111','assente@prova.invalid'),
  ('b2222222-2222-2222-2222-222222222222','permanente@prova.invalid'),
  ('b3333333-3333-3333-3333-333333333333','futura@prova.invalid'),
  ('b4444444-4444-4444-4444-444444444444','scaduta@prova.invalid');

-- b1 non ha nessuna riga. Gli altri tre si', in tre stati diversi.
insert into public.user_roles (user_id, role, expires_at, note) values
  ('b2222222-2222-2222-2222-222222222222','pro', null,                       'concessione originale permanente'),
  ('b3333333-3333-3333-3333-333333333333','pro', now() + interval '30 days', 'concessione originale a termine'),
  ('b4444444-4444-4444-4444-444444444444','pro', now() - interval '2 days',  'concessione originale scaduta');

do $t$
declare
  r          jsonb;
  v_scadenza timestamptz;
  v_nota     text;
  esito      text;
begin
  -- 1. RIGA ASSENTE -> concessa a vita
  r := public.grant_pro_to_email('assente@prova.invalid');
  select ur.expires_at into v_scadenza from public.user_roles ur
   where ur.user_id = 'b1111111-1111-1111-1111-111111111111' and ur.role = 'pro';
  if r->>'esito' = 'concesso' and (r->>'granted')::boolean and v_scadenza is null then
    raise notice '1 PASSA  riga assente -> concesso, expires_at NULL';
  else
    raise exception '1 FALLISCE  riga assente: esito=%, granted=%, expires_at=%',
      r->>'esito', r->>'granted', v_scadenza;
  end if;

  -- 2. RIGA PERMANENTE -> non si tocca, e la provenienza originale sopravvive
  r := public.grant_pro_to_email('permanente@prova.invalid');
  select ur.expires_at, ur.note into v_scadenza, v_nota from public.user_roles ur
   where ur.user_id = 'b2222222-2222-2222-2222-222222222222' and ur.role = 'pro';
  if r->>'esito' = 'gia_a_vita' and not (r->>'granted')::boolean
     and v_scadenza is null and v_nota = 'concessione originale permanente' then
    raise notice '2 PASSA  riga permanente -> gia_a_vita, nota originale intatta';
  else
    raise exception
      '2 FALLISCE  riga permanente: esito=%, granted=%, expires_at=%, nota=%. '
      'Su una riga gia'' a vita non si deve toccare niente, nemmeno la nota: '
      'sovrascriverla cancellerebbe la provenienza di una concessione precedente.',
      r->>'esito', r->>'granted', v_scadenza, v_nota;
  end if;

  -- 3. RIGA CON SCADENZA FUTURA -> portata a vita, provenienza dichiarata
  r := public.grant_pro_to_email('futura@prova.invalid');
  select ur.expires_at, ur.note into v_scadenza, v_nota from public.user_roles ur
   where ur.user_id = 'b3333333-3333-3333-3333-333333333333' and ur.role = 'pro';
  if r->>'esito' = 'esteso_a_vita' and (r->>'granted')::boolean and v_scadenza is null then
    if v_nota like '%concessione originale a termine%' and v_nota like '%grant_pro_to_email%' then
      raise notice '3 PASSA  riga futura -> esteso_a_vita, expires_at NULL, provenienza dichiarata';
    else
      raise exception
        '3 FALLISCE  riga futura: portata a vita ma la nota non dichiara da dove '
        'si veniva. Nota: %', v_nota;
    end if;
  else
    raise exception '3 FALLISCE  riga futura: esito=%, granted=%, expires_at=%',
      r->>'esito', r->>'granted', v_scadenza;
  end if;

  -- 4. RIGA SCADUTA -> riattivata a vita. E' il caso che prima si perdeva.
  r := public.grant_pro_to_email('scaduta@prova.invalid');
  select ur.expires_at, ur.note into v_scadenza, v_nota from public.user_roles ur
   where ur.user_id = 'b4444444-4444-4444-4444-444444444444' and ur.role = 'pro';
  if r->>'esito' = 'riattivato_a_vita' and (r->>'granted')::boolean and v_scadenza is null then
    if v_nota like '%concessione originale scaduta%' then
      raise notice '4 PASSA  riga SCADUTA -> riattivato_a_vita, expires_at NULL, provenienza dichiarata';
    else
      raise exception '4 FALLISCE  riga scaduta: nota senza provenienza: %', v_nota;
    end if;
  else
    raise exception
      '4 FALLISCE  riga SCADUTA: esito=%, granted=%, expires_at=%. Con il vecchio '
      'DO NOTHING qui l''utente restava senza Pro e la funzione rispondeva '
      'granted=false, mentre prometteva «a vita».',
      r->>'esito', r->>'granted', v_scadenza;
  end if;

  -- 5. seconda chiamata sulla riga appena riattivata -> idempotente
  r := public.grant_pro_to_email('scaduta@prova.invalid');
  if r->>'esito' = 'gia_a_vita' then
    raise notice '5 PASSA  seconda chiamata -> gia_a_vita: idempotente, la nota non cresce';
  else
    raise exception '5 FALLISCE  seconda chiamata: esito=%', r->>'esito';
  end if;

  -- 6. utente inesistente
  r := public.grant_pro_to_email('nessuno@prova.invalid');
  if r->>'esito' = 'utente_non_trovato' and not (r->>'found')::boolean
     and not (r->>'granted')::boolean then
    raise notice '6 PASSA  utente inesistente -> utente_non_trovato';
  else
    raise exception '6 FALLISCE  utente inesistente: %', r::text;
  end if;

  -- 7. nessun chiamante non privilegiato
  select coalesce(string_agg(grantee, ', '), '(nessuno)') into esito
  from information_schema.routine_privileges
  where routine_schema = 'public' and routine_name = 'grant_pro_to_email'
    and grantee in ('PUBLIC','anon','authenticated');
  if esito = '(nessuno)' then
    raise notice '7 PASSA  nessun chiamante non privilegiato';
  else
    raise exception
      '7 FALLISCE  chiamanti non privilegiati ammessi: %. Questa funzione '
      'concede Pro a vita a un indirizzo qualunque.', esito;
  end if;

  if not has_function_privilege('service_role', 'public.grant_pro_to_email(text)', 'EXECUTE') then
    raise exception '7b FALLISCE  service_role ha perso EXECUTE';
  end if;
  raise notice '7b PASSA  service_role puo eseguirla';

  -- 8. il corpo non contiene piu' un DO NOTHING
  select case when pg_get_functiondef(p.oid) ~* 'on conflict[^;]*do nothing'
              then 'contiene ancora un DO NOTHING' else 'ok' end
    into esito
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'grant_pro_to_email';
  if esito = 'ok' then
    raise notice '8 PASSA  nessun DO NOTHING nel corpo';
  else
    raise exception '8 FALLISCE  %', esito;
  end if;

  raise notice '--- grant_pro_to_email: nove controlli, tutti verdi ---';
end
$t$;

-- ---------------------------------------------------------------------------
-- 9. CONTROLLO POSITIVO: con il vecchio DO NOTHING il caso 4 diventa rosso
-- ---------------------------------------------------------------------------
create or replace function public.prova_grant_pro_do_nothing(p_email text)
returns jsonb
language plpgsql security definer set search_path = '' as $f$
declare
  v_user_id uuid;
  v_rows int;
begin
  select id into v_user_id from auth.users
   where lower(email) = lower(trim(p_email)) limit 1;
  if v_user_id is null then
    return jsonb_build_object('found', false, 'granted', false);
  end if;
  insert into public.user_roles (user_id, role, note)
  values (v_user_id, 'pro', 'a vita')
  on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('found', true, 'granted', v_rows > 0);
end;
$f$;

do $t$
declare
  r          jsonb;
  v_scadenza timestamptz;
begin
  -- rimette la riga di b4 nello stato scaduto
  update public.user_roles set expires_at = now() - interval '2 days'
   where user_id = 'b4444444-4444-4444-4444-444444444444' and role = 'pro';

  r := public.prova_grant_pro_do_nothing('scaduta@prova.invalid');
  select ur.expires_at into v_scadenza from public.user_roles ur
   where ur.user_id = 'b4444444-4444-4444-4444-444444444444' and ur.role = 'pro';

  if (r->>'granted')::boolean or v_scadenza is null then
    raise exception
      '9 CONTROLLO POSITIVO FALLISCE: la variante con DO NOTHING avrebbe dovuto '
      'lasciare la riga scaduta e rispondere granted=false. Ha risposto % e la '
      'scadenza e'' %. Il verde del controllo 4 non prova quello che dichiara.',
      r->>'granted', v_scadenza;
  end if;

  raise notice
    '9 PASSA  controllo positivo: con DO NOTHING la riga resta scaduta (%) e la '
    'funzione risponde granted=%. E'' esattamente il difetto corretto.',
    v_scadenza::date, r->>'granted';

  -- e la funzione vera la ripara
  r := public.grant_pro_to_email('scaduta@prova.invalid');
  select ur.expires_at into v_scadenza from public.user_roles ur
   where ur.user_id = 'b4444444-4444-4444-4444-444444444444' and ur.role = 'pro';
  if v_scadenza is not null or r->>'esito' <> 'riattivato_a_vita' then
    raise exception '9b FALLISCE  la funzione vera non ha riparato la riga: esito=%', r->>'esito';
  end if;
  raise notice '9b PASSA  la funzione vera riporta la stessa riga a vita';
end
$t$;

drop function if exists public.prova_grant_pro_do_nothing(text);

\echo 'grant_pro_to_email: dieci controlli, tutti verdi.'
