-- ============================================================================
-- ROLLBACK di F2 — via l'autorita' canonica: 18 funzioni e 5 trigger.
--
-- PERCHE' NON C'E' UN ELENCO DI `drop function`
-- ---------------------------------------------
-- La prima stesura scriveva le firme a mano. Non e' un errore rumoroso:
-- `drop function if exists` con una firma sbagliata NON fallisce, emette un
-- NOTICE e non fa niente. Tre funzioni sopravvivevano e solo la postcondizione
-- se ne accorgeva.
--
-- Qui l'IDENTITA' (schema, nome) e' dichiarata, perche' dev'essere esplicita e
-- rivedibile; la FIRMA la fornisce il catalogo, perche' indovinarla e' proprio
-- cio' che non ha funzionato. Se una funzione dell'elenco non esiste, si dice e
-- si prosegue: un rollback deve poter girare due volte.
--
-- L'elenco delle diciotto e' DERIVATO: le sei forward-only sono state applicate
-- una per volta su un PG17 ricostruito, guardando il delta dell'impronta.
-- Contarle per nome dava prima 17 e poi 18.
--
-- I trigger vanno prima delle funzioni: dipendono da loro.
-- ============================================================================
drop trigger if exists trg_billing_cancello_sandbox on private.billing_purchase_claims;
drop trigger if exists trg_billing_purchase_claims_immutable on private.billing_purchase_claims;
drop trigger if exists trg_billing_purchase_claims_no_truncate on private.billing_purchase_claims;
drop trigger if exists billing_purchase_states_forward_only on private.billing_purchase_states;
drop trigger if exists trg_billing_permesso_sandbox_cambiato on private.billing_sandbox_reviewers;

do $$
declare
  v_attese constant text[][] := array[
    ['public',  'claim_store_purchase'],
    ['public',  'record_store_purchase_revocation'],
    ['public',  'is_sandbox_reviewer'],
    ['private', 'set_billing_projection_guard_mode'],
    ['private', 'billing_apply_pending_revocations'],
    ['private', 'billing_reconcile_sandbox_projections'],
    ['private', 'billing_teardown_sandbox_reviewer'],
    ['private', '_billing_project_entitlement'],
    ['private', '_billing_consuma_pending'],
    ['private', '_billing_evidenza_supera'],
    ['private', '_billing_chiave_da_proiezione'],
    ['private', '_billing_cancello_sandbox'],
    ['private', '_billing_permesso_sandbox_cambiato'],
    ['private', '_billing_purchase_claims_immutable'],
    ['private', '_billing_purchase_claims_no_truncate'],
    ['private', '_billing_purchase_states_forward_only'],
    ['private', '_billing_lock_prima_di_cancellare_utente'],
    ['private', '_b2c_projection_guard']
  ];
  v_sch text;
  v_fn text;
  v_i int;
  v_tolte int := 0;
  v_assenti int := 0;
  v_firma text;
begin
  if array_length(v_attese, 1) <> 18 then
    raise exception 'ROLLBACK F2: l''elenco dichiara % identita'', ne servono 18', array_length(v_attese, 1);
  end if;

  for v_i in 1 .. array_length(v_attese, 1) loop
    v_sch := v_attese[v_i][1];
    v_fn  := v_attese[v_i][2];

    -- Una funzione puo' esistere in piu' overload: si tolgono tutti.
    for v_firma in
      select pg_catalog.pg_get_function_identity_arguments(p.oid)
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = v_sch and p.proname = v_fn
    loop
      execute format('drop function %I.%I(%s)', v_sch, v_fn, v_firma);
      v_tolte := v_tolte + 1;
    end loop;

    if not found then
      v_assenti := v_assenti + 1;
    end if;
  end loop;

  raise notice 'ROLLBACK F2: % funzioni rimosse, % gia'' assenti', v_tolte, v_assenti;
end $$;

do $$
declare v_resti text;
begin
  -- Il controllo NON filtra per prefisso: rilegge le stesse identita' dichiarate
  -- sopra. Un filtro per nome e' cio' che ha gia' lasciato passare
  -- private._b2c_no_truncate in un'altra occasione.
  select coalesce(string_agg(n.nspname || '.' || p.proname, ', ' order by p.proname), '')
    into v_resti
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where (n.nspname, p.proname) in (
    ('public','claim_store_purchase'), ('public','record_store_purchase_revocation'),
    ('public','is_sandbox_reviewer'), ('private','set_billing_projection_guard_mode'),
    ('private','billing_apply_pending_revocations'), ('private','billing_reconcile_sandbox_projections'),
    ('private','billing_teardown_sandbox_reviewer'), ('private','_billing_project_entitlement'),
    ('private','_billing_consuma_pending'), ('private','_billing_evidenza_supera'),
    ('private','_billing_chiave_da_proiezione'), ('private','_billing_cancello_sandbox'),
    ('private','_billing_permesso_sandbox_cambiato'), ('private','_billing_purchase_claims_immutable'),
    ('private','_billing_purchase_claims_no_truncate'), ('private','_billing_purchase_states_forward_only'),
    ('private','_billing_lock_prima_di_cancellare_utente'), ('private','_b2c_projection_guard')
  );
  if v_resti <> '' then
    raise exception 'ROLLBACK F2: funzioni sopravvissute: %', v_resti;
  end if;

  select coalesce(string_agg(tgname, ', ' order by tgname), '') into v_resti
  from pg_catalog.pg_trigger
  where not tgisinternal and tgname in (
    'trg_billing_cancello_sandbox', 'trg_billing_purchase_claims_immutable',
    'trg_billing_purchase_claims_no_truncate', 'billing_purchase_states_forward_only',
    'trg_billing_permesso_sandbox_cambiato');
  if v_resti <> '' then
    raise exception 'ROLLBACK F2: trigger sopravvissuti: %', v_resti;
  end if;

  raise notice 'ROLLBACK F2: 18 funzioni e 5 trigger rimossi, nessun sopravvissuto';
end $$;
