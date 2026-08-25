-- Nessun segreto puo' finire in una tabella che l'utente legge.
--
-- public.b2c_subscriptions ha la policy "self reads own b2c sub": qualunque
-- utente autenticato legge la propria riga via API REST, raw_payload compreso.
-- Fino a ieri claim_store_purchase accettava un parametro `p_raw_payload jsonb`
-- con scritto in un commento che il backend lo passava gia' sanificato.
--
-- Un commento non e' una garanzia. Bastava un chiamante distratto, o un domani
-- in cui quel percorso cambia, perche' dentro raw_payload finisse un JWS, una
-- ricevuta App Store, un purchase token Play o uno shared secret, leggibile
-- dal proprietario dell'account e da chiunque ne ottenga il token di sessione.
--
-- Adesso quel parametro non esiste: il payload lo costruisce la funzione, da
-- valori gia' tipizzati e gia' scritti in colonne proprie. Questi test provano
-- le due meta' della stessa affermazione: che il canale non c'e' piu'
-- (strutturale) e che i canali rimasti non lo diventano (comportamentale).

begin;

do $$
declare
  v_jws text := 'eyJhbGciOiJFUzI1NiIsIng1YyI6WyJNSUlFTURDQ0E3YWdBd0lCQWdJUWZUbGZkMGZOdkZXdnpDMVlJQU5zWGpBS0JnZ3Foa2pPUFFRREF6QjEiXX0.eyJ0cmFuc2FjdGlvbklkIjoiMjAwMDAwMDkwMDAwMDAwMSJ9.MEUCIQDf5xO7Xk';
  v_receipt text := 'MIITugYJKoZIhvcNAQcCoIITqzCCE6cCAQExCzAJBgUrDgMCGgUAMIIDWwYJKoZIhvcNAQcBoIIDTASCA0gxggNEMAoCARQCAQEEAgwA';
  v_play_token text := 'hjklmnopqrstuvwxyzabcdefghij.AO-J1OxK8vN2mQ4rT6uW8yA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0zA';
  v_shared_secret text := 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  v_header text := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  v_nparams int;
  v_njsonb int;
  v_respinti int := 0;
  v_accettati int := 0;
  v_payload jsonb;
  v_leak int;
