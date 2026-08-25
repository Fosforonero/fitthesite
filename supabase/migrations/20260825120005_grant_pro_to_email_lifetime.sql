-- Forward-only: public.grant_pro_to_email(text) mantiene il contratto che
-- dichiara, invece di fallire in silenzio su una riga scaduta.
--
-- NON APPLICATA IN PRODUZIONE. Nessuna mutazione remota.
-- Esercitata localmente: gira nel reset completo su Postgres 17 usa-e-getta.
--
-- ============================================================================
-- IL CONTRATTO, E DOVE SI ROMPE
-- ============================================================================
-- Il contratto e' scritto dentro la funzione stessa, nella nota che scrive:
-- «beta tester closed beta - accesso Pro gratuito a vita». Pro A VITA.
--
-- Il corpo vivo, letto dal catalogo il 25/08/2026, fa pero':
--
--   insert into public.user_roles (user_id, role, note)
--   values (v_user_id, 'pro', '...a vita')
--   on conflict (user_id, role) do nothing;
--
-- e riporta `granted` = «ho inserito una riga».
--
-- Su una riga 'pro' GIA' PRESENTE ma con expires_at nel passato, quindi
-- SCADUTA, il DO NOTHING non fa niente: l'utente resta senza Pro, e la
-- funzione risponde granted=false. Chi la chiama legge «non concesso» e non
-- ha modo di distinguerlo da «gia' a posto». Il contratto dice «a vita»,
-- l'effetto e' «niente».
--
-- Lo stesso vale, in modo meno vistoso, per una riga con scadenza FUTURA:
-- resta a termine, mentre il contratto promette che non scada mai.
--
-- ============================================================================
-- COSA FA ADESSO, DICHIARATO CASO PER CASO
-- ============================================================================
--   riga assente ................ INSERT, expires_at NULL   -> 'concesso'
--   riga permanente ............. nessuna modifica          -> 'gia_a_vita'
--   riga con scadenza futura .... expires_at := NULL        -> 'esteso_a_vita'
--   riga scaduta ................ expires_at := NULL        -> 'riattivato_a_vita'
--   utente inesistente .......... nessuna modifica          -> 'utente_non_trovato'
--
-- La provenienza non viene sovrascritta alla cieca: la nota nuova DICHIARA
-- che e' stata questa funzione a portare la riga a vita, e conserva la nota
-- precedente e la scadenza che c'era prima. Un giro successivo cade su
-- 'gia_a_vita' e non tocca piu' niente, quindi la nota non cresce a ogni
-- chiamata.
--
-- `granted` cambia significato, ed e' l'unico modo per renderlo vero: adesso
-- e' «l'utente ha Pro a vita PER EFFETTO di questa chiamata». Prima era «ho
-- inserito una riga», che sul caso scaduto rispondeva false mentre l'utente
-- restava scoperto. Nessun chiamante nel codice: verificato con una ricerca
-- su app, lib, scripts e components di fitthesite, zero occorrenze fuori
-- dalle migration. Si invoca a mano con service_role.
--
-- ============================================================================
-- CHI PUO' CHIAMARLA
-- ============================================================================
-- ACL vivo: postgres, service_role. Nessun chiamante non privilegiato, gia'
-- oggi. Le revoche qui sotto sono esplicite e idempotenti perche' una
-- proprieta' di sicurezza non deve dipendere dal fatto che nessuno l'abbia
-- mai concessa: deve essere scritta. Il blocco finale la verifica.
--
-- search_path passa a '' (era 'public', 'auth'). Il corpo qualifica gia'
-- tutto, quindi non cambia nulla di cio' che risolve.
-- ============================================================================

