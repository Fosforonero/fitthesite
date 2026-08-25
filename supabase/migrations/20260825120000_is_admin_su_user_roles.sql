-- Forward-only: public.is_admin() smette di leggere una email incorporata e
-- passa a public.user_roles come unica autorita', ONORANDO LA SCADENZA.
--
-- NON APPLICATA IN PRODUZIONE. Nessuna mutazione remota.
-- Esercitata localmente: gira nel reset completo su Postgres 17 usa-e-getta.
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
-- L'AUTORITA' E' LA RIGA ATTIVA, NON LA RIGA
-- ============================================================================
-- `public.user_roles` ha una colonna `expires_at`, aggiunta da
-- 20260610121037_user_roles_expiry. Un ruolo con `expires_at` nel passato e'
-- SCADUTO e non concede piu' niente. L'autorita' e' quindi:
--
--   ur.role = 'admin'
--   and (ur.expires_at is null or ur.expires_at > now())
--
-- Vale in ENTRAMBI i punti di questo file, e non solo nella funzione:
-- il conteggio preliminare deve contare gli admin ATTIVI, altrimenti una
-- riga scaduta soddisferebbe il vincolo «esattamente due» e farebbe passare
-- un'applicazione che invece va fermata. Un ruolo scaduto non diventa valido
-- perche' e' comodo per un controllo.
--
-- Attivi e scaduti si contano SEPARATAMENTE, e il messaggio li riporta
-- entrambi: «zero admin» e «due admin, tutti scaduti» sono due situazioni
-- diverse e vanno distinte a chi legge l'errore.
--
-- Misurato in produzione il 25/08/2026: admin attivi 2, admin scaduti 0,
-- entrambe le righe con `expires_at` NULL, cioe' permanenti. Oggi quindi la
-- correzione non cambia il comportamento. Cambia il significato del vincolo,
-- e protegge il giorno in cui una concessione admin verra' data a termine.
--
-- ============================================================================
-- IL CAMBIO DI ACCESSO, DICHIARATO E NON NASCOSTO
-- ============================================================================
-- Misurato in produzione il 25/08/2026:
--
--   - la whitelist incorporata contiene 1 indirizzo, e corrisponde a 1
--     utente reale;
--   - quell'utente HA GIA' una riga role='admin' attiva in user_roles: il
--     passaggio non toglie l'accesso a nessuno;
--   - ma le righe role='admin' ATTIVE sono DUE. La seconda porta la nota
--     «admin completo (sito+app), autorizzato da mat.pizzi 2026-05-27» e
--     NON e' nella whitelist.
--
-- Quindi questa migration DA' is_admin()=true a un utente che oggi non ce
-- l'ha. Non e' un allargamento arbitrario: e' un permesso che Matteo aveva
-- gia' autorizzato e registrato in user_roles a maggio, e che il percorso di
-- enforcement non ha mai onorato. Ma resta un cambio di accesso, e la regola
-- di questo progetto e' esplicita: rollback immediato se cambia l'accesso.
--
-- Per questo il blocco di verifica sotto ABORTA se gli admin ATTIVI non sono
-- esattamente due: applicare questa migration deve restare un atto
-- consapevole, non una sorpresa.
--
-- ============================================================================
-- PERCHE' NON SI RIUSA has_role('admin')
-- ============================================================================
-- Non e' una preferenza di stile. `public.has_role` legge user_roles e NON
-- guarda `expires_at`: verificato nel catalogo di produzione il 25/08/2026,
-- il suo corpo non nomina quella colonna. Riusarla qui avrebbe ereditato
-- esattamente il difetto che questa migration corregge, dentro la funzione
-- scritta per correggerlo.
--
-- In piu' has_role ha `search_path = public, auth` ed e' concessa ad anon.
--
-- Nella stessa scansione risultano senza controllo di scadenza anche
-- public.delete_current_user, public.get_dashboard_snapshot e
-- public.grant_pro_to_email. Registrato come osservazione: non si toccano
-- qui, e oggi non hanno effetto perche' i ruoli 'pro' scaduti sono zero.
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
-- ============================================================================

do $verifica$
declare
  v_attivi  integer;
  v_scaduti integer;
  v_utenti  integer;
