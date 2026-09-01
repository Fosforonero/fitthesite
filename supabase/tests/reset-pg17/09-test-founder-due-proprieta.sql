-- Le DUE proprieta' distinte di un ruolo Pro scaduto.
--
-- Decisione di Matteo, 25/08/2026: la coppia Founder NON si modifica.
-- Il controllo non filtrato riguarda l'ELEGGIBILITA' STORICA Founder, non
-- l'entitlement attivo. Sono due domande diverse sulla stessa riga:
--
--   «questo utente ha accesso adesso?»        -> deve rispettare expires_at
--   «a questo utente e' gia' stato dato Pro?» -> non deve rispettarlo
--
-- La seconda e' una domanda sul PASSATO. Se un utente ha gia' avuto un Pro,
-- il posto Founder non gli spetta piu', e la scadenza di quel Pro non lo
-- rimette in coda. Filtrare qui riaprirebbe l'eleggibilita' a chi il
-- programma aveva gia' servito.
--
-- Questo file esiste perche' le due proprieta' possono divergere senza che
-- nessuno se ne accorga: una modifica che «uniformasse» il filtro le
-- confonderebbe, e il danno si vedrebbe solo alla prossima riapertura del
-- programma. Qui si pretende che restino distinte, tutte e due, insieme.

\set ON_ERROR_STOP on

delete from public.user_roles where user_id = 'e1111111-1111-1111-1111-111111111111';
delete from auth.users where id = 'e1111111-1111-1111-1111-111111111111';

-- L'utente e' creato PRIMA del cutoff del programma founder (31/07/2026),
-- altrimenti get_entitlement_status risponderebbe 'program_closed' e il test
-- non arriverebbe mai al ramo che ci interessa.
insert into auth.users (id, email, created_at)
values ('e1111111-1111-1111-1111-111111111111','founder@prova.invalid',
        '2026-06-01T00:00:00Z'::timestamptz);

do $t$
declare
  s            jsonb;
  v_accesso    boolean;
  v_elegg      text;
begin
  perform set_config('request.jwt.claim.sub', 'e1111111-1111-1111-1111-111111111111', true);

  -- =========================================================================
  -- 1. Pro ATTIVO: accesso si', eleggibilita' Founder chiusa
  -- =========================================================================
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('e1111111-1111-1111-1111-111111111111','pro', null, 'pro permanente');

  v_accesso := public.user_has_active_entitlement('e1111111-1111-1111-1111-111111111111');
  s := public.get_entitlement_status();
  v_elegg := s->>'founderEligibility';

  if not v_accesso then
    raise exception '1 FALLISCE  Pro permanente: atteso accesso true';
  end if;
  if v_elegg <> 'already_has_pro' then
    raise exception '1 FALLISCE  Pro permanente: attesa eleggibilita'' already_has_pro, ottenuta %', v_elegg;
  end if;
  raise notice '1 PASSA  Pro attivo -> accesso SI, eleggibilita'' Founder chiusa (already_has_pro)';

  -- =========================================================================
  -- 2. Pro SCADUTO: le due proprieta' DEVONO divergere
  -- =========================================================================
  update public.user_roles set expires_at = now() - interval '1 day'
   where user_id = 'e1111111-1111-1111-1111-111111111111' and role = 'pro';

  v_accesso := public.user_has_active_entitlement('e1111111-1111-1111-1111-111111111111');
  s := public.get_entitlement_status();
  v_elegg := s->>'founderEligibility';

  -- 2a. l'accesso NON c'e' piu'
  if v_accesso then
    raise exception
      '2a FALLISCE  Pro SCADUTO: user_has_active_entitlement risponde true. Un '
      'diritto scaduto non da'' accesso. Se questo e'' rosso, il difetto e'' in '
      'private.entitlement_core, non qui.';
  end if;
  raise notice '2a PASSA  Pro scaduto -> nessun accesso (hasFullAccess false)';

  -- 2b. ma l'eleggibilita' Founder NON si riapre
  if v_elegg <> 'already_has_pro' then
    raise exception
      '2b FALLISCE  Pro SCADUTO: eleggibilita'' Founder tornata a «%». La '
      'scadenza di un Pro gia'' concesso NON deve rimettere l''utente in coda '
      'per un posto Founder: quello e'' un fatto del passato, e il posto e'' '
      'stato consumato. Qualcuno ha «uniformato» il filtro di scadenza fra le '
      'due proprieta''.', v_elegg;
  end if;
  raise notice '2b PASSA  Pro scaduto -> eleggibilita'' Founder ANCORA chiusa (already_has_pro)';

  -- 2c. e le due risposte devono essere diverse fra loro: e' il punto
  if v_accesso = (v_elegg = 'already_has_pro') then
    raise exception
      '2c FALLISCE  le due proprieta'' coincidono (accesso=%, eleggibilita''=%). '
      'Con un Pro scaduto devono divergere: nessun accesso, ma eleggibilita'' '
      'comunque chiusa.', v_accesso, v_elegg;
  end if;
  raise notice
    '2c PASSA  le due proprieta'' divergono, come devono: accesso %, eleggibilita'' %',
    v_accesso, v_elegg;

  -- =========================================================================
  -- 3. entitlementKind riflette la scadenza
  -- =========================================================================
  if coalesce(s->>'hasFullAccess','') = 'true' then
    raise exception
      '3 FALLISCE  get_entitlement_status dice hasFullAccess true con un Pro '
      'scaduto: entitlementKind non sta rispettando expires_at.';
  end if;
  raise notice '3 PASSA  get_entitlement_status: hasFullAccess non e'' true con un Pro scaduto (kind: %)',
    coalesce(s->>'entitlementKind','(nullo)');

  raise notice '--- coppia Founder: cinque controlli, tutti verdi ---';
