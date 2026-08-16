-- ============================================================================
-- L'AUTORITA' SULLE REVOCHE E' UNA SOLA, E NEL DUBBIO LA RIGA RESTA
--
-- Due proprieta' che nessun altro caso copre.
--
-- A. Quando la postcondizione non e' soddisfatta, la pending SOPRAVVIVE.
--    Il caso limite piu' onesto e' "non c'e' nessuno stato registrato": non
--    esiste niente che possa aver persistito la revoca e niente che possa
--    averla superata, quindi non si cancella. Sembra ovvio, e la versione
--    precedente del claim lo sbagliava — cancellava e basta.
--
-- B. Nessun altro puo' cancellare da private.billing_pending_revocations.
--    Questo non si prova leggendo i file delle migration: quelle sono storia,
--    e le vecchie contengono legittimamente la DELETE che oggi non si deve
--    piu' fare. Si prova sui corpi VIVI in pg_proc, che sono cio' che gira.
--    Esaustivo, non campionato, e non si puo' aggirare aggiungendo una
--    funzione nuova: la troverebbe comunque.
--
-- Tutto dentro una transazione chiusa da ROLLBACK: il container e' condiviso.
-- ============================================================================
\set ON_ERROR_STOP on
\timing off

begin;

-- ── A. Nessuno stato registrato: la revoca in attesa non si tocca ──────────
do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-00000000e092';
  v_chiave text := '9200000000000001';
  v_t timestamptz := now() - interval '4 hours';
  v_esito jsonb;
  v_attese int;
  v_consumata boolean;
begin
  raise notice '########### NEL DUBBIO LA RIGA RESTA ###########';

  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key = v_chiave;
  delete from private.billing_purchase_claims where ownership_key = v_chiave;
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_pending_revocations where ownership_key = v_chiave;
  delete from auth.users where id = v_utente;
  insert into auth.users (id, email, created_at)
  values (v_utente, 'dubbio@test.local', now());

  -- Una revoca su una chiave mai reclamata: finisce in attesa.
  v_esito := public.record_store_purchase_revocation(
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    v_t, 'apple_signed_date', v_t
  );
  if v_esito->>'outcome' <> 'unknown_purchase' then
    raise exception 'A PREMESSA FAIL: atteso unknown_purchase, ricevuto %', v_esito->>'outcome';
  end if;

  -- Si reclama la PROPRIETA' ma NON si scrive nessuno stato: e' la finestra
  -- in cui il claim e' passato e la scrittura dello stato non e' avvenuta.
  insert into private.billing_purchase_claims
    (billing_source, ownership_key, external_product_id, environment, owner_user_id)
  values ('apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'production', v_utente);

  -- L'autorita' viene interrogata direttamente: non c'e' stato registrato,
  -- quindi non puo' dire ne' "persistita" ne' "superata".
  v_consumata := private._billing_consuma_pending('apple_iap', v_chiave, v_t);

  if v_consumata then
    raise exception 'A FAIL: la revoca e'' stata consumata senza che nulla l''avesse ne'' applicata ne'' superata';
  end if;

  select count(*) into v_attese
    from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 1 then
    raise exception 'A FAIL: la riga in attesa e'' sparita (righe = %)', v_attese;
  end if;

  raise notice 'A1 PASS: senza stato registrato l''autorita'' non consuma, e la riga resta';

  -- ── A2: e il giro successivo la RITROVA e la applica ────────────────────
  --
  -- Che e' il punto di conservarla. La rete di riserva, sulla stessa
  -- situazione, scrive la revoca nel registro e SOLO ALLORA la consuma: la
  -- postcondizione e' soddisfatta perche' adesso c'e' davvero uno stato
  -- revocato, non perche' qualcuno ha deciso di cancellare.
  perform private.billing_apply_pending_revocations();

  select count(*) into v_attese
    from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'A2 FAIL: la rete di riserva non ha applicato la revoca (righe in attesa = %)', v_attese;
  end if;

  if (select state from private.billing_purchase_states where ownership_key = v_chiave)
     is distinct from 'revoked' then
    raise exception 'A2 FAIL: la riga e'' stata consumata ma lo stato registrato non e'' revocato';
  end if;

  if (select state from public.b2c_subscriptions where user_id = v_utente)
     is distinct from 'expired' then
    raise exception 'A2 FAIL: revoca applicata e il Pro e'' ancora "%"',
      (select state from public.b2c_subscriptions where user_id = v_utente);
  end if;

  raise notice 'A2 PASS: il giro successivo la ritrova, la applica, toglie il Pro, e solo allora la consuma';
end $$;


-- ── B. Una sola funzione viva contiene quella DELETE ───────────────────────
do $$
declare
  r record;
  v_fuori text[] := '{}';
begin
  raise notice '########### UNA SOLA AUTORITA'' ###########';

  for r in
    select n.nspname || '.' || p.proname as nome
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private', 'internal')
      -- Il corpo, normalizzato: spazi variabili e a capo non devono far
      -- sfuggire una scrittura. Si cerca la tabella, non una formattazione.
      and regexp_replace(lower(p.prosrc), '\s+', ' ', 'g')
          like '%delete from private.billing_pending_revocations%'
  loop
    if r.nome <> 'private._billing_consuma_pending' then
      v_fuori := array_append(v_fuori, r.nome);
    end if;
  end loop;

  if array_length(v_fuori, 1) > 0 then
    raise exception
      'B FAIL: % funzioni cancellano da billing_pending_revocations fuori dall''autorita'': %. La postcondizione esiste in un posto solo; una seconda copia diverge, ed e'' gia'' successo.',
      array_length(v_fuori, 1), array_to_string(v_fuori, ', ');
  end if;

  -- E l'autorita' deve esistere davvero: se qualcuno la rinominasse, il
  -- controllo qui sopra passerebbe a vuoto trovando zero funzioni.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = '_billing_consuma_pending'
  ) then
    raise exception 'B FAIL: _billing_consuma_pending non esiste — il controllo sopra sarebbe vuoto e sembrerebbe verde';
  end if;

  raise notice 'B PASS: la DELETE vive solo dentro private._billing_consuma_pending';
