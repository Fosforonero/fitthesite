-- Il ramo appReview di private.entitlement_core deve essere il PRIMO.
--
-- Non basta chiedere «l'indirizzo di revisione ottiene appReview?»: quella
-- domanda risponde si' anche se il ramo sta in fondo, purche' l'account non
-- abbia nessun altro titolo. Il difetto reale era proprio questo, ed e'
-- rimasto invisibile per mesi: fino al 18/08/2026 il ramo stava dopo founder,
-- e l'unico conto di revisione vero aveva un grant founder, quindi veniva
-- intercettato prima e non otteneva MAI appReview.
--
-- La domanda giusta e' quindi: «lo ottiene NONOSTANTE un grant founder?».
--
-- La catena delle migration fermava entitlement_core alla 20260816124508, con
-- il ramo penultimo e un solo indirizzo. La produzione era stata corretta a
-- mano il 18/08 e nessuna migration lo registrava: una ricostruzione da zero
-- avrebbe riportato il difetto. Registrato da
-- 20260825120008_entitlement_core_ramo_appreview_in_testa.sql.
--
-- Nessuna identita' reale in questo file: gli indirizzi di revisione sono
-- configurazione dell'applicazione, gia' presenti in lib/core/auth/admin.dart
-- e nel corpo vivo della funzione. Gli altri utenti sono sintetici .invalid.

\set ON_ERROR_STOP on

delete from public.user_roles where user_id in (
  'ea111111-1111-1111-1111-111111111111',
  'ea222222-2222-2222-2222-222222222222',
  'ea333333-3333-3333-3333-333333333333');
delete from auth.users where id in (
  'ea111111-1111-1111-1111-111111111111',
  'ea222222-2222-2222-2222-222222222222',
  'ea333333-3333-3333-3333-333333333333');

-- created_at ben oltre la prova, cosi' nessun ramo 'trial' puo' mascherare
-- l'esito: se un account risulta abilitato, e' per il ramo che stiamo
-- esaminando e non perche' e' appena nato.
insert into auth.users (id, email, created_at) values
  ('ea111111-1111-1111-1111-111111111111','review@fitmesh.fit',        '2026-01-01T00:00:00Z'::timestamptz),
  ('ea222222-2222-2222-2222-222222222222','appreview.demo@fitmesh.fit','2026-01-01T00:00:00Z'::timestamptz),
  ('ea333333-3333-3333-3333-333333333333','normale@prova.invalid',     '2026-01-01T00:00:00Z'::timestamptz);

do $t$
declare
  k text;
  n int := 0;
begin
  -- =========================================================================
  -- 1. review@ CON grant founder -> appReview, non founder
  --    E' il caso che il difetto sbagliava. Se il ramo tornasse in fondo,
  --    questo test diventerebbe rosso e nessun altro se ne accorgerebbe.
  -- =========================================================================
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('ea111111-1111-1111-1111-111111111111','pro', null, 'founder-launch');

  k := private.entitlement_core('ea111111-1111-1111-1111-111111111111')->>'kind';
  if k <> 'appReview' then
    raise exception '1 FALLISCE  review@ con grant founder: atteso appReview, ottenuto %  (il ramo non e'' in testa)', k;
  end if;
  n := n + 1; raise notice '1 PASSA  review@ CON grant founder -> appReview (il ramo e'' in testa)';

  -- =========================================================================
  -- 2. review@ SENZA alcun titolo -> appReview lo stesso
  --    Questo caso passava anche col difetto: sta qui per completezza, non
  --    come prova. Da solo non dimostra niente.
  -- =========================================================================
  delete from public.user_roles where user_id = 'ea111111-1111-1111-1111-111111111111';
  k := private.entitlement_core('ea111111-1111-1111-1111-111111111111')->>'kind';
  if k <> 'appReview' then
    raise exception '2 FALLISCE  review@ senza titoli: atteso appReview, ottenuto %', k;
  end if;
  n := n + 1; raise notice '2 PASSA  review@ senza titoli -> appReview (passava anche prima: non prova nulla da solo)';

  -- =========================================================================
  -- 3. il secondo indirizzo, quello demo, con grant founder -> appReview
  -- =========================================================================
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('ea222222-2222-2222-2222-222222222222','pro', null, 'founder-launch');
  k := private.entitlement_core('ea222222-2222-2222-2222-222222222222')->>'kind';
  if k <> 'appReview' then
    raise exception '3 FALLISCE  appreview.demo@ con grant founder: atteso appReview, ottenuto %', k;
  end if;
  n := n + 1; raise notice '3 PASSA  appreview.demo@ CON grant founder -> appReview';

  -- =========================================================================
  -- 4. un utente qualunque con grant founder -> founder, NON appReview
  --    Controllo di segno opposto: il ramo in testa non deve abilitare tutti.
  -- =========================================================================
  insert into public.user_roles (user_id, role, expires_at, note)
  values ('ea333333-3333-3333-3333-333333333333','pro', null, 'founder-launch');
  k := private.entitlement_core('ea333333-3333-3333-3333-333333333333')->>'kind';
  if k <> 'founder' then
    raise exception '4 FALLISCE  utente normale con grant founder: atteso founder, ottenuto %  (il ramo appReview cattura troppo)', k;
  end if;
  n := n + 1; raise notice '4 PASSA  utente normale con grant founder -> founder (il ramo non cattura troppo)';

  -- =========================================================================
  -- 5. utente qualunque senza titoli e fuori prova -> none
  -- =========================================================================
  delete from public.user_roles where user_id = 'ea333333-3333-3333-3333-333333333333';
  k := private.entitlement_core('ea333333-3333-3333-3333-333333333333')->>'kind';
  if k <> 'none' then
    raise exception '5 FALLISCE  utente senza titoli fuori prova: atteso none, ottenuto %', k;
  end if;
  n := n + 1; raise notice '5 PASSA  utente senza titoli fuori prova -> none';

  raise notice '--- entitlement_core: % controlli, tutti verdi ---', n;
