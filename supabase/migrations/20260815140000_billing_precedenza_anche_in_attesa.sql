-- ============================================================================
-- LA PRECEDENZA SI CHIEDE SEMPRE ALLA STESSA FUNZIONE, ANCHE FRA DUE PENDING
--
-- 20260815120000 ha reso unica l'autorita' che CANCELLA una revoca in attesa.
-- Restava fuori una cosa piu' piccola e della stessa famiglia: l'UPSERT sulla
-- tabella delle revoche in attesa decideva da solo quale fra due revoche per
-- la stessa chiave dovesse sopravvivere, con un `<` scritto a mano.
--
-- ONESTA' SUL PERIMETRO: oggi le due forme sono EQUIVALENTI. Entrambe le
-- evidenze sono revoche, e il CHECK sulla tabella ammette solo fonti reali
-- (apple_signed_date, apple_request_date, google_backend_fetch), mai i
-- segnaposto — quindi tutti i rami speciali del comparatore sono
-- irraggiungibili e resta l'ultimo, che e' esattamente `nuova > vecchia`.
-- Nessun test puo' distinguere le due versioni, e infatti non ne scrivo uno:
-- sarebbe un test che dichiara di provare una cosa e ne prova un'altra, che e'
-- il difetto che questo lavoro ha gia' incontrato cinque volte.
--
-- Si toglie lo stesso, e la ragione e' storica, non ipotetica: in
-- 20260814080000 c'era un altro confronto scritto a mano, anch'esso equivalente
-- al comparatore il giorno in cui fu scritto. E' diventato sbagliato quando al
-- comparatore sono stati aggiunti i rami dei segnaposto e quello della revoca
-- JWS. Una copia della regola non diverge quando la scrivi: diverge quando
-- cambi l'originale.
--
-- La difesa vera e' strutturale ed e' in 92-autorita-unica-revoche.sql, che
-- ora controlla anche questa classe sui corpi vivi in pg_proc.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_store_purchase_revocation(p_billing_source text, p_ownership_key text, p_external_product_id text, p_purchase_kind text, p_store_event_at timestamp with time zone, p_store_event_source text, p_revocation_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_owner uuid;
  v_owner_recheck uuid;
  v_claim_apparso boolean := false;
  v_applied boolean := false;
  v_persisted boolean := false;
  v_entitlement jsonb;
  v_sqlstate text;
  v_message text;
begin
  if p_billing_source is null or p_billing_source not in ('apple_iap', 'google_play') then
    raise exception 'record_store_purchase_revocation: p_billing_source deve essere apple_iap o google_play (ricevuto %)', p_billing_source
      using errcode = '22023';
  end if;
  if p_ownership_key is null or length(p_ownership_key) = 0 then
    raise exception 'record_store_purchase_revocation: p_ownership_key obbligatorio' using errcode = '22004';
  end if;
  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'record_store_purchase_revocation: SKU non supportato' using errcode = '22023';
  end if;
  if p_purchase_kind is null or p_purchase_kind not in ('lifetime', 'subscription') then
    raise exception 'record_store_purchase_revocation: p_purchase_kind non valido' using errcode = '22023';
  end if;
  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'record_store_purchase_revocation: freschezza obbligatoria' using errcode = '22004';
  end if;
  if p_store_event_source not in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch') then
    raise exception 'record_store_purchase_revocation: p_store_event_source "%" non e'' un orologio di store.', p_store_event_source
      using errcode = '22023';
  end if;

  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if not found then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
    );

    select c.owner_user_id into v_owner
    from private.billing_purchase_claims c
    where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

    v_claim_apparso := found;

    -- Il fatto si scrive in ogni caso, e questo e' cio' che rende lecita una
    -- risposta terminale: non stiamo affermando che nessun claim esista, ma
    -- che qualunque claim arrivi si trovera' addosso questa revoca.
    insert into private.billing_pending_revocations (
      billing_source, ownership_key, external_product_id, purchase_kind,
      store_event_at, store_event_source, revocation_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      p_store_event_at, p_store_event_source, p_revocation_at
    )
    on conflict (billing_source, ownership_key) do update set
      external_product_id = excluded.external_product_id,
      purchase_kind       = excluded.purchase_kind,
      store_event_at      = excluded.store_event_at,
      store_event_source  = excluded.store_event_source,
      revocation_at       = excluded.revocation_at,
      recorded_at         = pg_catalog.now()
    -- Fra due evidenze in attesa vince la fotografia piu' recente, come
    -- ovunque nel registro — e ORA lo chiede alla stessa funzione di tutti gli
    -- altri, invece di riscrivere la regola con un `<`.
    --
    -- Entrambe le evidenze sono revoche, quindi oggi il comparatore si riduce
    -- proprio a "vince il timestamp piu' recente": il comportamento NON cambia,
    -- e nessun test puo' distinguere le due forme. Non e' una correzione, e'
    -- la rimozione di una seconda copia della regola.
    --
    -- Perche' toglierla se e' identica: perche' lo era anche l'altra, in
    -- 20260814080000, finche' qualcuno non ha aggiunto un ramo che valeva solo
    -- per una delle due. La copia scritta a mano non diverge il giorno in cui
    -- la scrivi, diverge il giorno in cui cambi l'originale.
    where private._billing_evidenza_supera(
            private.billing_pending_revocations.store_event_source,
            private.billing_pending_revocations.store_event_at,
            'revoked',
            excluded.store_event_source,
            excluded.store_event_at,
            'revoked');

    if v_claim_apparso then
      -- Il claim ha committato mentre aspettavamo la chiave. La revoca e' al
      -- sicuro, ma NON e' stata applicata: la risposta non e' terminale.
      return pg_catalog.jsonb_build_object(
        'outcome', 'claim_in_flight',
        'applied', false,
        'persisted', false,
        'pendingRegistrata', true
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'outcome', 'unknown_purchase',
      'applied', false,
      'persisted', false,
      -- Dichiarato, perche' e' la differenza fra una risposta terminale lecita
      -- e una scommessa: il rimborso e' scritto e aspetta il suo acquisto.
      'pendingRegistrata', true
    );
  end if;

  if v_owner is null then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  -- ORDINE UNICO DEI LOCK — gradini 0 e 1, prima degli advisory. La lettura
  -- del proprietario qui sopra e' una lettura semplice e non prende lock: puo'
  -- essere stale, ed e' esattamente per questo che sotto c'e' una rilettura
  -- dopo gli advisory. Vedi il blocco in testa a 20260812093000.
  perform 1 from auth.users u where u.id = v_owner for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = v_owner for update;

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(v_owner::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  select c.owner_user_id into v_owner_recheck
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if v_owner_recheck is null or v_owner_recheck <> v_owner then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  begin
    insert into private.billing_purchase_states (
      billing_source, ownership_key, external_product_id, purchase_kind,
      state, active_until, auto_renewing,
      store_event_at, store_event_source, revocation_at, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      'revoked',
      case when p_purchase_kind = 'lifetime'
           then '9999-12-31T23:59:59Z'::timestamptz
           else p_store_event_at end,
      false,
      p_store_event_at, p_store_event_source,
      coalesce(p_revocation_at, p_store_event_at), pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      state              = 'revoked',
      auto_renewing      = false,
      store_event_at     = excluded.store_event_at,
      store_event_source = excluded.store_event_source,
      revocation_at      = excluded.revocation_at,
      verified_at        = excluded.verified_at
    -- Ordinata per fotografia, come tutto il resto. Non c'e' piu' nessuna
    -- eccezione "la revoca vince sempre": con `store_event_at` finalmente
    -- valorizzato col signedDate (e non col revocationDate, che e' anteriore
    -- per costruzione) la revoca e' una fotografia recente e vince da sola.
    -- E deve poter perdere: REFUND_REVERSED e' una fotografia ancora piu'
    -- recente che ripristina l'accesso.
    where private._billing_evidenza_supera(
            private.billing_purchase_states.store_event_source,
            private.billing_purchase_states.store_event_at,
            private.billing_purchase_states.state,
            excluded.store_event_source,
            excluded.store_event_at,
            excluded.state);

    v_applied := found;

    -- `applied = false` non basta a dire che la revoca sia registrata: puo'
    -- voler dire "era gia' revocato" (persistito) oppure "non ho scritto"
    -- (non persistito). Chi legge deve poterli distinguere, perche' su questo
    -- codice il client CHIUDE la transazione.
    select s.state = 'revoked' into v_persisted
    from private.billing_purchase_states s
    where s.billing_source = p_billing_source and s.ownership_key = p_ownership_key;

    v_entitlement := private._billing_project_entitlement(v_owner);

  exception
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'applied', false,
        'sqlstate', v_sqlstate,
        'message', v_message
      );
  end;

  -- L'esito distingue "la revoca e' nel registro" da "non sono riuscito a
  -- scriverla". Solo il primo autorizza una risposta terminale al client.
  return pg_catalog.jsonb_build_object(
    'outcome', case when v_persisted then 'revoked' else 'not_persisted' end,
    'applied', v_applied,
    'persisted', coalesce(v_persisted, false),
    'entitlement', v_entitlement
  );
end;
$function$;
