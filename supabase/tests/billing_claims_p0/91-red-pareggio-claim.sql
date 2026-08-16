-- ============================================================================
-- RED — IL CLAIM CANCELLA LA REVOCA IN ATTESA SENZA AVERLA APPLICATA
--
-- 20260814140000 ha reso canonica la postcondizione della RETE DI RISERVA:
-- una riga in attesa si cancella SOLO se e' stata persistita o se e' stata
-- superata secondo `_billing_evidenza_supera`. La stessa regola manca nel
-- percorso che i commenti chiamano principale: `claim_store_purchase` fa una
-- DELETE incondizionata (20260813150000:579), subito dopo un UPSERT che ha una
-- clausola WHERE e puo' benissimo non aver scritto niente.
--
-- Il commento sopra la DELETE dice:
--     "Consumata: applicata o battuta da un'evidenza piu' recente"
-- E' una disgiunzione che il codice non verifica. Quando entrambi i membri
-- sono falsi la riga sparisce lo stesso, e li' dentro c'era l'ULTIMA copia del
-- rimborso: il claim raccoglie le pending dentro la propria transazione,
-- quindi dopo la DELETE la rete di riserva non ha piu' niente da riprovare.
--
-- IL PAREGGIO NON E' UN CASO DI LABORATORIO. E' la forma normale di una
-- risposta verifyReceipt che contiene insieme una transazione viva e una
-- annullata dello stesso prodotto (un rinnovo rimborsato accanto a quello
-- corrente). La route legacy passa LO STESSO `result.requestDateMs` a
-- entrambe le chiamate e la stessa `apple_request_date` come sorgente:
--   - registraAnnullate   -> route.ts:814-820
--   - claim               -> route.ts:866-867 (storeEventAt/storeEventSource)
-- e il comparatore, misurato sulla funzione viva con letterali sintetici:
--   supera('apple_request_date', T, 'active', 'apple_request_date', T, 'revoked') = f
-- perche' sul pareggio l'ultimo ramo e' `p_nuova_at > p_vecchia_at`.
--
-- Esito con il codice attuale: stato 'active', zero righe in attesa, rimborso
-- inesistente, cliente rimborsato che resta Pro per sempre. Ed e' asimmetrico:
-- con gli stessi identici input ma l'acquisto GIA' reclamato la revoca arriva
-- per prima e vince. Due esiti opposti a parita' di evidenze — cioe' proprio
-- la divergenza fra due copie della stessa decisione che 20260814140000
-- dichiara di aver chiuso.
--
-- Questo caso e' RED: deve fallire finche' la DELETE non prende la stessa
-- postcondizione canonica della rete di riserva.
--
-- Tutto dentro una transazione chiusa da ROLLBACK: il container e' condiviso.
-- ============================================================================
\set ON_ERROR_STOP on
\timing off

begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-00000000e091';
  v_chiave text := '9100000000000001';
  -- Un solo istante, passato a entrambe le chiamate: e' quello che fa la route.
  v_t timestamptz := now() - interval '3 hours';
  v_esito jsonb;
  v_stato text;
  v_attese int;
  v_proiettato text;
begin
  raise notice '########### PAREGGIO: IL CLAIM E LA REVOCA NELLO STESSO ISTANTE ###########';

  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key = v_chiave;
  delete from private.billing_purchase_claims where ownership_key = v_chiave;
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_pending_revocations where ownership_key = v_chiave;
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id = v_utente;
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id = v_utente;
  insert into auth.users (id, email, created_at)
  values (v_utente, 'pareggio@test.local', now());

  -- ── 1. Il rimborso arriva su una chiave mai reclamata: va in attesa. ─────
  v_esito := public.record_store_purchase_revocation(
    'apple_iap', v_chiave, 'fitmesh_pro_sub', 'subscription',
    v_t, 'apple_request_date', v_t
  );
  if v_esito->>'outcome' <> 'unknown_purchase' then
    raise exception 'PREMESSA FAIL: atteso unknown_purchase, ricevuto %', v_esito->>'outcome';
  end if;
  select count(*) into v_attese
    from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 1 then
    raise exception 'PREMESSA FAIL: la revoca non e'' in attesa (righe = %)', v_attese;
  end if;

  -- ── 2. Lo stesso payload porta il claim: stesso istante, stessa sorgente.
  v_esito := public.claim_store_purchase(
    'apple_iap', v_chiave, v_utente, 'fitmesh_pro_sub', 'subscription',
    'production', 'active', now() + interval '30 days', true,
    v_t, 'apple_request_date', null, null
  );
  if v_esito->>'outcome' <> 'claimed' then
    raise exception 'PREMESSA FAIL: il claim non ha reclamato (%)', v_esito->>'outcome';
  end if;

  select state into v_stato
    from private.billing_purchase_states where ownership_key = v_chiave;
  select count(*) into v_attese
    from private.billing_pending_revocations where ownership_key = v_chiave;
  select state into v_proiettato
    from public.b2c_subscriptions where user_id = v_utente;

  -- ── 3. LA PROPRIETA': il rimborso non puo' smettere di esistere. ─────────
  --
  -- Due esiti sono accettabili, e sono entrambi coerenti:
  --   a) la revoca ha vinto  -> stato 'revoked', niente piu' in attesa;
  --   b) il claim ha vinto   -> stato 'active', ma la revoca RESTA in attesa
  --      e la rete di riserva la riprovera'.
  -- Non e' accettabile il terzo: stato 'active' E niente in attesa, cioe' il
  -- rimborso cancellato senza essere ne' applicato ne' superato.
  if v_stato = 'active' and v_attese = 0 then
    raise exception
      'FAIL: il rimborso e'' sparito. Stato registrato "%", righe in attesa %, diritto proiettato "%". La DELETE di claim_store_purchase ha consumato l''ultima copia della revoca senza applicarla e senza che fosse superata.',
      v_stato, v_attese, v_proiettato;
  end if;

  -- A PARITA' DI EVIDENZA LA REVOCA VINCE, e questo caso lo pretende.
  --
  -- La prima stesura accettava anche "il claim ha vinto ma la revoca resta in
  -- attesa": sembrava prudente, e invece era cieca due volte. Lasciava passare
  -- il ritorno al maggiore STRETTO nel comparatore — con cui il rimborso non
  -- entra mai e la riga viene ririprovata ogni dieci minuti per sempre, mentre
  -- il cliente rimborsato resta Pro — e rendeva innocua la DELETE
  -- incondizionata, perche' con la revoca applicata dall'UPSERT quella DELETE
  -- non toglie piu' niente di importante. Due mutazioni sopravvivevano.
  --
  -- Un rimborso a parita' di istante non e' un caso ambiguo da conservare: e'
  -- un rimborso. Va applicato.
  if v_stato is distinct from 'revoked' then
    raise exception
      'FAIL: sul pareggio la revoca ha perso. Stato registrato "%", righe in attesa %, diritto proiettato "%". A parita'' di evidenza il rimborso deve vincere, altrimenti non entra mai e la riga resta bloccata a ogni giro del cron.',
      v_stato, v_attese, v_proiettato;
  end if;
  if v_attese <> 0 then
    raise exception 'FAIL: revoca applicata ma la riga in attesa e'' ancora li'' (righe = %)', v_attese;
  end if;
  if v_proiettato is distinct from 'expired' then
    raise exception 'FAIL: revoca applicata e il Pro e'' ancora "%"', v_proiettato;
  end if;

  raise notice 'OK: sul pareggio la revoca vince, la riga e'' consumata, il Pro e'' tolto';
end $$;

rollback;