begin
  insert into auth.users (id, email, created_at)
  values ('00000000-0000-4000-8000-00000000da01'::uuid, 'sanit@example.test', now())
  on conflict (id) do nothing;

  ---------------------------------------------------------------------------
  -- STRUTTURALE: non esiste piu' un parametro capace di trasportare un blob.
  ---------------------------------------------------------------------------
  select count(*) into v_njsonb
  from pg_proc p
     , unnest(p.proargtypes) as t(oid)
  where p.oid = 'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)'::regprocedure
    and t.oid = 'jsonb'::regtype;

  if v_njsonb <> 0 then
    raise exception 'REGRESSIONE: claim_store_purchase ha di nuovo un parametro jsonb. E il canale da cui un segreto arriva in una tabella leggibile.';
  end if;

  select count(*) into v_nparams
  from pg_proc p
  where p.oid = 'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)'::regprocedure;

  if v_nparams <> 1 then
    raise exception 'firma inattesa: la funzione non esiste con la firma senza payload';
  end if;

  ---------------------------------------------------------------------------
  -- COMPORTAMENTALE: i campi liberi che finiscono in raw_payload respingono
  -- qualunque valore a forma di segreto, invece di scriverlo.
  ---------------------------------------------------------------------------
  for i in 1..5 loop
    begin
      perform public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '600000000000000' || i::text,
    p_owner_user_id => '00000000-0000-4000-8000-00000000da01'::uuid,
    p_external_product_id => case i
                                     when 1 then v_jws
                                     when 2 then v_receipt
                                     when 3 then v_play_token
                                     when 4 then v_shared_secret
                                     else v_header
                                   end,
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => now() + interval '365 days',
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
      -- NIENTE raise qui dentro: la prima versione di questo test segnalava
      -- l'accettazione con un'eccezione, che finiva dritta nel gestore
      -- `when others` sotto e veniva contata come RIFIUTO. Il test restava
      -- verde mentre due valori su cinque passavano davvero. Un flag non puo'
      -- essere inghiottito da un exception handler.
      v_accettati := v_accettati + 1;
    exception
      when sqlstate '22023' then
        v_respinti := v_respinti + 1;
      when others then
        -- Un rifiuto per un motivo DIVERSO da quello che stiamo provando non
        -- vale: proverebbe un'altra guardia, non questa.
        raise exception 'caso %: respinto con sqlstate % invece di 22023', i, sqlstate;
    end;
  end loop;

  if v_accettati <> 0 then
    raise exception '% valori a forma di segreto sono stati ACCETTATI', v_accettati;
  end if;
  if v_respinti <> 5 then
    raise exception 'solo % valori su 5 respinti dalla guardia attesa', v_respinti;
  end if;

  ---------------------------------------------------------------------------
  -- Un claim LEGITTIMO scrive un payload, e quel payload non contiene niente
  -- che non sia stato costruito qui dentro.
  ---------------------------------------------------------------------------
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '6000000000009999',
    p_owner_user_id => '00000000-0000-4000-8000-00000000da01'::uuid,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    -- Sentinella, non "fra 10 anni": da B' un lifetime con una scadenza vera
    -- viene respinto dal vincolo di forma, e il claim non scriverebbe niente.
    p_active_until => '9999-12-31T23:59:59Z'::timestamptz,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => v_jws
  );

  select raw_payload into v_payload
  from public.b2c_subscriptions
  where user_id = '00000000-0000-4000-8000-00000000da01'::uuid;

  if v_payload is null then
    raise exception 'nessun payload scritto: il test non sta provando niente';
  end if;

  -- Le chiavi sono ESATTAMENTE quelle costruite dalla funzione. Da B' sono
  -- nove invece di sei: si sono aggiunte purchase_kind, store_state e
  -- store_event_source, tutte e tre derivate da parametri gia' validati e
  -- nessuna capace di trasportare un valore libero. Il numero e' fissato di
  -- proposito: una chiave in piu' che compare senza che nessuno l'abbia
  -- decisa e' esattamente il modo in cui un segreto entra in una tabella che
  -- l'utente legge.
  if (select count(*) from jsonb_object_keys(v_payload)) <> 9 then
    raise exception 'raw_payload ha % chiavi invece di 9: %',
      (select count(*) from jsonb_object_keys(v_payload)), v_payload;
  end if;

  -- E nessuno dei cinque segreti compare da nessuna parte nel payload.
  select count(*) into v_leak
  from (values (v_jws), (v_receipt), (v_play_token), (v_shared_secret), (v_header)) as s(val)
  where v_payload::text like '%' || s.val || '%';

  if v_leak <> 0 then
    raise exception 'raw_payload contiene % segreti passati da fuori: %', v_leak, v_payload;
  end if;

  -- E nemmeno nel registro, che non li riceve proprio.
  select count(*) into v_leak
  from private.billing_purchase_claims c
     , (values (v_jws), (v_receipt), (v_play_token), (v_shared_secret), (v_header)) as s(val)
  where c.ownership_key like '%' || s.val || '%'
     or coalesce(c.external_product_id, '') like '%' || s.val || '%';

  if v_leak <> 0 then
    raise exception 'il registro contiene % segreti', v_leak;
  end if;

  -- Uno SKU inventato ma con la forma giusta: la vecchia guardia lo accettava.
  begin
    perform public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '6000000000008888',
    p_owner_user_id => '00000000-0000-4000-8000-00000000da01'::uuid,
    p_external_product_id => 'fitmesh_pro_inventato',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => now() + interval '1 day',
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
    raise exception 'ACCETTATO uno SKU non supportato con la forma giusta';
  exception
    when sqlstate '22023' then
      null;  -- atteso: l allowlist e per SKU esatti, non per forma
  end;

  raise notice 'sanificazione payload: 5 respinti, SKU inventato respinto, 1 claim legittimo, 0 segreti persistiti';
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / sanificazione: TUTTE LE VERIFICHE OK'
\echo '=================================================='