end
$t$;

-- ===========================================================================
-- CONTROLLO POSITIVO
--
-- Si ricostruisce la forma PRE-18/08 — ramo appReview in fondo, un solo
-- indirizzo — e si pretende che il caso 1 diventi 'founder'. Se restasse
-- 'appReview' anche cosi', il test non dipenderebbe dalla posizione del ramo
-- e il suo verde non significherebbe niente.
--
-- La funzione vera viene ripristinata subito dopo, e la prova che sia
-- tornata al suo posto e' l'ultima riga.
-- ===========================================================================
do $cp$
declare
  k_prima text;
  k_dopo  text;
  def_vera text;
begin
  def_vera := pg_get_functiondef('private.entitlement_core(uuid)'::regprocedure);

  insert into public.user_roles (user_id, role, expires_at, note)
  values ('ea111111-1111-1111-1111-111111111111','pro', null, 'founder-launch');
  k_prima := private.entitlement_core('ea111111-1111-1111-1111-111111111111')->>'kind';

  -- variante mutilata: il ramo appReview scende in fondo
  create or replace function private.entitlement_core(p_user_id uuid)
  returns jsonb language plpgsql stable security definer set search_path to ''
  as $mutila$
  declare
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_email text; v_kind text;
  begin
    select u.email into v_email from auth.users u where u.id = p_user_id;
    if exists (select 1 from public.user_roles r
                where r.user_id = p_user_id and r.role = 'pro' and r.note = 'founder-launch'
                  and (r.expires_at is null or r.expires_at > v_now)) then
      v_kind := 'founder';
    elsif lower(v_email) = 'appreview.demo@fitmesh.fit' then
      v_kind := 'appReview';
    else
      v_kind := 'none';
    end if;
    return jsonb_build_object('kind', v_kind, 'hasFullAccess', v_kind <> 'none');
  end;
  $mutila$;

  k_dopo := private.entitlement_core('ea111111-1111-1111-1111-111111111111')->>'kind';

  execute def_vera;   -- ripristino PRIMA di qualunque verdetto

  if k_prima <> 'appReview' then
    raise exception 'CONTROLLO POSITIVO ROTTO: la funzione vera non dava appReview (%)', k_prima;
  end if;
  if k_dopo <> 'founder' then
    raise exception 'CONTROLLO POSITIVO ROTTO: con il ramo in fondo atteso founder, ottenuto %. Il test non dipende dalla posizione del ramo.', k_dopo;
  end if;
  raise notice '6 PASSA  controllo positivo: col ramo in fondo review@ torna «founder». Il caso 1 dipende davvero dalla posizione.';

  if private.entitlement_core('ea111111-1111-1111-1111-111111111111')->>'kind' <> 'appReview' then
    raise exception '6b FALLISCE  la funzione vera non e'' stata ripristinata';
  end if;
  raise notice '6b PASSA  la funzione vera e'' ripristinata';
  raise notice 'entitlement_core: sette controlli, tutti verdi.';
end
$cp$;

delete from public.user_roles where user_id in (
  'ea111111-1111-1111-1111-111111111111',
  'ea222222-2222-2222-2222-222222222222',
  'ea333333-3333-3333-3333-333333333333');
delete from auth.users where id in (
  'ea111111-1111-1111-1111-111111111111',
  'ea222222-2222-2222-2222-222222222222',
  'ea333333-3333-3333-3333-333333333333');