create or replace function public.grant_pro_to_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id    uuid;
  v_esiste     boolean;
  v_scadenza   timestamptz;
  v_nota_prec  text;
  v_esito      text;
  v_concesso   boolean;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'found',   false,
      'user_id', null,
      'granted', false,
      'esito',   'utente_non_trovato',
      'email',   p_email
    );
  end if;

  select true, ur.expires_at, ur.note
    into v_esiste, v_scadenza, v_nota_prec
  from public.user_roles ur
  where ur.user_id = v_user_id and ur.role = 'pro';

  if not coalesce(v_esiste, false) then
    insert into public.user_roles (user_id, role, expires_at, note)
    values (v_user_id, 'pro', null,
            'beta tester closed beta - accesso Pro gratuito a vita');
    v_esito := 'concesso';
    v_concesso := true;

  elsif v_scadenza is null then
    -- Gia' a vita: non si tocca. Sovrascrivere la nota qui cancellerebbe la
    -- provenienza di una concessione precedente senza aggiungere niente.
    v_esito := 'gia_a_vita';
    v_concesso := false;

  else
    -- Scaduta o a termine: il contratto dice «a vita», quindi si porta a vita
    -- e si dichiara da dove si veniva.
    update public.user_roles ur
       set expires_at = null,
           granted_at = now(),
           note = 'accesso Pro gratuito a vita (portata a vita da '
                  || 'grant_pro_to_email il ' || to_char(now(), 'YYYY-MM-DD')
                  || '; scadenza precedente ' || to_char(v_scadenza, 'YYYY-MM-DD')
                  || '; nota precedente: ' || coalesce(v_nota_prec, '(nessuna)') || ')'
     where ur.user_id = v_user_id and ur.role = 'pro';

    v_esito := case when v_scadenza <= now() then 'riattivato_a_vita'
                    else 'esteso_a_vita' end;
    v_concesso := true;
  end if;

  return jsonb_build_object(
    'found',   true,
    'user_id', v_user_id,
    'granted', v_concesso,
    'esito',   v_esito,
    'email',   p_email
  );
end;
$function$;

revoke all on function public.grant_pro_to_email(text) from public;
revoke all on function public.grant_pro_to_email(text) from anon;
revoke all on function public.grant_pro_to_email(text) from authenticated;
grant execute on function public.grant_pro_to_email(text) to service_role;

comment on function public.grant_pro_to_email(text) is
  'Concede Pro A VITA all''utente con quella email. Su una riga gia'' esistente '
  'e scaduta o a termine porta expires_at a NULL e dichiara nella nota da dove '
  'si veniva; su una riga gia'' permanente non tocca niente. Solo service_role. '
  'La chiave "granted" significa «ha Pro a vita per effetto di questa chiamata».';

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE
-- ============================================================================
do $dopo$
declare
  v_corpo text;
  v_apert text;
begin
  select pg_get_functiondef(p.oid) into v_corpo
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'grant_pro_to_email';

  if v_corpo ~* 'on conflict[^;]*do nothing' then
    raise exception
      'grant_pro_to_email: c''e'' ancora un DO NOTHING. Su una riga scaduta '
      'l''utente resterebbe senza Pro mentre la funzione promette «a vita».';
  end if;
  if v_corpo !~ 'expires_at' then
    raise exception 'grant_pro_to_email: il corpo non nomina expires_at.';
  end if;

  select coalesce(string_agg(grantee, ', '), '') into v_apert
  from information_schema.routine_privileges
  where routine_schema = 'public' and routine_name = 'grant_pro_to_email'
    and grantee in ('PUBLIC', 'anon', 'authenticated');
  if v_apert <> '' then
    raise exception
      'grant_pro_to_email: chiamanti non privilegiati ancora ammessi: %', v_apert;
  end if;
  if not has_function_privilege('service_role', 'public.grant_pro_to_email(text)', 'EXECUTE') then
    raise exception 'grant_pro_to_email: service_role ha perso EXECUTE.';
  end if;

  raise notice
    'grant_pro_to_email: niente DO NOTHING, onora expires_at, solo service_role.';
end
$dopo$;
