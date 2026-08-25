-- ============================================================================
-- IL CICLO DI VITA DI UNA CONSEGNA DELLO STORE
-- ============================================================================
-- La postcondizione di F5 gia' esercita questi stati, ma gira una volta sola,
-- al momento dell'applicazione. Un invariante che vale solo il giorno in cui
-- e' stato scritto non e' un invariante: e' un ricordo. Questo file lo
-- riesegue a ogni suite.
--
-- La distinzione che conta e' fra `in_corso` e `gia_applicata`. Confonderle
-- non produce nessun errore visibile: produce la perdita silenziosa
-- dell'effetto di ogni notifica il cui primo tentativo e' morto a meta'.
-- ============================================================================
begin;

do $$
declare
  v1 text; v2 text; v3 text;
  v_chiusa boolean;
  v_richiusa boolean;
  v_consegne int;
  v_esito text;
  v_ko int := 0;
  v_id constant text := 'TEST-NOTIFICHE-0001';
begin
  -- 1. prima consegna
  v1 := public.apri_notifica_store('apple', v_id, 'REFUND', null);
  if v1 = 'nuova' then
    raise notice '  1 PASSA  la prima consegna e'' nuova';
  else
    v_ko := v_ko + 1; raise warning '  1 FALLISCE  atteso «nuova», ottenuto «%»', v1;
  end if;

  -- 2. riconsegna prima della chiusura
  v2 := public.apri_notifica_store('apple', v_id, 'REFUND', null);
  if v2 = 'in_corso' then
    raise notice '  2 PASSA  la riconsegna non chiusa e'' «in_corso», non «gia_applicata»';
  else
    v_ko := v_ko + 1;
    raise warning '  2 FALLISCE  atteso «in_corso», ottenuto «%». Cosi'' l''effetto di una notifica morta a meta'' andrebbe perso per sempre.', v2;
  end if;

  -- 3. il contatore delle consegne sale
  select consegne into v_consegne
  from private.billing_store_notifications
  where store = 'apple' and notification_id = v_id;
  if v_consegne = 2 then
    raise notice '  3 PASSA  il contatore delle consegne dice 2';
  else
    v_ko := v_ko + 1; raise warning '  3 FALLISCE  consegne = %, atteso 2', v_consegne;
  end if;

  -- 4. chiusura
  v_chiusa := public.chiudi_notifica_store('apple', v_id, 'applicata', 'apple_iap', 'CHIAVE', now());
  if v_chiusa then
    raise notice '  4 PASSA  la chiusura di una notifica aperta riesce';
  else
    v_ko := v_ko + 1; raise warning '  4 FALLISCE  la chiusura ha risposto false';
  end if;

  -- 5. dopo la chiusura, la riconsegna e' un replay
  v3 := public.apri_notifica_store('apple', v_id, 'REFUND', null);
  if v3 = 'gia_applicata' then
    raise notice '  5 PASSA  dopo la chiusura la riconsegna e'' «gia_applicata»';
  else
    v_ko := v_ko + 1; raise warning '  5 FALLISCE  atteso «gia_applicata», ottenuto «%»', v3;
  end if;

  -- 6. un esito chiuso non si sovrascrive
  v_richiusa := public.chiudi_notifica_store('apple', v_id, 'rifiutata');
  select esito into v_esito
  from private.billing_store_notifications
  where store = 'apple' and notification_id = v_id;
  if not v_richiusa and v_esito = 'applicata' then
    raise notice '  6 PASSA  una notifica gia'' chiusa non si richiude, e l''esito resta il primo';
  else
    v_ko := v_ko + 1;
    raise warning '  6 FALLISCE  richiusa=% esito=%', v_richiusa, v_esito;
  end if;

  -- 7. senza identificatore di consegna non si apre niente
  begin
    perform public.apri_notifica_store('apple', '   ', 'REFUND', null);
    v_ko := v_ko + 1;
    raise warning '  7 FALLISCE  un identificatore vuoto e'' stato accettato: senza, l''idempotenza non esiste';
  exception when others then
    raise notice '  7 PASSA  un identificatore vuoto viene rifiutato';
  end;

  -- 8. uno store che non conosciamo viene rifiutato
  begin
    perform public.apri_notifica_store('qualcunaltro', 'X-1', null, null);
    v_ko := v_ko + 1;
    raise warning '  8 FALLISCE  uno store sconosciuto e'' stato accettato';
  exception when others then
    raise notice '  8 PASSA  uno store sconosciuto viene rifiutato';
  end;

  -- 9. CONTROLLO POSITIVO: i due store veri passano entrambi. Senza questo,
  --    una funzione che rifiuta chiunque supererebbe il controllo 8.
  if public.apri_notifica_store('google', 'TEST-NOTIFICHE-GOOGLE', 'VOIDED_PURCHASE', null) = 'nuova'
  then
    raise notice '  9 PASSA  controllo positivo: anche «google» viene accettato';
  else
    v_ko := v_ko + 1; raise warning '  9 FALLISCE  «google» rifiutato: la funzione dice no a tutto';
  end if;

  if v_ko > 0 then
    raise exception 'notifiche store: % controlli falliti', v_ko;
  end if;
  raise notice 'notifiche store: nove controlli, tutti verdi.';
end $$;

rollback;
