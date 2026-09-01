-- Forward-only: public.has_role(text) onora expires_at, e smette di essere
-- eseguibile da chiunque.
--
-- NON APPLICATA IN PRODUZIONE. Nessuna mutazione remota.
-- Esercitata localmente: gira nel reset completo su Postgres 17 usa-e-getta.
--
-- ============================================================================
-- IL DIFETTO, LETTO DAL CATALOGO LIVE IL 25/08/2026
-- ============================================================================
-- Corpo vivo, per intero:
--
--   select exists(select 1 from public.user_roles
--                 where user_id = auth.uid() and role = check_role);
--
-- Non nomina expires_at. Un ruolo scaduto continua quindi a rispondere true.
-- has_role e' l'AUTORITA' GENERALE: non decide su un ruolo particolare, decide
-- su qualunque ruolo le si chieda. Il difetto vale per ognuno.
--
-- In piu':
--   search_path = 'public', 'auth'  ->  deve essere ''
--   ACL: PUBLIC=EXECUTE, anon=EXECUTE, authenticated, service_role
--
-- L'autorita' corretta e':
--   role = check_role
--   and (expires_at is null or expires_at > now())
--
-- ============================================================================
-- PERCHE' QUESTA MIGRATION TOCCA ANCHE is_caregiver()
-- ============================================================================
-- Non e' allargamento di scopo, e' la stessa correzione. public.is_caregiver()
-- e' un guscio di UNA riga:
--
--   select public.has_role('caregiver');
--
-- Ed e' SECURITY DEFINER. Quindi il suo corpo gira come postgres, che ha
-- EXECUTE su has_role qualunque cosa si revochi. Revocare has_role ad anon e
-- lasciare is_caregiver concessa ad anon significa lasciare aperta la stessa
-- porta con un'insegna diversa: anon non puo' piu' chiamare has_role, ma puo'
-- chiamare la funzione che la chiama per lui.
--
-- Nessuna policy RLS chiama has_role o is_caregiver (verificato su pg_policy
-- in produzione: zero righe), quindi revocarle non rompe nessuna valutazione
-- di policy. Se ne chiamasse una scoped a PUBLIC, la revoca farebbe fallire la
-- query invece di restituire false, ed e' il motivo per cui questo controllo
-- e' stato fatto prima e non dopo.
--
-- ============================================================================
-- COSA NON CAMBIA
-- ============================================================================
-- La lettura resta su auth.uid() e SOLO su auth.uid(): has_role continua a
-- rispondere sull'utente autenticato, mai su un utente arbitrario. Non prende
-- e non prendera' un parametro user_id: una funzione che risponde «X ha il
-- ruolo Y» concessa ad authenticated sarebbe un enumeratore di privilegi
-- altrui.
--
-- La non ricorsione poggia sullo stesso invariante di is_admin: il
-- PROPRIETARIO della funzione deve bypassare RLS su user_roles. Verificato
-- qui sotto e poi provato chiamando la funzione.
-- ============================================================================

create or replace function public.has_role(check_role text)
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
        and ur.role = check_role
        -- Un ruolo scaduto non concede niente.
        and (ur.expires_at is null or ur.expires_at > now())
    )
  end;
$$;

-- anon ha una concessione ESPLICITA e PUBLIC ne ha un'altra: servono entrambe
-- le revoche. Una sola non basta, perche' anon eredita da PUBLIC.
revoke all on function public.has_role(text) from public;
revoke all on function public.has_role(text) from anon;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_role(text) to service_role;

comment on function public.has_role(text) is
  'true se l''utente autenticato ha in public.user_roles una riga con il ruolo '
  'richiesto e NON SCADUTA (expires_at nullo oppure futuro). Autorita'' generale '
  'sui ruoli. Legge solo auth.uid(): non risponde mai su un altro utente.';

-- is_caregiver: stesso irrobustimento, per non lasciare aperta la porta di
-- servizio descritta sopra. Il corpo resta identico nella sostanza.
create or replace function public.is_caregiver()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('caregiver');
$$;

revoke all on function public.is_caregiver() from public;
revoke all on function public.is_caregiver() from anon;
grant execute on function public.is_caregiver() to authenticated;
grant execute on function public.is_caregiver() to service_role;

comment on function public.is_caregiver() is
  'true se l''utente autenticato ha il ruolo caregiver NON SCADUTO. '
  'Guscio su public.has_role, da cui eredita il controllo di scadenza.';

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE — comportamento, non indicatori indiretti
-- ============================================================================
do $dopo$
declare
  v_owner    name;
  v_bypassa  boolean;
  v_corpo    text;
  v_risposta boolean;
begin
  select r.rolname, (r.rolsuper or r.rolbypassrls), pg_get_functiondef(p.oid)
    into v_owner, v_bypassa, v_corpo
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.oid = p.proowner
  where n.nspname = 'public' and p.proname = 'has_role'
  limit 1;

  if v_corpo !~ 'expires_at' then
    raise exception
      'has_role: il corpo non nomina expires_at. Un ruolo scaduto continuerebbe '
      'a concedere accesso, per OGNI ruolo, non solo per uno.';
  end if;
  if v_corpo !~ 'auth\.uid\(\)' then
    raise exception 'has_role: non legge auth.uid(). La lettura deve restare sull''utente autenticato.';
  end if;

  if not v_bypassa and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_roles r on r.oid = c.relowner
    where n.nspname = 'public' and c.relname = 'user_roles'
      and r.rolname = v_owner and not c.relforcerowsecurity
  ) then
    raise exception
      'has_role: il proprietario % non bypassa RLS su user_roles, ne'' la '
      'possiede senza FORCE: la lettura valuterebbe le policy della tabella.',
      v_owner;
  end if;

  -- Nessuna concessione residua, ne' diretta ne' attraverso il guscio.
  if has_function_privilege('anon', 'public.has_role(text)', 'EXECUTE') then
    raise exception 'has_role: anon puo'' ancora eseguirla.';
  end if;
  if has_function_privilege('anon', 'public.is_caregiver()', 'EXECUTE') then
    raise exception
      'is_caregiver: anon puo'' ancora eseguirla, e da li'' raggiunge has_role '
      'perche'' e'' SECURITY DEFINER.';
  end if;
  if not has_function_privilege('authenticated', 'public.has_role(text)', 'EXECUTE') then
    raise exception 'has_role: authenticated ha perso EXECUTE.';
  end if;

  -- La prova vera: chiamarle. Se ricorrono, qui si ferma tutto.
  begin
    select public.has_role('admin') into v_risposta;
    select public.is_caregiver()    into v_risposta;
  exception when others then
    raise exception
      'has_role/is_caregiver: la chiamata di prova e'' fallita (%). Se e'' «stack '
      'depth limit exceeded» e'' una ricorsione con le policy di user_roles.', sqlerrm;
  end;

  raise notice
    'has_role e is_caregiver: SECURITY DEFINER di %, bypassano RLS, onorano '
    'expires_at, revocate a PUBLIC e anon, chiamate di prova completate.',
    v_owner;
end
$dopo$;