begin
  if to_regclass('public.user_roles') is null then
    raise exception 'is_admin/user_roles: public.user_roles non esiste. Fermarsi.';
  end if;

  select count(*) into v_utenti from auth.users;

  -- Attivi e scaduti contati separatamente, sulla stessa autorita' che usera'
  -- la funzione. Non sommarli: una riga scaduta non e' un admin.
  select
    count(*) filter (where ur.expires_at is null or ur.expires_at > now()),
    count(*) filter (where ur.expires_at is not null and ur.expires_at <= now())
    into v_attivi, v_scaduti
  from public.user_roles ur
  where ur.role = 'admin';

  -- Installazione nuova: nessun utente, quindi nessun accesso da preservare
  -- e nessuno da chiudere fuori. I controlli sui dati non si applicano.
  if v_utenti = 0 then
    raise notice
      'is_admin/user_roles: database vuoto (zero utenti), controlli sui dati saltati. '
      'Su un database nuovo il primo admin va inserito in user_roles a mano.';
  else
    if v_attivi = 0 then
      raise exception
        'is_admin/user_roles: % utenti e zero admin ATTIVI (righe admin scadute: %). '
        'Applicare questa migration chiuderebbe fuori tutti dall''amministrazione. '
        'Una riga scaduta non conta: rinnovarla o inserirne una valida prima di procedere.',
        v_utenti, v_scaduti;
    end if;

    if v_attivi <> 2 then
      raise exception
        'is_admin/user_roles: admin ATTIVI attesi 2, trovati % (piu'' % scaduti). '
        'Il numero e'' cambiato dopo la verifica del 25/08/2026: rivedere CHI '
        'guadagna o perde accesso prima di procedere, e aggiornare questo numero '
        'solo dopo averlo deciso.',
        v_attivi, v_scaduti;
    end if;

    raise notice
      'is_admin/user_roles: precondizioni verificate (% admin attivi, % scaduti, su % utenti).',
      v_attivi, v_scaduti, v_utenti;
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
        -- Un ruolo scaduto non concede niente. Togliere questa riga e' il
        -- difetto che il controllo positivo dei test riproduce apposta.
        and (ur.expires_at is null or ur.expires_at > now())
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
  'true se l''utente autenticato ha in public.user_roles una riga role=admin '
  'NON SCADUTA (expires_at nullo oppure futuro). Autorita'' unica: user_roles. '
  'Nessuna email incorporata. SECURITY DEFINER di postgres: la lettura di '
  'user_roles bypassa RLS, evitando la ricorsione con le policy admin di '
  'quella stessa tabella.';

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE — comportamento, non indicatori indiretti
-- ============================================================================
do $dopo$
declare
  v_owner    name;
  v_bypassa  boolean;
  v_secdef   boolean;
  v_corpo    text;
  v_risposta boolean;
begin
  select r.rolname, (r.rolsuper or r.rolbypassrls), p.prosecdef, pg_get_functiondef(p.oid)
    into v_owner, v_bypassa, v_secdef, v_corpo
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.oid = p.proowner
  where n.nspname = 'public' and p.proname = 'is_admin'
  limit 1;

  if not v_secdef then
    raise exception 'is_admin: non e'' SECURITY DEFINER. Con SECURITY INVOKER ricorre.';
  end if;

  -- Postcondizione sulla scadenza: la funzione deve leggere user_roles E
  -- guardare expires_at. Senza la seconda meta', un admin scaduto resterebbe
  -- admin, ed e' esattamente cio' che questa migration esiste per impedire.
  if v_corpo !~ 'user_roles' then
    raise exception 'is_admin: non legge public.user_roles.';
  end if;
  if v_corpo !~ 'expires_at' then
    raise exception
      'is_admin: il corpo non nomina expires_at. Un ruolo admin scaduto '
      'continuerebbe a concedere accesso.';
  end if;
  if v_corpo ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' then
    raise exception 'is_admin: il corpo contiene un indirizzo email.';
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
    'is_admin: SECURITY DEFINER di %, bypassa RLS, onora expires_at, chiamata di '
    'prova completata (ha risposto %).',
    v_owner, v_risposta;
end
$dopo$;
