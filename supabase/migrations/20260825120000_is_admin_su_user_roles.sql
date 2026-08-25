-- Forward-only: public.is_admin() smette di leggere una email incorporata e
-- passa a public.user_roles come unica autorita'.
--
-- NON APPLICATA. Nessuna mutazione remota da questa sessione.
--
-- ============================================================================
-- PERCHE'
-- ============================================================================
-- La is_admin() viva incorpora un indirizzo email personale nel proprio
-- corpo e legge auth.users. L'indirizzo non deve stare in Git, e la
-- whitelist per email non e' un meccanismo di autorizzazione: e' una
-- costante che nessuno puo' cambiare senza una migration.
--
-- Decisione di Matteo: public.user_roles come autorita', nessuna tabella di
-- configurazione nuova.
--
-- ============================================================================
-- IL CAMBIO DI ACCESSO, DICHIARATO E NON NASCOSTO
-- ============================================================================
-- Misurato in produzione il 25/08/2026:
--
--   - la whitelist incorporata contiene 1 indirizzo, e corrisponde a 1
--     utente reale;
--   - quell'utente HA GIA' una riga role='admin' in user_roles: il
--     passaggio non toglie l'accesso a nessuno;
--   - ma le righe role='admin' sono DUE. La seconda porta la nota
--     «admin completo (sito+app), autorizzato da mat.pizzi 2026-05-27» e
--     NON e' nella whitelist.
--
-- Quindi questa migration DA' is_admin()=true a un utente che oggi non ce
-- l'ha. Non e' un allargamento arbitrario: e' un permesso che Matteo aveva
-- gia' autorizzato e registrato in user_roles a maggio, e che il percorso di
-- enforcement non ha mai onorato. Ma resta un cambio di accesso, e la regola
-- di questo progetto e' esplicita: rollback immediato se cambia l'accesso.
--
-- Per questo il blocco di verifica sotto ABORTA se le righe admin non sono
-- esattamente due: applicare questa migration deve restare un atto
-- consapevole, non una sorpresa.
--
-- ============================================================================
-- PERCHE' NON RICORRE, E COSA LO GARANTISCE DAVVERO
-- ============================================================================
-- Due policy su user_roles chiamano is_admin(): «admin manage roles» e
-- «admin select all roles». Se is_admin() legge user_roles e quella lettura
-- valutasse le policy, la ricorsione sarebbe infinita, e con essa fallirebbero
-- tutte le 18 policy che dipendono da is_admin().
--
-- L'invariante che lo impedisce e' UNA SOLA: il PROPRIETARIO della funzione
-- deve bypassare RLS su user_roles. In produzione e' postgres, che ha
-- rolbypassrls=true. Il corpo di una SECURITY DEFINER gira come il
-- proprietario, quindi la lettura di user_roles non valuta nessuna policy.
--
-- Misurato su Postgres 17 usa-e-getta il 25/08/2026, non dedotto:
--
--   SECURITY INVOKER ................................. stack depth limit exceeded
--   SECURITY DEFINER, proprietario senza bypassrls ... stack depth limit exceeded
--   SECURITY DEFINER, proprietario postgres .......... nessun errore
--   ... e con FORCE ROW LEVEL SECURITY attivo ........ nessun errore lo stesso
--
-- L'ultima riga corregge un'ipotesi sbagliata della prima stesura di questo
-- file: FORCE ROW LEVEL SECURITY era stato indicato come la condizione
-- pericolosa. Non lo e'. FORCE vincola il proprietario della TABELLA, e non
-- ha alcun effetto su un ruolo che bypassa RLS. Guardare relforcerowsecurity
-- avrebbe bloccato l'applicazione in casi sicuri e non avrebbe protetto da
-- quello vero.
--
-- Per questo il controllo qui sotto non usa un indicatore indiretto: dopo
-- aver creato la funzione la CHIAMA. Se ricorre, la transazione fallisce e
-- niente resta applicato.
--
-- Per lo stesso motivo non si riusa has_role('admin'): aggiungerebbe
-- un'indirezione le cui proprieta' di sicurezza andrebbero riverificate, e
-- has_role ha search_path=public,auth ed e' concessa ad anon.
-- ============================================================================