end
$t$;

-- ---------------------------------------------------------------------------
-- 4. CONTROLLO POSITIVO
-- Se il ramo Founder filtrasse la scadenza, il controllo 2b diventerebbe
-- rosso. Qui lo si dimostra su una copia, senza toccare la funzione vera.
-- ---------------------------------------------------------------------------
do $t$
declare
  v_def    text;
  v_uniforme text;
  s        jsonb;
  v_elegg  text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_entitlement_status';

  -- «uniforma» il filtro: aggiunge la scadenza anche al ramo Founder
  v_uniforme := replace(v_def,
    E'select 1 from public.user_roles r where r.user_id = v_user_id and r.role = ''pro''',
    E'select 1 from public.user_roles r where r.user_id = v_user_id and r.role = ''pro'' and (r.expires_at is null or r.expires_at > now())');

  if v_uniforme = v_def then
    raise exception
      '4 CONTROLLO POSITIVO FALLISCE: non ho trovato il ramo Founder non '
      'filtrato da modificare. Il testo e'' cambiato: i verdi sopra non provano '
      'quello che dichiarano.';
  end if;

  execute v_uniforme;
  perform set_config('request.jwt.claim.sub', 'e1111111-1111-1111-1111-111111111111', true);
  s := public.get_entitlement_status();
  v_elegg := s->>'founderEligibility';
  execute v_def;   -- ripristina SEMPRE la versione vera

  if v_elegg = 'already_has_pro' then
    raise exception
      '4 CONTROLLO POSITIVO FALLISCE: anche filtrando la scadenza l''eleggibilita'' '
      'resta already_has_pro. Il verde del controllo 2b non dipende dal ramo non '
      'filtrato, quindi non prova niente.';
  end if;

  raise notice
    '4 PASSA  controllo positivo: filtrando la scadenza anche nel ramo Founder '
    'l''eleggibilita'' tornerebbe a «%», cioe'' il posto si riaprirebbe. Ecco '
    'perche'' quel ramo resta non filtrato.', v_elegg;

  -- e la funzione vera e'' tornata al suo posto
  s := public.get_entitlement_status();
  if (s->>'founderEligibility') <> 'already_has_pro' then
    raise exception '4b FALLISCE  ripristino: la funzione vera non risponde piu'' already_has_pro';
  end if;
  raise notice '4b PASSA  la funzione vera e'' ripristinata';
end
$t$;

\echo 'coppia Founder: sette controlli, tutti verdi.'