end $$;


-- ── C. Nessuno riscrive a mano la regola di precedenza ─────────────────────
--
-- La sorella di B, sull'altra meta' del problema. B impedisce una seconda
-- CANCELLAZIONE; questo impedisce una seconda REGOLA.
--
-- Sono due difetti diversi con la stessa forma, e li abbiamo visti entrambi:
-- 20260814080000 confrontava `s.store_event_at > r.store_event_at`, equivalente
-- al comparatore il giorno in cui fu scritto, ed e' diventato sbagliato quando
-- al comparatore sono stati aggiunti i rami dei segnaposto e della revoca JWS.
-- L'UPSERT sulle pending aveva la stessa forma, con `<`.
--
-- Una copia della regola non diverge quando la scrivi. Diverge quando cambi
-- l'originale, e a quel punto nessuno si ricorda che esisteva.
do $$
declare
  r record;
  v_fuori text[] := '{}';
begin
  raise notice '########### UNA SOLA REGOLA DI PRECEDENZA ###########';

  for r in
    select n.nspname || '.' || p.proname as nome, l.riga
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace,
    lateral (
      select btrim(x) as riga
      from regexp_split_to_table(p.prosrc, E'\n') x
      -- Due valori di evidenza messi a confronto direttamente.
      where lower(x) ~ 'store_event_at\s*[<>]'
        -- I commenti non sono codice: una riga che comincia per `--` racconta,
        -- non decide. Senza questa riga il controllo segnala il commento
        -- storico dentro il trigger forward-only, che e' un falso positivo.
        and btrim(x) not like '--%'
    ) l
    where n.nspname in ('public', 'private', 'internal')
  loop
    -- UNICA ECCEZIONE AMMESSA, e con la ragione scritta accanto: il controllo
    -- di sanita' sul futuro dentro claim_store_purchase. Non confronta due
    -- evidenze fra loro, confronta UNA evidenza con l'orologio, e serve a
    -- rifiutare un timestamp che nessuno store puo' aver prodotto.
    if r.riga not like '%pg_catalog.now()%' then
      v_fuori := array_append(v_fuori, r.nome || ' -> ' || left(r.riga, 90));
    end if;
  end loop;

  if array_length(v_fuori, 1) > 0 then
    raise exception
      'C FAIL: % confronti fra evidenze scritti a mano invece di chiamare private._billing_evidenza_supera: %',
      array_length(v_fuori, 1), array_to_string(v_fuori, ' | ');
  end if;

  raise notice 'C PASS: la precedenza la decide solo _billing_evidenza_supera';
end $$;

rollback;