do $verifica$
declare
  v_admin  integer;
  v_utenti integer;
begin
  if to_regclass('public.user_roles') is null then
    raise exception 'is_admin/user_roles: public.user_roles non esiste. Fermarsi.';
  end if;

  select count(*) into v_utenti from auth.users;
  select count(*) into v_admin  from public.user_roles where role = 'admin';

  -- Installazione nuova: nessun utente, quindi nessun accesso da preservare
  -- e nessuno da chiudere fuori. I controlli sui dati non si applicano.
  if v_utenti = 0 then
    raise notice
      'is_admin/user_roles: database vuoto (zero utenti), controlli sui dati saltati. '
      'Su un database nuovo il primo admin va inserito in user_roles a mano.';
  else
    if v_admin = 0 then
      raise exception
        'is_admin/user_roles: % utenti ma zero righe role=''admin''. Applicare questa '
        'migration chiuderebbe fuori tutti dall''amministrazione. Inserire prima le righe.',
        v_utenti;
    end if;

    if v_admin <> 2 then
      raise exception
        'is_admin/user_roles: righe role=''admin'' attese 2, trovate %. Il numero e'' '
        'cambiato dopo la verifica del 25/08/2026: rivedere CHI guadagna accesso '
        'prima di procedere, e aggiornare questo numero solo dopo averlo deciso.',
        v_admin;
    end if;

    raise notice 'is_admin/user_roles: precondizioni verificate (% righe admin su % utenti).',
      v_admin, v_utenti;
  end if;
end
$verifica$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  end;
$$;

-- anon aveva una concessione ESPLICITA, e PUBLIC ne aveva un'altra: servono
-- entrambe le revoche. Una sola non basta, perche' anon eredita da PUBLIC.
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

comment on function public.is_admin() is
  'true se l''utente autenticato ha role=admin in public.user_roles. '
  'Autorita'' unica: user_roles. Nessuna email incorporata. '
  'SECURITY DEFINER di postgres: la lettura di user_roles bypassa RLS, '
  'evitando la ricorsione con le policy admin di quella stessa tabella.';

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE — comportamento, non indicatori indiretti
-- ============================================================================
do $dopo$
declare
  v_owner    name;
  v_bypassa  boolean;
  v_secdef   boolean;
  v_risposta boolean;
begin
  select r.rolname, (r.rolsuper or r.rolbypassrls), p.prosecdef
    into v_owner, v_bypassa, v_secdef
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.oid = p.proowner
  where n.nspname = 'public' and p.proname = 'is_admin'
  limit 1;

  if not v_secdef then
    raise exception 'is_admin: non e'' SECURITY DEFINER. Con SECURITY INVOKER ricorre.';
  end if;

  if not v_bypassa and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_roles r on r.oid = c.relowner
    where n.nspname = 'public' and c.relname = 'user_roles'
      and r.rolname = v_owner and not c.relforcerowsecurity
  ) then
    raise exception
      'is_admin: il proprietario % non bypassa RLS su user_roles, ne'' la possiede '
      'senza FORCE. In questa configurazione la funzione ricorre all''infinito, '
      'perche'' le policy admin di user_roles chiamano is_admin().', v_owner;
  end if;

  -- La prova vera: chiamarla. Se ricorre, qui si ferma tutto.
  begin
    select public.is_admin() into v_risposta;
  exception when others then
    raise exception
      'is_admin: la chiamata di prova e'' fallita (%). Se e'' «stack depth limit '
      'exceeded» e'' la ricorsione con le policy di user_roles.', sqlerrm;
  end;

  raise notice
    'is_admin: SECURITY DEFINER di %, bypassa RLS, chiamata di prova completata (ha risposto %).',
    v_owner, v_risposta;
end
$dopo$;
